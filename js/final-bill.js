
// ========================================
// FINAL BILL
// ========================================

const API_URL =
    "https://expense-tracker-api.manojkumar3549g.workers.dev";


 // ========================================
// LOGIN
// ========================================

const username =
    sessionStorage.getItem("loggedInUser") ||
    localStorage.getItem("loggedInUser");

const role =
    sessionStorage.getItem("userRole") ||
    localStorage.getItem("userRole");

const token =
    sessionStorage.getItem("authToken") ||
    localStorage.getItem("authToken");

if (!username || !role || !token) {
    window.location.href = "../index.html";
}


// ========================================
// ELEMENTS
// ========================================

const totalExpenses = document.getElementById("totalExpenses");
const grandTotal = document.getElementById("grandTotal");
const totalPeople = document.getElementById("totalPeople");
const personSummary = document.getElementById("personSummary");
const expenseTableBody = document.getElementById("expenseTableBody");
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

function getSplits(expense) {
    return expense.splits || expense.split || {};
}

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

    if (parts.length !== 3) return String(date);

    return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

function escapeHTML(value) {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
}

// ========================================
// BACK BUTTON
// ========================================

if (backBtn) {
    backBtn.onclick = function () {
        window.location.href = role === "admin"
            ? "admin-dashboard.html"
            : "person-dashboard.html";
    };
}

// ========================================
// LOAD EXPENSES FROM CLOUDFLARE
// ========================================

async function loadExpenses() {
    if (!token) {
        window.location.href = "../index.html";
        return;
    }

    if (expenseTableBody) {
        expenseTableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;padding:40px;">
                    Loading expenses...
                </td>
            </tr>
        `;
    }

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

            throw new Error(
                data.error || "Unable to load expenses."
            );
        }

        expenses = Array.isArray(data)
            ? data
            : (data.expenses || []);

        calculateSummary();
        createPersonSummary();
        createExpenseTable();

    } catch (error) {
        console.error("Final bill loading failed:", error);

        if (expenseTableBody) {
            expenseTableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center;padding:40px;">
                        Unable to load expenses.
                        ${escapeHTML(error.message)}
                    </td>
                </tr>
            `;
        }

        if (personSummary) {
            personSummary.innerHTML = `
                <div class="empty-state">
                    <p>Unable to load the person summary.</p>
                </div>
            `;
        }
    }
}

// ========================================
// SUMMARY
// ========================================

function calculateSummary() {
    let total = 0;

    expenses.forEach(function (expense) {
        total += Number(expense.totalAmount) || 0;
    });

    if (totalExpenses) {
        totalExpenses.textContent = expenses.length;
    }

    if (grandTotal) {
        grandTotal.textContent = formatCurrency(total);
    }

    if (totalPeople) {
        totalPeople.textContent = Object.keys(people).length;
    }
}

// ========================================
// PERSON SUMMARY
// ========================================

function createPersonSummary() {
    if (!personSummary) return;

    personSummary.innerHTML = "";

    Object.keys(people).forEach(function (person) {
        let spent = 0;
        let given = 0;

        expenses.forEach(function (expense) {
            // Total amount paid by this person.
            if (String(expense.spentBy).toLowerCase() === person) {
                spent += Number(expense.totalAmount) || 0;
            }

            // Amount this person contributed toward expenses.
            const splits = getSplits(expense);
            given += Number(splits[person]) || 0;
        });

        const card = document.createElement("div");
        card.className = "person-bill-card";

        card.innerHTML = `
            <div class="person-bill-name">
                ${escapeHTML(people[person])}
            </div>

            <div class="person-stat">
                <span class="person-stat-label">Spent</span>
                <span class="person-stat-value">
                    ${formatCurrency(spent)}
                </span>
            </div>

            <div class="person-stat">
                <span class="person-stat-label">Given</span>
                <span class="person-stat-value">
                    ${formatCurrency(given)}
                </span>
            </div>
        `;

        personSummary.appendChild(card);
    });
}

// ========================================
// EXPENSE TABLE
// ========================================

function createExpenseTable() {
    if (!expenseTableBody) return;

    expenseTableBody.innerHTML = "";

    if (expenses.length === 0) {
        expenseTableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;padding:40px;">
                    No expenses recorded yet.
                </td>
            </tr>
        `;
        return;
    }

    const sortedExpenses = [...expenses].sort(function (a, b) {
        return new Date(b.date || 0) - new Date(a.date || 0);
    });

    sortedExpenses.forEach(function (expense) {
        const row = document.createElement("tr");

        const spentBy =
            people[String(expense.spentBy).toLowerCase()] ||
            expense.spentBy ||
            "-";

        const splits = getSplits(expense);
        let splitHTML = "";

        Object.keys(people).forEach(function (person) {
            const amount = Number(splits[person]) || 0;

            if (amount > 0) {
                splitHTML += `
                    <div class="split-item">
                        <span>${escapeHTML(people[person])}</span>
                        <strong>${formatCurrency(amount)}</strong>
                    </div>
                `;
            }
        });

        row.innerHTML = `
            <td>${formatDate(expense.date)}</td>

            <td>
                <div class="expense-name">
                    ${escapeHTML(expense.name)}
                </div>
                <div class="expense-category">
                    ${escapeHTML(expense.category)}
                </div>
            </td>

            <td>${escapeHTML(spentBy)}</td>

            <td>
                <strong>${formatCurrency(expense.totalAmount)}</strong>
            </td>

            <td>
                <div class="split-list">
                    ${splitHTML || "-"}
                </div>
            </td>
        `;

        expenseTableBody.appendChild(row);
    });
}

// ========================================
// INITIAL LOAD
// ========================================

loadExpenses();
