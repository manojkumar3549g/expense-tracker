
const API_URL =
    "https://expense-tracker-api.manojkumar3549g.workers.dev";

// ======================================
// LOGIN CHECK
// ======================================

const role = localStorage.getItem("userRole");
const token = localStorage.getItem("authToken");

if (role !== "admin" || !token) {
    window.location.href = "../index.html";
}

// ======================================
// LOAD DATA
// ======================================

let expenses = [];
let changeRequests = [];

async function loadDashboardData() {
    try {
        const headers = {
            Authorization: `Bearer ${token}`
        };

        // Load expenses from Cloudflare API
        const expensesResponse = await fetch(
            `${API_URL}/api/expenses`,
            { headers }
        );

        const expensesData = await expensesResponse.json();

        if (!expensesResponse.ok) {
            throw new Error(
                expensesData.error || "Unable to load expenses."
            );
        }

        expenses = Array.isArray(expensesData)
            ? expensesData
            : (expensesData.expenses || []);

        updateExpenseStatistics();

        // Load change requests from Cloudflare API
        const requestsResponse = await fetch(
            `${API_URL}/api/change-requests`,
            { headers }
        );

        const requestsData = await requestsResponse.json();

        if (!requestsResponse.ok) {
            throw new Error(
                requestsData.error ||
                "Unable to load change requests."
            );
        }

        changeRequests = Array.isArray(requestsData)
            ? requestsData
            : (requestsData.requests || []);

        updateRequestStatistics();

    } catch (error) {
        console.error("Dashboard loading failed:", error);

        alert(
            error.message ||
            "Unable to load dashboard data. Please refresh the page."
        );
    }
}

// ======================================
// UPDATE EXPENSE STATISTICS
// ======================================

function updateExpenseStatistics() {
    const peopleCount = document.getElementById("peopleCount");
    const expenseCount = document.getElementById("expenseCount");
    const totalAmount = document.getElementById("totalAmount");

    if (peopleCount) {
        peopleCount.textContent = 5;
    }

    if (expenseCount) {
        expenseCount.textContent = expenses.length;
    }

    const total = expenses.reduce(
        (sum, expense) =>
            sum + (Number(expense.totalAmount) || 0),
        0
    );

    if (totalAmount) {
        totalAmount.textContent =
            "₹" + total.toLocaleString("en-IN", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            });
    }
}

// ======================================
// UPDATE REQUEST STATISTICS
// ======================================

function updateRequestStatistics() {
    // Count pending requests only.
    const pendingRequests = changeRequests.filter(
        request =>
            String(request.status || "").toLowerCase() === "pending"
    );

    const requestCount = document.getElementById("requestCount");
    const requestBadge = document.getElementById("requestBadge");
    const requestStatus = document.getElementById("requestStatus");

    if (requestCount) {
        requestCount.textContent = pendingRequests.length;
    }

    if (requestBadge) {
        requestBadge.textContent = pendingRequests.length;
        requestBadge.style.display =
            pendingRequests.length > 0 ? "" : "none";
    }

    if (requestStatus) {
        requestStatus.textContent =
            pendingRequests.length > 0
                ? `${pendingRequests.length} pending request(s)`
                : "No pending requests";
    }
}

// ======================================
// LOGOUT
// ======================================

function logout() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("userRole");
    localStorage.removeItem("personName");

    window.location.href = "../index.html";
}

// Support HTML buttons using onclick="logout()".
window.logout = logout;

// ======================================
// INITIAL LOAD
// ======================================

if (role === "admin" && token) {
    loadDashboardData();
}