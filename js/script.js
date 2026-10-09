
const API_URL = "https://expense-tracker-api.manojkumar3549g.workers.dev";

const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const username = document
        .getElementById("username")
        .value.trim()
        .toLowerCase();

    const password = document
        .getElementById("password")
        .value;

    const message = document.getElementById("loginMessage");

    message.textContent = "Signing in...";
    message.style.color = "";

    try {
        const response = await fetch(`${API_URL}/api/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Login failed.");
        }

        if (!data.token || !data.user) {
            throw new Error("Invalid response from server.");
        }

        // Store the server-issued login token and account details.
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("loggedInUser", data.user.username);
        localStorage.setItem("userRole", data.user.role);
        localStorage.setItem("personName", data.user.name);

        message.style.color = "green";
        message.textContent = "Login successful! Redirecting...";

        if (data.user.role === "admin") {
            window.location.href = "pages/admin-dashboard.html";
        } else {
            window.location.href = "pages/person-dashboard.html";
        }

    } catch (error) {
        message.style.color = "red";
        message.textContent =
            error.message === "Failed to fetch"
                ? "Cannot connect to the server. Check your internet connection."
                : error.message;
    }
});
