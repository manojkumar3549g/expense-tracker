
const API_URL = "https://expense-tracker-api.manojkumar3549g.workers.dev";

// ========================================
// REQUEST CHANGE
// ========================================

// LOGIN CHECK

const username = localStorage.getItem("loggedInUser");
const role = localStorage.getItem("userRole");
const personName = localStorage.getItem("personName");

if (
    !username ||
    role !== "person" ||
    !localStorage.getItem("authToken")
) {
    window.location.href = "../index.html";
}

// ========================================
// ELEMENTS
// ========================================

const personNameElement = document.getElementById("personName");
const form = document.getElementById("changeRequestForm");
const expenseSelect = document.getElementById("expenseSelect");
const fieldSelect = document.getElementById("fieldSelect");
const currentValue = document.getElementById("currentValue");
const requestedValue = document.getElementById("requestedValue");
const reason = document.getElementById("reason");
const expenseInfo = document.getElementById("expenseInfo");
const expenseName = document.getElementById("expenseName");
const expenseTotal = document.getElementById("expenseTotal");
const expenseSpentBy = document.getElementById("expenseSpentBy");
const message = document.getElementById("message");

const people = {
    vetri: "Vetrivel",
    nitheen: "Nitheen",
    yash: "Yaswanth",
    dharshu: "Dharshini",
    mano: "ManojKumar"
};

let expenses = [];
let isSubmitting = false;

const urlParams = new URLSearchParams(window.location.search);
const requestedExpenseId = urlParams.get("expense");

// ========================================
// INITIALIZE
// ========================================

if (personNameElement) {
    personNameElement.textContent =
        personName || getPersonName(username);
}

if (expenseSelect) {
    expenseSelect.addEventListener("change", showExpenseInfo);
}

if (fieldSelect) {
    fieldSelect.addEventListener("change", function () {
        updateCurrentValue();
        updateRequestedField();
    });
}

if (form) {
    form.addEventListener("submit", submitChangeRequest);
}

const backBtn = document.getElementById("backBtn");
const topBackBtn = document.getElementById("topBackBtn");

[backBtn, topBackBtn].forEach(function (button) {
    if (button) {
        button.addEventListener("click", function () {
            window.location.href = "person-dashboard.html";
        });
    }
});

loadExpenses();
updateRequestedField();

// ========================================
// API REQUEST
// ========================================

async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem("authToken");

    if (!token) {
        redirectToLogin();
        throw new Error("Please log in again.");
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    let data = {};

    try {
        data = await response.json();
    } catch {
        data = {};
    }

    if (response.status === 401 || response.status === 403) {
        redirectToLogin();
        throw new Error("Your session has expired. Please log in again.");
    }

    if (!response.ok) {
        throw new Error(
            data.error || "The request could not be completed."
        );
    }

    return data;
}

// ========================================
// REDIRECT TO LOGIN
// ========================================

function redirectToLogin() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("userRole");
    localStorage.removeItem("personName");

    window.location.href = "../index.html";
}

// ========================================
// LOAD EXPENSES
// ========================================

async function loadExpenses() {
    if (!expenseSelect) {
        console.error("Expense dropdown was not found.");
        return;
    }

    expenseSelect.innerHTML =
        '<option value="">Loading expenses...</option>';

    try {
        const data = await apiRequest("/api/expenses");

        expenses = Array.isArray(data)
            ? data
            : Array.isArray(data.expenses)
                ? data.expenses
                : [];

        expenseSelect.innerHTML =
            '<option value="">-- Select an Expense --</option>';

        if (expenses.length === 0) {
            expenseSelect.innerHTML +=
                '<option value="" disabled>No expenses available</option>';

            showMessage("No expenses are available to request changes for.", "error");
            return;
        }

        const sortedExpenses = [...expenses].sort(function (a, b) {
            return new Date(b.date || 0) - new Date(a.date || 0);
        });

        sortedExpenses.forEach(function (expense) {
            const option = document.createElement("option");

            option.value = String(expense.id);
            option.textContent =
                `${expense.name || "Expense"} - ` +
                `${formatCurrency(expense.totalAmount)} - ` +
                `${formatDate(expense.date)}`;

            expenseSelect.appendChild(option);
        });

        // Select the expense linked from the personal expenses page.
        if (requestedExpenseId) {
            const matchingExpense = expenses.find(function (expense) {
                return String(expense.id) === String(requestedExpenseId);
            });

            if (matchingExpense) {
                expenseSelect.value = String(matchingExpense.id);
                showExpenseInfo();
            } else {
                showMessage(
                    "The selected expense was not found. Please choose an expense from the list.",
                    "error"
                );
            }
        }
    } catch (error) {
        console.error("Loading expenses failed:", error);

        expenseSelect.innerHTML =
            '<option value="">Unable to load expenses</option>';

        showMessage(
            error.message || "Unable to load expenses. Please refresh.",
            "error"
        );
    }
}

// ========================================
// GET SELECTED EXPENSE
// ========================================

function getSelectedExpense() {
    if (!expenseSelect) {
        return undefined;
    }

    const id = expenseSelect.value;

    return expenses.find(function (expense) {
        return String(expense.id) === String(id);
    });
}

// ========================================
// SHOW EXPENSE INFORMATION
// ========================================

function showExpenseInfo() {
    const expense = getSelectedExpense();

    if (!expense) {
        if (expenseInfo) {
            expenseInfo.style.display = "none";
        }

        if (currentValue) {
            currentValue.value = "";
        }

        return;
    }

    if (expenseInfo) {
        expenseInfo.style.display = "block";
    }

    if (expenseName) {
        expenseName.textContent = expense.name || "-";
    }

    if (expenseTotal) {
        expenseTotal.textContent = formatCurrency(expense.totalAmount);
    }

    if (expenseSpentBy) {
        expenseSpentBy.textContent = getPersonName(expense.spentBy);
    }

    updateCurrentValue();
}

// ========================================
// CURRENT VALUE
// ========================================

function updateCurrentValue() {
    const expense = getSelectedExpense();
    const field = fieldSelect ? fieldSelect.value : "";

    if (!currentValue) {
        return;
    }

    if (!expense || !field) {
        currentValue.value = "";
        return;
    }

    switch (field) {
        case "myGivenAmount": {
            const splitAmounts = expense.splits || expense.split || {};
            const value = Number(splitAmounts[username]) || 0;

            currentValue.value = formatCurrency(value);
            break;
        }

        case "spentBy":
            currentValue.value = expense.spentBy || "";
            break;

        case "details":
            currentValue.value = expense.details || "No details";
            break;

        case "date":
            currentValue.value = expense.date || "";
            break;

        default:
            currentValue.value = "";
    }
}

// ========================================
// REQUESTED VALUE SETTINGS
// ========================================

function updateRequestedField() {
    if (!requestedValue || !fieldSelect) {
        return;
    }

    requestedValue.value = "";
    requestedValue.type = "text";
    requestedValue.removeAttribute("min");
    requestedValue.removeAttribute("step");

    switch (fieldSelect.value) {
        case "myGivenAmount":
            requestedValue.type = "number";
            requestedValue.step = "0.01";
            requestedValue.min = "0";
            requestedValue.placeholder = "Example: 250";
            break;

        case "spentBy":
            requestedValue.placeholder = "Enter username, e.g. vetri";
            break;

        case "details":
            requestedValue.placeholder = "Enter updated expense details";
            break;

        case "date":
            requestedValue.type = "date";
            requestedValue.placeholder = "";
            break;

        default:
            requestedValue.placeholder = "Enter the new value";
    }
}

// ========================================
// SUBMIT CHANGE REQUEST
// ========================================

async function submitChangeRequest(event) {
    event.preventDefault();

    if (isSubmitting) {
        return;
    }

    const expense = getSelectedExpense();

    if (!expense) {
        showMessage("Please select a valid expense.", "error");
        return;
    }

    const field = fieldSelect ? fieldSelect.value : "";
    const newValue = requestedValue
        ? requestedValue.value.trim()
        : "";
    const requestReason = reason
        ? reason.value.trim()
        : "";

    if (!field) {
        showMessage("Please select what you want to change.", "error");
        return;
    }

    if (!newValue) {
        showMessage("Please enter the requested value.", "error");
        return;
    }

    if (!requestReason) {
        showMessage("Please enter a reason.", "error");
        return;
    }

    // Validate the requested amount.
    if (field === "myGivenAmount") {
        const amount = Number(newValue);

        if (!Number.isFinite(amount) || amount < 0) {
            showMessage("Please enter a valid amount.", "error");
            return;
        }
    }

    // Validate the requested payer username.
    let finalValue = newValue;

    if (field === "spentBy") {
        finalValue = newValue.toLowerCase();

        if (!Object.prototype.hasOwnProperty.call(people, finalValue)) {
            showMessage(
                "Enter a valid username: vetri, nitheen, yash, dharshu or mano.",
                "error"
            );
            return;
        }
    }

    // Prepare the request body expected by the Worker API.
    const requestBody = {
        expenseId: expense.id,
        field: field,
        requestedValue:
            field === "myGivenAmount"
                ? Number(finalValue)
                : finalValue,
        reason: requestReason
    };

    isSubmitting = true;

    const submitButton = form.querySelector(
        'button[type="submit"], input[type="submit"]'
    );

    if (submitButton) {
        submitButton.disabled = true;

        if (submitButton.tagName === "BUTTON") {
            submitButton.dataset.originalText =
                submitButton.textContent;

            submitButton.textContent = "Submitting...";
        }
    }

    try {
        await apiRequest("/api/change-requests", {
            method: "POST",
            body: JSON.stringify(requestBody)
        });

        showMessage(
            "✓ Change request submitted successfully. Admin will review it.",
            "success"
        );

        form.reset();

        if (currentValue) {
            currentValue.value = "";
        }

        if (expenseInfo) {
            expenseInfo.style.display = "none";
        }

        // Return to the dashboard after successful submission.
        window.setTimeout(function () {
            window.location.href = "person-dashboard.html";
        }, 1200);
    } catch (error) {
        console.error("Submitting change request failed:", error);

        showMessage(
            error.message || "Unable to submit your request. Please try again.",
            "error"
        );
    } finally {
        isSubmitting = false;

        if (submitButton) {
            submitButton.disabled = false;

            if (
                submitButton.tagName === "BUTTON" &&
                submitButton.dataset.originalText
            ) {
                submitButton.textContent =
                    submitButton.dataset.originalText;

                delete submitButton.dataset.originalText;
            }
        }
    }
}

// ========================================
// GET PERSON NAME
// ========================================

function getPersonName(personUsername) {
    return people[personUsername] || personUsername || "-";
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

    const match = String(date).match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (match) {
        return `${match[3]}-${match[2]}-${match[1]}`;
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return String(date);
    }

    return parsedDate.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}

// ========================================
// MESSAGE
// ========================================

function showMessage(text, type) {
    if (!message) {
        console.log(text);
        return;
    }

    message.textContent = text;
    message.className = `message ${type}`;

    window.scrollTo({
        top: 0,
        behavior: "smooth"
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