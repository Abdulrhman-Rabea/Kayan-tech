
function redirectToAppropriatePage() {
    const redirectMessage = document.getElementById('redirect-message');
    redirectMessage.style.display = 'block';

    setTimeout(() => {

        window.location.href = './pages/login.html'; // Example: your login page URL

    }, 3000); // Redirect after 3 seconds (adjust as needed)
}

window.onload = redirectToAppropriatePage;
