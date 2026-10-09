const API_URL = "https://expense-tracker-api.manojkumar3549g.workers.dev";

// ========================================
// PERSONAL EXPENSES
// ========================================

// ========================================
// LOGIN CHECK
// ========================================

const username = localStorage.getItem("loggedInUser");
const role = localStorage.getItem("userRole");
const personName = localStorage.getItem("personName");
const authToken = localStorage.getItem("authToken");

if (!username || role !== "person" || !authToken) {
    window.location.href = "../index.html";
} else {
    initializePersonalExpenses();
}

// ========================================
// PEOPLE
// ========================================

const people = {
    vetri: "Vetrivel",
    nitheen: "Nitheen",
    yash: "Yaswanth",
    dharshu: "Dharshini",
    mano: "ManojKumar"
};

// ========================================
// INITIALIZE PAGE
// ========================================

async function initializePersonalExpenses() {
    const nameElement = document.getElementById("personName");
    const expenseList = document.getElementById("expenseList");

    if (nameElement) {
        nameElement.textContent =
            personName || getPersonName(username);
    }

    if (!expenseList) {
        console.error("Expense list element was not found.");
        return;
    }

    expenseList.innerHTML = "<p>Loading personal expenses...</p>";

    try {
        const data = await apiRequest("/api/expenses");

        const expenses = Array.isArray(data)
            ? data
            : Array.isArray(data.expenses)
                ? data.expenses
                : [];

        calculatePersonalExpenses(expenses);
    } catch (error) {
        console.error("Unable to load personal expenses:", error);

        expenseList.innerHTML = `
            <div class="empty-state">
                <h3>Unable to load expenses</h3>
                <p>${escapeHTML(error.message || "Please refresh and try again.")}</p>
            </div>
        `;
    }
}

// ========================================
// API REQUEST
// ========================================

async function apiRequest(endpoint) {
    const token = localStorage.getItem("authToken");

    const response = await fetch(`${API_URL}${endpoint}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
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
        localStorage.removeItem("authToken");
        localStorage.removeItem("loggedInUser");
        localStorage.removeItem("userRole");
        localStorage.removeItem("personName");

        window.location.href = "../index.html";

        throw new Error("Your session has expired. Please log in again.");
    }

    if (!response.ok) {
        throw new Error(data.error || "Unable to load expenses.");
    }

    return data;
}

// ========================================
// CALCULATE PERSONAL EXPENSES
// ========================================

function calculatePersonalExpenses(expenses) {
    const myExpenses = [];

    let mySpent = 0;
    let myGiven = 0;

    expenses.forEach(function (expense) {
        const splitAmounts = expense.splits || expense.split || {};

        const myAmount = Number(splitAmounts[username]) || 0;
        const spentByMe = expense.spentBy === username;

        // Total amount paid by this person
        if (spentByMe) {
            mySpent += Number(expense.totalAmount) || 0;
        }

        // Include expenses in which this person participated
        if (myAmount > 0 || spentByMe) {
            myGiven += myAmount;

            myExpenses.push({
                ...expense,
                myGiven: myAmount
            });
        }
    });

    const mySpentElement = document.getElementById("mySpent");
    const myGivenElement = document.getElementById("myGiven");

    // Support either ID if the HTML uses a different count element
    const countElement =
        document.getElementById("myExpenseCount") ||
        document.getElementById("expenseCount");

    const statusElement =
        document.getElementById("transactionStatus");

    if (mySpentElement) {
        mySpentElement.textContent = formatCurrency(mySpent);
    }

    if (myGivenElement) {
        myGivenElement.textContent = formatCurrency(myGiven);
    }

    if (countElement) {
        countElement.textContent = myExpenses.length;
    }

    if (statusElement) {
        statusElement.textContent =
            myExpenses.length +
            (myExpenses.length === 1
                ? " transaction"
                : " transactions");
    }

    displayPersonalExpenses(myExpenses);
}

// ========================================
// DISPLAY PERSONAL EXPENSES
// ========================================

function displayPersonalExpenses(myExpenses) {
    const expenseList = document.getElementById("expenseList");

    if (!expenseList) {
        return;
    }

    expenseList.innerHTML = "";

    if (myExpenses.length === 0) {
        expenseList.innerHTML = `
            <div class="empty-state">
                <div>🧾</div>
                <h3>No personal expenses yet</h3>
                <p>Expenses in which you participate will appear here.</p>
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
            const card = document.createElement("div");
            card.className = "expense-card";

            const spentByMe = expense.spentBy === username;
            const spentBy = getPersonName(expense.spentBy);

            const expenseName = escapeHTML(expense.name || "Expense");
            const category = escapeHTML(expense.category || "Others");
            const details = expense.details
                ? escapeHTML(expense.details)
                : "";

            const expenseId = expense.id;

            card.innerHTML = `
                <div class="expense-top">
                    <div class="expense-title">
                        <div class="expense-icon">
                            ${getCategoryIcon(expense.category)}
                        </div>

                        <div>
                            <h3>${expenseName}</h3>
                            <p>
                                ${category}
                                •
                                ${formatDate(expense.date)}
                            </p>
                        </div>
                    </div>

                    <div class="expense-total">
                        <span>Total Expense</span>
                        <strong>
                            ${formatCurrency(expense.totalAmount)}
                        </strong>
                    </div>
                </div>

                <div class="expense-details">
                    <div class="detail-box">
                        <span>Spent By</span>
                        <strong>
                            ${escapeHTML(spentBy)}
                            ${spentByMe ? " (You)" : ""}
                        </strong>
                    </div>

                    <div class="detail-box">
                        <span>My Given</span>
                        <strong>
                            ${formatCurrency(expense.myGiven)}
                        </strong>
                    </div>

                    <div class="detail-box">
                        <span>Date</span>
                        <strong>
                            ${formatDate(expense.date)}
                        </strong>
                    </div>
                </div>

                ${
                    details
                        ? `
                            <div class="additional-details">
                                <strong>Details:</strong>
                                ${details}
                            </div>
                        `
                        : ""
                }

                <div class="expense-actions">
                    <a
                        class="request-btn"
                        href="request-change.html?expense=${encodeURIComponent(
                            expenseId ?? ""
                        )}"
                    >
                        📝 Request a Change
                    </a>
                </div>
            `;

            expenseList.appendChild(card);
        });
}

// ========================================
// GET PERSON NAME
// ========================================

function getPersonName(personUsername) {
    return people[personUsername] || personUsername || "-";
}

// ========================================
// CATEGORY ICON
// ========================================

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

// ========================================
// CURRENCY
// ========================================

function formatCurrency(amount) {
    return Number(amount || 0).toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// ========================================
// DATE
// ========================================

function formatDate(date) {
    if (!date) {
        return "-";
    }

    const dateString = String(date);

    // Handle YYYY-MM-DD dates without timezone shifting
    const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (match) {
        return `${match[3]}-${match[2]}-${match[1]}`;
    }

    const parsedDate = new Date(dateString);

    if (Number.isNaN(parsedDate.getTime())) {
        return "-";
    }

    return parsedDate.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}

// ========================================
// ESCAPE HTML
// ========================================

function escapeHTML(value) {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
}

// ========================================
// BACK BUTTON
// ========================================

const backBtn = document.getElementById("backBtn");

if (backBtn) {
    backBtn.addEventListener("click", function () {
        window.location.href = "person-dashboard.html";
    });
}

// ========================================
// LOGOUT
// ========================================

function logout() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("userRole");
    localStorage.removeItem("personName");

    window.location.href = "../index.html";
}
