const API_URL = "https://expense-tracker-api.manojkumar3549g.workers.dev";

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const usernameInput = document.getElementById("username");
        const passwordInput = document.getElementById("password");
        const message = document.getElementById("loginMessage");

        if (!usernameInput || !passwordInput || !message) {
            console.error("Login form elements are missing.");
            return;
        }

        const username = usernameInput.value.trim().toLowerCase();
        const password = passwordInput.value;

        if (!username || !password) {
            message.style.color = "red";
            message.textContent = "Please enter your username and password.";
            return;
        }

        const submitButton = loginForm.querySelector(
            'button[type="submit"], input[type="submit"]'
        );

        if (submitButton) {
            submitButton.disabled = true;

            if (submitButton.tagName === "BUTTON") {
                submitButton.dataset.originalText = submitButton.textContent;
                submitButton.textContent = "Signing in...";
            }
        }

        message.style.color = "";
        message.textContent = "Signing in...";

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

            let data = {};

            try {
                data = await response.json();
            } catch {
                throw new Error("The server returned an invalid response.");
            }

            if (!response.ok) {
                throw new Error(data.error || "Invalid username or password.");
            }

            if (
                !data.token ||
                !data.user ||
                !data.user.username ||
                !["admin", "person"].includes(data.user.role)
            ) {
                throw new Error("Invalid response from server.");
            }

            // Store the server-issued authentication details.
            localStorage.setItem("authToken", data.token);
            localStorage.setItem("loggedInUser", data.user.username);
            localStorage.setItem("userRole", data.user.role);
            localStorage.setItem("personName", data.user.name || data.user.username);

            message.style.color = "green";
            message.textContent = "Login successful! Redirecting...";

            if (submitButton) {
                submitButton.disabled = true;
            }

            if (data.user.role === "admin") {
                window.location.href = "pages/admin-dashboard.html";
            } else {
                window.location.href = "pages/person-dashboard.html";
            }

        } catch (error) {
            console.error("Login failed:", error);

            message.style.color = "red";

            if (error.message === "Failed to fetch") {
                message.textContent =
                    "Cannot connect to the server. Check your internet connection and try again.";
            } else {
                message.textContent =
                    error.message || "Login failed. Please try again.";
            }

            if (submitButton) {
                submitButton.disabled = false;

                if (
                    submitButton.tagName === "BUTTON" &&
                    submitButton.dataset.originalText
                ) {
                    submitButton.textContent = submitButton.dataset.originalText;
                    delete submitButton.dataset.originalText;
                }
            }
        }
    });
} else {
    console.error("Login form with ID 'loginForm' was not found.");
}
