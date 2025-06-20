import { account, databases, Query } from './appwrite-config.js';

// Global variables
let isDarkMode = false;
let currentUserId = null;
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
const AGENTS_PER_PAGE = 50; // Changed to 50 lines per batch
let currentPage = 0;
let allAgents = []; // Store all agents
let displayedAgents = []; // Store currently displayed agents
let selectedAgentId = null;

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

    if (pageId === 'actions') {
        loadAndRenderActions();
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

async function loadAndRenderAgents(searchQuery = "", searchType = "name") {
    const agentsList = document.getElementById("agents-table-body");
    const agentsLoading = document.getElementById("agents-loading");
    const agentsError = document.getElementById("agents-error");
    const noAgentsFound = document.getElementById("no-agents-found");

    agentsError.classList.add("hidden");
    noAgentsFound.classList.add("hidden");
    agentsLoading.classList.remove("hidden");

    let totalAgents = 0;
    try {
        let queries = [];
        let isSearching = !!searchQuery;
        if (isSearching) {
            switch (searchType) {
                case "name":
                    queries.push(
                        Query.or([
                            Query.equal("Company-Name", searchQuery),
                            Query.equal("Person-Name", searchQuery),
                            Query.equal("Official-Name", searchQuery)
                        ])
                    );
                    break;
                case "phone":
                    queries.push(Query.equal("Number", searchQuery));
                    break;
                case "action_status":
                    queries.push(Query.equal("Action_Status", searchQuery));
                    break;
                case "department":
                    queries.push(Query.equal("Field", searchQuery));
                    break;
                default:
                    break;
            }
            queries.push(Query.limit(AGENTS_PER_PAGE));
            queries.push(Query.offset(0));
            queries.push(Query.orderAsc('Company-Name'));
            const response = await databases.listDocuments(
                '684619e30005eeecc28a',
                '684619f700081730cbc4',
                queries
            );
            displayedAgents = response.documents;
            allAgents = response.documents;
            totalAgents = response.total;
        } else {
            // If not searching, fetch new batch of agents
            const response = await fetchAgentsFromApi(currentPage);
            if (currentPage === 0) {
                allAgents = response.documents;
                displayedAgents = response.documents;
            } else {
                allAgents = allAgents.concat(response.documents);
                displayedAgents = allAgents;
            }
            currentPage++;
            totalAgents = response.total;
        }

        agentsLoading.classList.add("hidden");

        if (displayedAgents.length === 0) {
            noAgentsFound.classList.remove("hidden");
            return;
        }

        // Clear existing content
        agentsList.innerHTML = "";

        // Render all displayed agents
        displayedAgents.forEach(agent => {
            const companyName = agent['Company-Name'] || agent['Person-Name'] || agent['Official-Name'] || 'N/A';
            const number = agent['Number'] || 'N/A';
            const type = agent['Type'] || 'N/A';
            const department = agent['Field'] || 'N/A';
            const isCompany = type.toLowerCase().includes('company') || type.toLowerCase().includes('business');
            const actionStatus = agent['Action_Status'];
            const actionStatusHtml = actionStatus
                ? `<span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">${actionStatus}</span>`
                : `<span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300">Not Actioned</span>`;
            const row = document.createElement("tr");
            row.className = "hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200";
            row.setAttribute('data-agent-id', agent.$id);
            row.innerHTML = `
                <td class="w-[15%] px-4 py-3 text-left text-xs text-gray-900 dark:text-gray-300 truncate">${number}</td>
                <td class="w-[35%] px-4 py-3 text-left text-xs text-gray-900 dark:text-gray-300 truncate">${companyName}</td>
                <td class="w-[15%] px-4 py-3 text-left text-xs">
                    <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${isCompany
                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                    : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'}">
                        ${type}
                    </span>
                </td>
                <td class="w-[20%] px-4 py-3 text-left text-xs text-gray-900 dark:text-gray-300 truncate">${department}</td>
                <td class="w-[15%] px-4 py-3 text-left text-xs">${actionStatusHtml}</td>
                <td class="w-[15%] px-4 py-3 text-left text-xs">
                    <button class="take-action-btn bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded-md text-xs font-medium transition-colors duration-200" data-agent-id="${agent.$id}">
                        Take Action
                    </button>
                </td>
            `;
            agentsList.appendChild(row);
        });

        // Update the results count
        document.getElementById("agents-start").textContent = "1";
        document.getElementById("agents-end").textContent = displayedAgents.length;
        document.getElementById("agents-total").textContent = totalAgents;

        // Show More button logic
        const showMoreBtn = document.getElementById('show-more-agents');
        if (showMoreBtn) {
            if (displayedAgents.length >= totalAgents) {
                showMoreBtn.style.display = 'none';
            } else {
                showMoreBtn.style.display = '';
            }
            showMoreBtn.onclick = function () {
                if (isSearching) {
                    // For search, fetch next page of results
                    currentPage++;
                    loadAndRenderAgents(searchQuery, searchType);
                } else {
                    loadAndRenderAgents();
                }
            };
        }

        setupTakeActionButtonHandler();
    } catch (error) {
        console.error("Error fetching agents:", error);
        agentsLoading.classList.add("hidden");
        agentsError.classList.remove("hidden");
        showToast("Failed to load agents data. Please try again.", "error");
    }
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
    if (document.getElementById("profile-pic-preview") && t) {
        document.getElementById("profile-pic-preview").src = t;
    }
    renderTasks();
    loadAndRenderAgents();
    const addTaskFab = document.getElementById("add-task-fab");
    if (addTaskFab) addTaskFab.addEventListener("click", () => openTaskModal());
    const taskForm = document.getElementById("task-form");
    if (taskForm) taskForm.addEventListener("submit", saveTask);
    const agentSearchInput = document.getElementById("agent-search-input");
    const agentSearchType = document.getElementById("agent-search-type");
    if (agentSearchInput && agentSearchType) {
        agentSearchInput.addEventListener("keyup", (e) => {
            loadAndRenderAgents(e.target.value, agentSearchType.value);
        });
        agentSearchType.addEventListener("change", () => {
            loadAndRenderAgents(agentSearchInput.value, agentSearchType.value);
        });
    }
    const darkModeToggle = document.getElementById("dark-mode-toggle");
    if (darkModeToggle) darkModeToggle.addEventListener("click", () => {
        let e = document.getElementById("sidebar");
        e.classList.toggle("-translate-x-full");
        let t = document.getElementById("menu-toggle").querySelector("svg");
        e.classList.contains("-translate-x-full")
            ? (t.innerHTML = '<line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>')
            : (t.innerHTML = '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>');
    });
    showToast("Welcome to your Employee Dashboard!", "info", 4e3);
    const sendActionBtn = document.getElementById('send-agent-action');
    if (sendActionBtn) {
        sendActionBtn.addEventListener('click', async function () {
            const agentId = selectedAgentId;
            const actionValue = document.getElementById('agent-action-value').value.trim();
            const actionStatus = document.getElementById('agent-action-status').value;

            if (!actionValue) {
                showToast('Action value cannot be empty.', 'error');
                return;
            }
            try {
                await databases.updateDocument(
                    '684619e30005eeecc28a', // Database ID
                    '684619f700081730cbc4', // Collection ID
                    agentId,
                    {
                        IsActiond: true,
                        Action_Value: actionValue,
                        Action_Status: actionStatus
                    }
                );
                showToast('Action updated successfully!', 'success');
                document.getElementById('agent-action-modal').classList.add('hidden');
                loadAndRenderAgents(); // Refresh the list
            } catch (error) {
                showToast('Failed to update action.', 'error');
            }
        });
    }
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

// --- Actions Section Logic (Rewritten) ---
async function loadAndRenderActions() {
    const actionsSection = document.getElementById('actions');
    if (!actionsSection) return;
    actionsSection.innerHTML = `
        <div class="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md transition-colors duration-300">
            <h1 class="text-3xl font-bold text-gray-800 dark:text-white mb-6">Actions</h1>
            <div id="actions-summary-cards" class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"></div>
            <div class="overflow-x-auto">
                <table class="w-full table-fixed border-collapse mt-6">
                    <thead class="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th class="w-[30%] px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Agent Name</th>
                            <th class="w-[20%] px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Phone Number</th>
                            <th class="w-[30%] px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Action Value</th>
                            <th class="w-[20%] px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Action Status</th>
                        </tr>
                    </thead>
                    <tbody id="actions-table-body" class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700"></tbody>
                </table>
            </div>
        </div>
    `;
    const actionsTableBody = document.getElementById('actions-table-body');
    const summaryCards = document.getElementById('actions-summary-cards');
    actionsTableBody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-gray-500 dark:text-gray-300">Loading...</td></tr>';
    try {
        // Query all agents
        const response = await databases.listDocuments(
            '684619e30005eeecc28a',
            '684619f700081730cbc4',
            [Query.limit(1000)] // adjust as needed for your dataset size
        );
        actionsTableBody.innerHTML = '';
        if (!response.documents.length) {
            actionsTableBody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-gray-500 dark:text-gray-300">No actions found.</td></tr>';
            summaryCards.innerHTML = '';
            return;
        }
        // Calculate summary
        const allAgents = response.documents;
        const actioned = allAgents.filter(a => a.IsActiond === true).length;
        const successful = allAgents.filter(a => a.Action_Status === 'Finish Deal').length;
        const inProgress = allAgents.filter(a => a.Action_Status === 'In Progress Deal').length;
        const failed = allAgents.filter(a => a.Action_Status === 'Refused Deal').length;
        summaryCards.innerHTML = `
            <div class="bg-blue-100 dark:bg-blue-900 p-6 rounded-lg shadow text-center">
                <div class="text-2xl font-bold text-blue-700 dark:text-blue-300">${actioned}</div>
                <div class="text-gray-700 dark:text-gray-300 mt-2">Actioned Agents</div>
            </div>
            <div class="bg-green-100 dark:bg-green-900 p-6 rounded-lg shadow text-center">
                <div class="text-2xl font-bold text-green-700 dark:text-green-300">${successful}</div>
                <div class="text-gray-700 dark:text-gray-300 mt-2">Successful Deals</div>
            </div>
            <div class="bg-yellow-100 dark:bg-yellow-900 p-6 rounded-lg shadow text-center">
                <div class="text-2xl font-bold text-yellow-700 dark:text-yellow-300">${inProgress}</div>
                <div class="text-gray-700 dark:text-gray-300 mt-2">In Progress Deals</div>
            </div>
            <div class="bg-red-100 dark:bg-red-900 p-6 rounded-lg shadow text-center">
                <div class="text-2xl font-bold text-red-700 dark:text-red-300">${failed}</div>
                <div class="text-gray-700 dark:text-gray-300 mt-2">Failed Deals</div>
            </div>
        `;
        // Only show actioned agents in the table
        allAgents.filter(a => a.IsActiond === true).forEach(agent => {
            const name = agent['Company-Name'] || agent['Person-Name'] || agent['Official-Name'] || 'N/A';
            const number = agent['Number'] || 'N/A';
            const value = agent['Action_Value'] || 'N/A';
            const status = agent['Action_Status'] || 'N/A';
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="w-[30%] px-4 py-3 text-xs text-gray-900 dark:text-gray-300 truncate">${name}</td>
                <td class="w-[20%] px-4 py-3 text-xs text-gray-900 dark:text-gray-300 truncate">${number}</td>
                <td class="w-[30%] px-4 py-3 text-xs text-gray-900 dark:text-gray-300 truncate">${value}</td>
                <td class="w-[20%] px-4 py-3 text-xs text-gray-900 dark:text-gray-300 truncate">${status}</td>
            `;
            actionsTableBody.appendChild(row);
        });
    } catch (err) {
        actionsTableBody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-red-500">Failed to load actions.</td></tr>';
        summaryCards.innerHTML = '';
    }
}

function openAgentActionModal(agentId) {
    if (!agentId) {
        showToast('No agent ID provided for action.', 'error');
        return;
    }
    selectedAgentId = agentId;
    const modal = document.getElementById('agent-action-modal');
    if (modal) {
        modal.classList.remove('hidden');
        const agentIdSpan = document.getElementById('modal-agent-id');
        if (agentIdSpan) agentIdSpan.textContent = agentId;
    } else {
        showToast('Action modal not found.', 'error');
    }
}

function setupTakeActionButtonHandler() {
    const agentsTableBody = document.getElementById('agents-table-body');
    if (!agentsTableBody) return;
    agentsTableBody.addEventListener('click', function (e) {
        const btn = e.target.closest('.take-action-btn');
        if (btn) {
            const agentId = btn.getAttribute('data-agent-id');
            openAgentActionModal(agentId);
        }
    });
}
window.openTaskModal = openTaskModal;
window.deleteTask = deleteTask;
