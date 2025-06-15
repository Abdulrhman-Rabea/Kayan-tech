import { account, databases, Query } from '../scripts/appwrite-config.js';

// Global variables
let isDarkMode = false;
let currentUserId = null;
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let agents = [];
let currentProfilePicFile = null;
const MOCK_CURRENT_PASSWORD = "password123"; // For demo purposes
const AGENTS_PER_PAGE = 20; // Number of agents to load per page
let currentPage = 0;
let isLoadingMore = false;
let hasMoreAgents = true;

const signoutBTN = document.querySelector('.signoutBTN');

// Expose functions to global scope
window.showPage = function (pageId) {
    document.querySelectorAll(".page-content").forEach((e) => {
        e.classList.add("hidden");
        e.classList.remove("active");
    });
    document.getElementById(pageId).classList.remove("hidden");
    document.getElementById(pageId).classList.add("active");

    document.querySelectorAll("#sidebar button").forEach((e) => {
        e.classList.remove("bg-blue-600", "shadow-md");
        e.classList.add("hover:bg-gray-700");
    });

    document.querySelector(`#sidebar button[onclick="showPage('${pageId}')"]`).classList.add("bg-blue-600", "shadow-md");
    document.querySelector(`#sidebar button[onclick="showPage('${pageId}')"]`).classList.remove("hover:bg-gray-700");

    document.getElementById("sidebar").classList.add("-translate-x-full");
    document.getElementById("menu-toggle").innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-menu"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>';
};

window.togglePasswordVisibility = function (inputId) {
    let input = document.getElementById(inputId);
    let icon = document.getElementById(`${inputId}-toggle-icon`);

    if (input.type === "password") {
        input.type = "text";
        icon.innerHTML = '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>';
        icon.setAttribute("data-lucide", "eye-off");
    } else {
        input.type = "password";
        icon.innerHTML = '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>';
        icon.setAttribute("data-lucide", "eye");
    }
};

function showToast(e, t = "info", s = 3e3) {
    let r =
        document.getElementById("toast-container") ||
        (() => {
            let e = document.createElement("div");
            return (e.id = "toast-container"), document.body.appendChild(e), e;
        })(),
        a = document.createElement("div");
    (a.className = `toast toast-${t}`),
        (a.innerHTML = `
                ${"success" === t
                ? '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-circle"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>'
                : ""
            }
                ${"error" === t
                ? '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-circle"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>'
                : ""
            }
                ${"info" === t
                ? '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-info"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>'
                : ""
            }
                <span>${e}</span>
                <button class="ml-auto p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors" onclick="this.parentElement.remove()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
            `),
        r.appendChild(a),
        a.offsetWidth,
        a.classList.add("show"),
        setTimeout(() => {
            a.classList.remove("show"), a.addEventListener("transitionend", () => a.remove());
        }, s);
}
function updateDashboardUserId() {
    (document.getElementById("dashboard-user-id").textContent = currentUserId), (document.getElementById("user-id-display").textContent = currentUserId);
}
function renderTasks() {
    let e = document.getElementById("tasks-list");
    if (((e.innerHTML = ""), 0 === tasks.length)) {
        e.innerHTML = '<p class="col-span-full text-center text-gray-600 dark:text-gray-300">No tasks added yet. Click the "➕" button to add one!</p>';
        return;
    }
    tasks.sort((e, t) => e.createdAt - t.createdAt),
        tasks.forEach((t) => {
            let s = document.createElement("div");
            (s.className = `bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer border border-gray-200 dark:border-gray-700 ${"Completed" === t.status ? "opacity-70" : ""}`),
                s.setAttribute("data-task-id", t.id);
            let r = "text-gray-500";
            "Completed" === t.status ? (r = "text-green-600 dark:text-green-400") : "In Progress" === t.status ? (r = "text-blue-600 dark:text-blue-400") : "Pending" === t.status && (r = "text-yellow-600 dark:text-yellow-400"),
                (s.innerHTML = `
                    <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-2">${t.title}</h3>
                    <p class="text-gray-700 dark:text-gray-300 text-sm mb-3">${t.description || "No description"}</p>
                    <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
                        <div class="flex items-center space-x-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                            <span>Due: ${t.dueDate || "N/A"}</span>
                        </div>
                        <div class="flex items-center space-x-1 ${r}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-info"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                            <span>${t.status}</span>
                        </div>
                    </div>
                    <div class="flex justify-end space-x-2">
                        <button class="text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 icon-button" onclick="event.stopPropagation(); openTaskModal('${t.id}')">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-edit"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button class="text-red-500 hover:text-red-700 dark:hover:text-red-300 icon-button" onclick="event.stopPropagation(); deleteTask('${t.id}')">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                        </button>
                    </div>
                `),
                e.appendChild(s);
        });
}
function openTaskModal(e = null) {
    let t = document.getElementById("task-modal-overlay"),
        s = document.getElementById("task-modal-title"),
        r = document.getElementById("task-id"),
        a = document.getElementById("task-title"),
        l = document.getElementById("task-description"),
        d = document.getElementById("task-due-date"),
        n = document.getElementById("task-status");
    if (e) {
        s.textContent = "Edit Task";
        let o = tasks.find((t) => t.id === e);
        o && ((r.value = o.id), (a.value = o.title), (l.value = o.description || ""), (d.value = o.dueDate || ""), (n.value = o.status || "Pending"));
    } else (s.textContent = "Add New Task"), (r.value = ""), (a.value = ""), (l.value = ""), (d.value = ""), (n.value = "Pending");
    t.classList.remove("hidden"), setTimeout(() => t.classList.add("open"), 10);
}
function closeTaskModal() {
    let e = document.getElementById("task-modal-overlay");
    e.classList.remove("open"),
        e.addEventListener(
            "transitionend",
            () => {
                e.classList.add("hidden");
            },
            { once: !0 }
        );
}
function saveTask(e) {
    e.preventDefault();
    let t = document.getElementById("task-id").value,
        s = document.getElementById("task-title").value.trim(),
        r = document.getElementById("task-description").value.trim(),
        a = document.getElementById("task-due-date").value,
        l = document.getElementById("task-status").value;
    if (!s) {
        showToast("Task title is required!", "error");
        return;
    }
    if (t) {
        let d = tasks.findIndex((e) => e.id === t);
        d > -1 && ((tasks[d] = { ...tasks[d], title: s, description: r, dueDate: a, status: l }), showToast("Task updated successfully!", "success"));
    } else {
        let n = { id: Date.now().toString(), title: s, description: r, dueDate: a, status: l, createdAt: Date.now() };
        tasks.push(n), showToast("Task added successfully!", "success");
    }
    localStorage.setItem("tasks", JSON.stringify(tasks)), renderTasks(), closeTaskModal();
}
function deleteTask(e) {
    confirm("Are you sure you want to delete this task?") && ((tasks = tasks.filter((t) => t.id !== e)), localStorage.setItem("tasks", JSON.stringify(tasks)), renderTasks(), showToast("Task deleted successfully!", "success"));
}

// Utility: Generate a random color based on a string (consistent per company)
function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = `hsl(${hash % 360}, 70%, 70%)`;
    return color;
}

// Utility: Get initials from a name
function getInitials(name) {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
}

async function fetchAgentsFromApi(page = 0) {
    try {
        const queries = [];
        queries.push(Query.limit(AGENTS_PER_PAGE));
        queries.push(Query.offset(page * AGENTS_PER_PAGE));
        queries.push(Query.orderAsc('Company-Name'));
        const response = await databases.listDocuments(
            '684619e30005eeecc28a', // Database ID
            '684619f700081730cbc4', // Collection ID
            queries
        );
        return {
            documents: response.documents,
            total: response.total
        };
    } catch (error) {
        console.error('Error fetching agents:', error);
        throw error;
    }
}

// Helper to fetch all agents (for search)
async function fetchAllAgents() {
    let allAgents = [];
    let page = 0;
    let keepFetching = true;
    while (keepFetching) {
        const queries = [];
        queries.push(Query.limit(AGENTS_PER_PAGE));
        queries.push(Query.offset(page * AGENTS_PER_PAGE));
        queries.push(Query.orderAsc('Company-Name'));
        const response = await databases.listDocuments(
            '684619e30005eeecc28a',
            '684619f700081730cbc4',
            queries
        );
        allAgents = allAgents.concat(response.documents);
        if (response.documents.length < AGENTS_PER_PAGE) {
            keepFetching = false;
        } else {
            page++;
        }
    }
    return allAgents;
}

async function loadAndRenderAgents(searchQuery = "") {
    const agentsList = document.getElementById("agents-list");
    const agentsLoading = document.getElementById("agents-loading");
    const agentsError = document.getElementById("agents-error");
    const noAgentsFound = document.getElementById("no-agents-found");
    const showMoreBtn = document.getElementById("show-more-agents");

    if (currentPage === 0) {
        agentsList.innerHTML = "";
    }

    agentsError.classList.add("hidden");
    noAgentsFound.classList.add("hidden");
    agentsLoading.classList.remove("hidden");
    showMoreBtn.classList.add("hidden");

    try {
        let newAgents = [];
        let total = 0;
        if (searchQuery) {
            // Fetch all agents for search
            newAgents = await fetchAllAgents();
            total = newAgents.length;
            const q = searchQuery.toLowerCase();
            newAgents = newAgents.filter(agent =>
                (agent['Company-Name'] && agent['Company-Name'].toLowerCase().includes(q)) ||
                (agent['Name'] && agent['Name'].toLowerCase().includes(q)) ||
                (agent['Number'] && agent['Number'].toLowerCase().includes(q)) ||
                (agent['Field'] && agent['Field'].toLowerCase().includes(q)) ||
                (agent['Role'] && agent['Role'].toLowerCase().includes(q)) ||
                (agent['Department'] && agent['Department'].toLowerCase().includes(q))
            );
            currentPage = 1; // Show all results at once
        } else {
            const response = await fetchAgentsFromApi(currentPage);
            newAgents = response.documents;
            total = response.total;
        }
        agentsLoading.classList.add("hidden");

        if (newAgents.length === 0 && currentPage === 0) {
            noAgentsFound.classList.remove("hidden");
            return;
        }
        agentsList.innerHTML = "";
        newAgents.forEach(agent => {
            // Prefer Company-Name, fallback to Person-Name
            const companyName = agent['Company-Name'] || agent['Person-Name'] || 'not found';
            const number = agent['Number'] || 'not found';
            const field = agent['Field'] || 'not found';
            const name = agent['Name'] || companyName || 'not found';
            const initials = getInitials(companyName);
            const color = stringToColor(companyName);
            const role = agent['Role'] || 'not found';
            const department = agent['Department'] || field;
            const card = document.createElement("div");
            card.className = "bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-700 flex flex-col items-center cursor-pointer";
            card.innerHTML = `
                <div class="w-24 h-24 rounded-full flex items-center justify-center mb-4" style="background:${color}; border: 4px solid #2563eb;">
                    <span class="text-3xl font-bold text-black">${initials}</span>
                </div>
                <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-1 text-center">${companyName}</h3>
                <p class="text-blue-600 dark:text-blue-400 text-sm font-semibold mb-1 text-center">${number}</p>
                <p class="text-gray-600 dark:text-gray-300 text-sm text-center">${field}</p>
            `;
            card.addEventListener('click', () => createAgentDetailsPopup(agent));
            agentsList.appendChild(card);
        });
        if (!searchQuery) {
            hasMoreAgents = (currentPage + 1) * AGENTS_PER_PAGE < total;
            if (hasMoreAgents) {
                showMoreBtn.classList.remove("hidden");
            }
            currentPage++;
        } else {
            showMoreBtn.classList.add("hidden");
        }
    } catch (error) {
        console.error("Error fetching agents:", error);
        agentsLoading.classList.add("hidden");
        agentsError.classList.remove("hidden");
        showToast("Failed to load agents data. Please try again.", "error");
    }
}

function createAgentDetailsPopup(agent) {
    const popup = document.createElement('div');
    popup.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    popup.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 transform transition-all">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold text-gray-800 dark:text-white">Agent Details</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                    </svg>
                </button>
            </div>
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-600 dark:text-gray-400">Type</label>
                    <p class="mt-1 text-gray-900 dark:text-white">${agent.Type || 'N/A'}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-600 dark:text-gray-400">Company Name</label>
                    <p class="mt-1 text-gray-900 dark:text-white">${agent['Company-Name'] || 'N/A'}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-600 dark:text-gray-400">Number</label>
                    <p class="mt-1 text-gray-900 dark:text-white">${agent.Number || 'N/A'}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-600 dark:text-gray-400">Social Media</label>
                    <a href="${agent['Social-Media'] || '#'}" target="_blank" class="mt-1 text-blue-600 dark:text-blue-400 hover:underline">
                        ${agent['Social-Media'] || 'N/A'}
                    </a>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-600 dark:text-gray-400">Field</label>
                    <p class="mt-1 text-gray-900 dark:text-white">${agent.Field || 'N/A'}</p>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(popup);
}

function validatePasswordFields() {
    let e = document.getElementById("oldPassword").value,
        t = document.getElementById("newPassword").value,
        s = document.getElementById("confirmNewPassword").value,
        r = document.getElementById("oldPassword-error"),
        a = document.getElementById("newPassword-error"),
        l = document.getElementById("confirmNewPassword-error"),
        d = document.getElementById("save-password-btn"),
        n = !0;
    e !== MOCK_CURRENT_PASSWORD ? (r.classList.remove("hidden"), (n = !1)) : r.classList.add("hidden"),
        t.length < 8 ? (a.classList.remove("hidden"), (n = !1)) : a.classList.add("hidden"),
        t !== s ? (l.classList.remove("hidden"), (n = !1)) : l.classList.add("hidden"),
        (d.disabled = !n);
}
function handlePasswordChange(e) {
    e.preventDefault();
    let t = document.getElementById("oldPassword").value,
        s = document.getElementById("newPassword").value;
    t === MOCK_CURRENT_PASSWORD && s.length >= 8 && s === document.getElementById("confirmNewPassword").value
        ? (showToast("Password updated successfully!", "success"),
            (document.getElementById("oldPassword").value = ""),
            (document.getElementById("newPassword").value = ""),
            (document.getElementById("confirmNewPassword").value = ""),
            validatePasswordFields())
        : showToast("Failed to update password. Please check your inputs.", "error");
}
function handleProfilePicSelect(e) {
    let t = document.getElementById("profile-pic-preview"),
        s = document.getElementById("file-error"),
        r = document.getElementById("save-profile-pic-btn");
    if ((s.classList.add("hidden"), (r.disabled = !0), e)) {
        let a = e.type;
        if (["image/jpeg", "image/png"].includes(a)) {
            let l = new FileReader();
            (l.onload = (s) => {
                (t.src = s.target.result), (currentProfilePicFile = e), (r.disabled = !1);
            }),
                l.readAsDataURL(e);
        } else s.classList.remove("hidden"), (t.src = "https://placehold.co/150x150/cccccc/333333?text=Profile"), (currentProfilePicFile = null);
    } else (t.src = "https://placehold.co/150x150/cccccc/333333?text=Profile"), (currentProfilePicFile = null);
}
function handleSaveProfilePic() {
    if (currentProfilePicFile) {
        let e = new FileReader();
        (e.onload = (e) => {
            localStorage.setItem("userProfilePic", e.target.result), showToast("Profile picture saved!", "success"), (document.getElementById("save-profile-pic-btn").disabled = !0);
        }),
            e.readAsDataURL(currentProfilePicFile);
    } else showToast("No profile picture selected to save.", "error");
}
function toggleDarkMode() {
    (isDarkMode = !isDarkMode), document.documentElement.classList.toggle("dark", isDarkMode), localStorage.setItem("darkMode", isDarkMode);
    let e = document.querySelector("#dark-mode-toggle svg");
    isDarkMode
        ? (e.innerHTML = '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>')
        : (e.innerHTML =
            '<circle cx="12" cy="12" r="8"/><line x1="12" x2="12" y1="1" y2="3"/><line x1="12" x2="12" y1="21" y2="23"/><line x1="4.22" x2="5.64" y1="4.22" y2="5.64"/><line x1="18.36" x2="19.78" y1="18.36" y2="19.78"/><line x1="1" x2="3" y1="12" y2="12"/><line x1="21" x2="23" y1="12" y2="12"/><line x1="4.22" x2="5.64" y1="19.78" y2="18.36"/><line x1="18.36" x2="19.78" y1="5.64" y2="4.22"/>');
}
async function checkSession() {
    try {
        const session = await account.get();
        currentUserId = session.$id;
        updateDashboardUserId();
    } catch (err) {
        window.location.href = '/Pages/login.html';
    }
}
// Call checkSession when the script loads
checkSession();
document.addEventListener("DOMContentLoaded", () => {
    let e = localStorage.getItem("darkMode");
    "true" === e
        ? ((isDarkMode = !0),
            document.documentElement.classList.add("dark"),
            (document.querySelector("#dark-mode-toggle svg").innerHTML =
                '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-moon"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>'))
        : window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
            ? ((isDarkMode = !0),
                document.documentElement.classList.add("dark"),
                (document.querySelector("#dark-mode-toggle svg").innerHTML =
                    '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-moon"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>'))
            : ((isDarkMode = !1),
                document.documentElement.classList.remove("dark"),
                (document.querySelector("#dark-mode-toggle svg").innerHTML =
                    '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sun"><circle cx="12" cy="12" r="8"/><line x1="12" x2="12" y1="1" y2="3"/><line x1="12" x2="12" y1="21" y2="23"/><line x1="4.22" x2="5.64" y1="4.22" y2="5.64"/><line x1="18.36" x2="19.78" y1="18.36" y2="19.78"/><line x1="1" x2="3" y1="12" y2="12"/><line x1="21" x2="23" y1="12" y2="12"/><line x1="4.22" x2="5.64" y1="19.78" y2="18.36"/><line x1="18.36" x2="19.78" y1="5.64" y2="4.22"/></svg>')),
        updateDashboardUserId();
    let t = localStorage.getItem("userProfilePic");
    t && (document.getElementById("profile-pic-preview").src = t),
        renderTasks(),
        loadAndRenderAgents(),
        document.getElementById("add-task-fab").addEventListener("click", () => openTaskModal()),
        document.getElementById("task-form").addEventListener("submit", saveTask),
        document.getElementById("agent-search-input").addEventListener("keyup", (e) => {
            currentPage = 0;
            hasMoreAgents = true;
            loadAndRenderAgents(e.target.value);
        }),
        document.getElementById("show-more-agents").addEventListener("click", () => {
            loadAndRenderAgents(document.getElementById("agent-search-input").value);
        }),
        document.getElementById("oldPassword").addEventListener("input", validatePasswordFields),
        document.getElementById("newPassword").addEventListener("input", validatePasswordFields),
        document.getElementById("confirmNewPassword").addEventListener("input", validatePasswordFields),
        document.getElementById("password-change-form").addEventListener("submit", handlePasswordChange);
    let s = document.getElementById("drag-drop-area"),
        r = document.getElementById("profile-pic-upload");
    s.addEventListener("click", () => r.click()),
        r.addEventListener("change", (e) => handleProfilePicSelect(e.target.files[0])),
        s.addEventListener("dragover", (e) => {
            e.preventDefault(), s.classList.add("hover");
        }),
        s.addEventListener("dragleave", () => {
            s.classList.remove("hover");
        }),
        s.addEventListener("drop", (e) => {
            e.preventDefault(), s.classList.remove("hover"), handleProfilePicSelect(e.dataTransfer.files[0]);
        }),
        document.getElementById("save-profile-pic-btn").addEventListener("click", handleSaveProfilePic),
        document.getElementById("dark-mode-toggle").addEventListener("click", toggleDarkMode),
        document.getElementById("menu-toggle").addEventListener("click", () => {
            let e = document.getElementById("sidebar");
            e.classList.toggle("-translate-x-full");
            let t = document.getElementById("menu-toggle").querySelector("svg");
            e.classList.contains("-translate-x-full")
                ? (t.innerHTML = '<line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>')
                : (t.innerHTML = '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>');
        }),
        showToast("Welcome to your Employee Dashboard!", "info", 4e3);
});

signoutBTN.addEventListener('click', async function signout() {
    try {
        await account.deleteSession('current');
        window.location.href = '/pages/login.html';
    } catch (error) {
        console.error('Error signing out:', error);
        showToast("Error signing out. Please try again.", "error");
    }
});