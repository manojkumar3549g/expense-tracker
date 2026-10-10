
// ========================================
// ALL EXPENSES PAGE
// ========================================

const API_URL =
    "https://expense-tracker-api.manojkumar3549g.workers.dev";

const username = localStorage.getItem("loggedInUser");
const role = localStorage.getItem("userRole");

const token =
    sessionStorage.getItem("authToken") ||
    localStorage.getItem("authToken");


// ========================================
// AUTH CHECK
// ========================================

if (!username || !role || !token) {
    window.location.href = "../index.html";
}

// ========================================
// ELEMENTS
// ========================================

const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const dateFilter = document.getElementById("dateFilter");
const clearFilters = document.getElementById("clearFilters");
const expensesContainer = document.getElementById("expensesContainer");
const expenseCount = document.getElementById("expenseCount");
const totalAmount = document.getElementById("totalAmount");
const yourGiven = document.getElementById("yourGiven");
const backBtn = document.getElementById("backBtn");

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

let expenses = [];

// ========================================
// HELPERS
// ========================================

function formatCurrency(amount) {
    return Number(amount || 0).toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function formatDate(date) {
    if (!date) return "-";

    const parts = String(date).split("-");

    if (parts.length !== 3) return date;

    return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

function escapeHTML(value) {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
}

function getSplits(expense) {
    return expense.splits || expense.split || {};
}

function showMessage(message) {
    alert(message);
}

// ========================================
// LOAD EXPENSES FROM CLOUDFLARE
// ========================================

async function loadExpenses() {
    if (!token) {
        window.location.href = "../index.html";
        return;
    }

    expensesContainer.innerHTML =
        '<div class="empty-state"><h3>Loading expenses...</h3></div>';

    try {
        const response = await fetch(`${API_URL}/api/expenses`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem("authToken");
                localStorage.removeItem("loggedInUser");
                localStorage.removeItem("userRole");
                localStorage.removeItem("personName");

                window.location.href = "../index.html";
                return;
            }

            throw new Error(data.error || "Unable to load expenses.");
        }

        expenses = Array.isArray(data)
            ? data
            : (data.expenses || []);

        renderExpenses();

    } catch (error) {
        console.error("Loading expenses failed:", error);

        expensesContainer.innerHTML = `
            <div class="empty-state">
                <h3>Unable to load expenses</h3>
                <p>${escapeHTML(error.message || "Please refresh the page and try again.")}</p>
            </div>
        `;
    }
}

// ========================================
// BACK BUTTON
// ========================================

if (backBtn) {
    backBtn.href = role === "admin"
        ? "admin-dashboard.html"
        : "person-dashboard.html";
}

// ========================================
// EVENT LISTENERS
// ========================================

if (searchInput) {
    searchInput.addEventListener("input", renderExpenses);
}

if (categoryFilter) {
    categoryFilter.addEventListener("change", renderExpenses);
}

if (dateFilter) {
    dateFilter.addEventListener("change", renderExpenses);
}

if (clearFilters) {
    clearFilters.addEventListener("click", function () {
        if (searchInput) searchInput.value = "";
        if (categoryFilter) categoryFilter.value = "all";
        if (dateFilter) dateFilter.value = "";

        renderExpenses();
    });
}

// ========================================
// RENDER EXPENSES
// ========================================

function renderExpenses() {
    if (!expensesContainer) return;

    const search = searchInput
        ? searchInput.value.trim().toLowerCase()
        : "";

    const category = categoryFilter
        ? categoryFilter.value
        : "all";

    const date = dateFilter
        ? dateFilter.value
        : "";

    const filteredExpenses = expenses.filter(function (expense) {
        const name = String(expense.name || "").toLowerCase();

        const matchesSearch =
            !search || name.includes(search);

        const matchesCategory =
            category === "all" ||
            expense.category === category;

        const matchesDate =
            !date || expense.date === date;

        return matchesSearch && matchesCategory && matchesDate;
    });

    updateSummary(filteredExpenses);
    displayExpenses(filteredExpenses);
}

// ========================================
// SUMMARY
// ========================================

function updateSummary(filteredExpenses) {
    let total = 0;
    let given = 0;

    filteredExpenses.forEach(function (expense) {
        total += Number(expense.totalAmount) || 0;

        const splits = getSplits(expense);
        given += Number(splits[username]) || 0;
    });

    if (expenseCount) {
        expenseCount.textContent = filteredExpenses.length;
    }

    if (totalAmount) {
        totalAmount.textContent = formatCurrency(total);
    }

    if (yourGiven) {
        yourGiven.textContent = formatCurrency(given);
    }
}

// ========================================
// DISPLAY EXPENSES
// ========================================

function displayExpenses(filteredExpenses) {
    expensesContainer.innerHTML = "";

    if (filteredExpenses.length === 0) {
        expensesContainer.innerHTML = `
            <div class="empty-state">
                <h3>No expenses found</h3>
                <p>There are no expenses matching your current filters.</p>
            </div>
        `;
        return;
    }

    const sortedExpenses = [...filteredExpenses].sort(function (a, b) {
        return new Date(b.date || 0) - new Date(a.date || 0);
    });

    sortedExpenses.forEach(function (expense) {
        expensesContainer.appendChild(createExpenseCard(expense));
    });
}

// ========================================
// CREATE EXPENSE CARD
// ========================================

function createExpenseCard(expense) {
    const card = document.createElement("div");
    card.className = "expense-card";

    const spentByName =
        people[expense.spentBy] ||
        expense.spentBy ||
        "Unknown";

    const splitHTML = createSplitHTML(expense);

    let actionsHTML = "";

    if (role === "admin") {
        actionsHTML = `
            <div class="expense-actions">
                <button
                    type="button"
                    class="action-btn edit-btn"
                    data-action="edit"
                    data-id="${escapeHTML(expense.id)}"
                >✏️ Edit</button>

                <button
                    type="button"
                    class="action-btn delete-btn"
                    data-action="delete"
                    data-id="${escapeHTML(expense.id)}"
                >🗑️ Delete</button>
            </div>
        `;
    } else {
        actionsHTML = `
            <div class="expense-actions">
                <button
                    type="button"
                    class="action-btn request-btn"
                    data-action="request"
                    data-id="${escapeHTML(expense.id)}"
                >📝 Request a Change</button>
            </div>
        `;
    }

    card.innerHTML = `
        <div class="expense-header">
            <div>
                <h2 class="expense-title">
                    ${escapeHTML(expense.name)}
                </h2>

                <span class="expense-category">
                    ${escapeHTML(expense.category)}
                </span>
            </div>

            <div class="expense-total">
                ${formatCurrency(expense.totalAmount)}
            </div>
        </div>

        <div class="expense-info">
            <div class="info-box">
                <span class="info-label">Date</span>
                <span class="info-value">
                    ${formatDate(expense.date)}
                </span>
            </div>

            <div class="info-box">
                <span class="info-label">Spent By</span>
                <span class="info-value">
                    ${escapeHTML(spentByName)}
                </span>
            </div>

            <div class="info-box">
                <span class="info-label">Total</span>
                <span class="info-value">
                    ${formatCurrency(expense.totalAmount)}
                </span>
            </div>
        </div>

        <div class="split-section">
            <div class="split-title">Amount Given</div>
            <div class="split-list">${splitHTML}</div>
        </div>

        ${
            expense.details
                ? `
                    <div class="expense-details">
                        <strong>Details:</strong>
                        ${escapeHTML(expense.details)}
                    </div>
                `
                : ""
        }

        ${actionsHTML}
    `;

    return card;
}

// ========================================
// EXPENSE CARD BUTTONS
// ========================================

expensesContainer.addEventListener("click", function (event) {
    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const id = button.dataset.id;
    const action = button.dataset.action;

    if (action === "edit" && role === "admin") {
        editExpense(id);
    } else if (action === "delete" && role === "admin") {
        deleteExpense(id);
    } else if (action === "request" && role !== "admin") {
        requestChange(id);
    }
});

// ========================================
// SPLIT HTML
// ========================================

function createSplitHTML(expense) {
    let html = "";
    const splits = getSplits(expense);

    Object.keys(people).forEach(function (person) {
        const amount = Number(splits[person]) || 0;

        html += `
            <div class="split-person">
                <span class="split-person-name">
                    ${escapeHTML(people[person])}
                </span>

                <span class="split-person-amount">
                    ${formatCurrency(amount)}
                </span>
            </div>
        `;
    });

    return html;
}

// ========================================
// ADMIN - EDIT EXPENSE
// ========================================

function editExpense(id) {
    const expense = expenses.find(function (item) {
        return String(item.id) === String(id);
    });

    if (!expense) {
        showMessage("This expense could not be found. Please refresh the page.");
        return;
    }

    localStorage.setItem("editExpenseId", String(expense.id));

    window.location.href =
        "add-expense.html?edit=" + encodeURIComponent(expense.id);
}

window.editExpense = editExpense;

// ========================================
// ADMIN - DELETE EXPENSE
// ========================================

async function deleteExpense(id) {
    if (role !== "admin") {
        showMessage("Only the admin can delete expenses.");
        return;
    }

    const expense = expenses.find(function (item) {
        return String(item.id) === String(id);
    });

    if (!expense) {
        showMessage("This expense could not be found. Please refresh the page.");
        return;
    }

    const confirmed = window.confirm(
        `Are you sure you want to delete "${expense.name}"?`
    );

    if (!confirmed) return;

    try {
        const response = await fetch(
            `${API_URL}/api/expenses/${encodeURIComponent(expense.id)}`,
            {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || "Failed to delete expense."
            );
        }

        expenses = expenses.filter(function (item) {
            return String(item.id) !== String(expense.id);
        });

        renderExpenses();
        showMessage("Expense deleted successfully.");

    } catch (error) {
        console.error("Delete expense failed:", error);
        showMessage(error.message || "Unable to delete expense. Please try again.");
    }
}

window.deleteExpense = deleteExpense;

// ========================================
// PERSON - REQUEST CHANGE
// ========================================

function requestChange(id) {
    const expense = expenses.find(function (item) {
        return String(item.id) === String(id);
    });

    if (!expense) {
        showMessage("This expense could not be found. Please refresh the page.");
        return;
    }

    window.location.href =
        "request-change.html?expense=" +
        encodeURIComponent(expense.id);
}

window.requestChange = requestChange;

// ========================================
// INITIAL LOAD
// ========================================

loadExpenses();
