
const API_URL = "https://expense-tracker-api.manojkumar3549g.workers.dev";

// ======================================
// PERSON DASHBOARD
// ======================================


 // ======================================
// PERSON DASHBOARD
// ======================================

const username =
    sessionStorage.getItem("loggedInUser") ||
    localStorage.getItem("loggedInUser");

const role =
    sessionStorage.getItem("userRole") ||
    localStorage.getItem("userRole");

const personName =
    sessionStorage.getItem("personName") ||
    localStorage.getItem("personName");

const authToken =
    sessionStorage.getItem("authToken") ||
    localStorage.getItem("authToken");

if (!username || role !== "person" || !authToken) {
    window.location.href = "../index.html";
} else {
    initializeDashboard();
}



 // ======================================
// API REQUEST
// ======================================

async function apiRequest(endpoint) {
    const token =
        sessionStorage.getItem("authToken") ||
        localStorage.getItem("authToken");

    const response = await fetch(`${API_URL}${endpoint}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token || ""}`,
            "Content-Type": "application/json"
        }
    });

    let data = {};

    try {
        data = await response.json();
    } catch {
        data = {};
    }

    if (response.status === 401 || response.status === 403) {
        for (const storage of [localStorage, sessionStorage]) {
            storage.removeItem("authToken");
            storage.removeItem("loggedInUser");
            storage.removeItem("userRole");
            storage.removeItem("personName");
        }

        window.location.href = "../index.html";
        throw new Error("Your session has expired. Please log in again.");
    }

    if (!response.ok) {
        throw new Error(data.error || "Unable to load expenses.");
    }

    return data;
}


// ======================================
// INITIALIZE DASHBOARD
// ======================================

async function initializeDashboard() {
    const name = personName || getPersonName(username);

    document.getElementById("personName").textContent = name;
    document.getElementById("welcomeName").textContent = name;

    const transactionList = document.getElementById("transactionList");

    if (!transactionList) {
        console.error("Transaction list element was not found.");
        return;
    }

    transactionList.innerHTML = "<p>Loading expenses...</p>";

    try {
        const data = await apiRequest("/api/expenses");

        const expenses = Array.isArray(data)
            ? data
            : Array.isArray(data.expenses)
                ? data.expenses
                : [];

        calculatePersonData(expenses);
    } catch (error) {
        console.error("Dashboard loading failed:", error);

        transactionList.innerHTML = `
            <div class="empty-state">
                <h3>Unable to load expenses</h3>
                <p>${escapeHTML(error.message || "Please refresh and try again.")}</p>
            </div>
        `;
    }
}

// ======================================
// CALCULATE PERSON DATA
// ======================================

function calculatePersonData(expenses) {
    let mySpent = 0;
    let myGiven = 0;
    const myExpenses = [];

    expenses.forEach(function (expense) {
        const splitAmounts = expense.splits || expense.split || {};

        const amountGiven = Number(splitAmounts[username]) || 0;
        const spentByMe = expense.spentBy === username;

        if (spentByMe) {
            mySpent += Number(expense.totalAmount) || 0;
        }

        if (amountGiven > 0 || spentByMe) {
            myGiven += amountGiven;

            myExpenses.push({
                ...expense,
                myGiven: amountGiven
            });
        }
    });

    document.getElementById("mySpent").textContent =
        formatCurrency(mySpent);

    document.getElementById("myGiven").textContent =
        formatCurrency(myGiven);

    document.getElementById("expenseCount").textContent =
        myExpenses.length;

    document.getElementById("transactionStatus").textContent =
        myExpenses.length +
        (myExpenses.length === 1 ? " transaction" : " transactions");

    displayTransactions(myExpenses);
}

// ======================================
// DISPLAY TRANSACTIONS
// ======================================

function displayTransactions(myExpenses) {
    const transactionList = document.getElementById("transactionList");

    transactionList.innerHTML = "";

    if (myExpenses.length === 0) {
        transactionList.innerHTML = `
            <div class="empty-state">
                <div>🧾</div>
                <h3>No transactions yet</h3>
                <p>Your expenses will appear here.</p>
            </div>
        `;
        return;
    }

    myExpenses
        .slice()
        .sort(function (a, b) {
            return new Date(b.date || 0) - new Date(a.date || 0);
        })
        .forEach(function (expense) {
            const spentByMe = expense.spentBy === username;

            const card = document.createElement("div");
            card.className = "transaction-card";

            card.innerHTML = `
                <div class="transaction-main">
                    <div class="transaction-icon">
                        ${getCategoryIcon(expense.category)}
                    </div>

                    <div>
                        <h3>${escapeHTML(expense.name || "Expense")}</h3>
                        <p>
                            ${escapeHTML(expense.category || "Others")}
                            • ${formatDate(expense.date)}
                        </p>
                    </div>
                </div>

                <div class="transaction-info">
                    <div>
                        <span>Total</span>
                        <strong>${formatCurrency(expense.totalAmount)}</strong>
                    </div>

                    <div>
                        <span>My Given</span>
                        <strong>${formatCurrency(expense.myGiven)}</strong>
                    </div>

                    <div>
                        <span>${spentByMe ? "I Spent" : "Spent By"}</span>
                        <strong>
                            ${spentByMe
                                ? "Yes"
                                : escapeHTML(getPersonName(expense.spentBy))}
                        </strong>
                    </div>
                </div>
            `;

            transactionList.appendChild(card);
        });
}

// ======================================
// GET PERSON NAME
// ======================================

function getPersonName(username) {
    const names = {
        vetri: "Vetrivel",
        nitheen: "Nitheen",
        yash: "Yaswanth",
        dharshu: "Dharshini",
        mano: "ManojKumar"
    };

    return names[username] || username || "User";
}

// ======================================
// CATEGORY ICON
// ======================================

function getCategoryIcon(category) {
    const icons = {
        Bus: "🚌",
        Auto: "🛺",
        Theatre: "🎭",
        Lunch: "🍛",
        Dinner: "🍽️",
        Snacks: "🍿",
        Petrol: "⛽",
        Movie: "🎬",
        Others: "📌"
    };

    return icons[category] || "🧾";
}

// ======================================
// FORMAT CURRENCY
// ======================================

function formatCurrency(amount) {
    return Number(amount || 0).toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// ======================================
// FORMAT DATE
// ======================================

function formatDate(date) {
    if (!date) {
        return "-";
    }

    const parsedDate = new Date(date + "T00:00:00");

    if (Number.isNaN(parsedDate.getTime())) {
        return "-";
    }

    return parsedDate.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

// ======================================
// ESCAPE HTML
// ======================================

function escapeHTML(value) {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
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
