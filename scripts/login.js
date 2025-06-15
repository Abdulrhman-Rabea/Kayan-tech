import { account } from '../scripts/appwrite-config.js';
document.addEventListener('DOMContentLoaded', () => {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('togglePassword');
    const loginForm = document.getElementById('loginForm');
    const errorMessageDiv = document.getElementById('errorMessage');
    const errorMessageP = errorMessageDiv.querySelector('p');

    // Function to show error message
    function showErrorMessage(message) {
        errorMessageP.textContent = message;
        errorMessageDiv.classList.remove('hidden');
    }

    // Function to hide error message
    function hideErrorMessage() {
        errorMessageDiv.classList.add('hidden');
        errorMessageP.textContent = '';
    }

    // Input field focus/blur effects (handled by Tailwind's focus: classes)
    emailInput.addEventListener('focus', () => { hideErrorMessage(); });
    passwordInput.addEventListener('focus', () => { hideErrorMessage(); });

    // Password toggle functionality
    togglePassword.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        // Toggle the eye icon
        togglePassword.querySelector('i').classList.toggle('fa-eye');
        togglePassword.querySelector('i').classList.toggle('fa-eye-slash');
    });

    // Form submission handler
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent default form submission

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!email || !password) {
            showErrorMessage('Please enter both email/username and password.');
            return;
        }
        showErrorMessage('Logging in...');
        event.preventDefault()
        try {
            await account.createEmailSession(email, password);
            showErrorMessage('welcome');

            window.location.href = "/Pages/EmployeeDashboard.html"
        } catch (err) {
            showErrorMessage("invalid credential")
        }
    })
})

