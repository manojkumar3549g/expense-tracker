
"use strict";

// ========================================
// ADD / EDIT EXPENSE
// ========================================

const API_URL =
    "https://expense-tracker-api.manojkumar3549g.workers.dev";

const role = localStorage.getItem("userRole");
const token = localStorage.getItem("authToken");

if (role !== "admin" || !token) {
    window.location.href = "../index.html";
}

// ========================================
// ELEMENTS
// ========================================

const totalAmount = document.getElementById("totalAmount");
const displayTotal = document.getElementById("displayTotal");
const displayGiven = document.getElementById("displayGiven");
const displayDifference = document.getElementById("displayDifference");
const amountMessage = document.getElementById("amountMessage");
const expenseForm = document.getElementById("expenseForm");
const togglePeopleBtn = document.getElementById("togglePeopleBtn");
const spentBySelect = document.getElementById("spentBy");
const splitPeopleContainer =
    document.getElementById("splitPeopleContainer");

const pageTitle = document.querySelector("h1");
const pageDescription = document.querySelector(".page-title p");

const submitButton = expenseForm
    ? expenseForm.querySelector('button[type="submit"]')
    : null;

const urlParams = new URLSearchParams(window.location.search);

let editExpenseId =
    urlParams.get("edit") || localStorage.getItem("editExpenseId");

const isEditMode = Boolean(editExpenseId);

let people = [];
let checkboxes = [];
let amountInputs = [];
let isSaving = false;

// ========================================
// HELPERS
// ========================================


function getToken() {
    return (
        sessionStorage.getItem("authToken") ||
        localStorage.getItem("authToken")
    );
}


function getPersonInput(username) {
    return Array.from(
        document.querySelectorAll(".given-amount")
    ).find(input => input.dataset.person === username) || null;
}

function formatCurrency(amount) {
    return Number(amount || 0).toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function escapeHTML(value) {
    const element = document.createElement("div");
    element.textContent = value ?? "";
    return element.innerHTML;
}

async function showMessageBox(message, type, title) {
    if (typeof showAlert === "function") {
        await showAlert(message, type, title);
    } else {
        window.alert(message);
    }
}

function displayFormMessage(message, type) {
    if (!amountMessage) return;

    amountMessage.textContent = message;
    amountMessage.className = "form-message";

    if (type) {
        amountMessage.classList.add(type);
    }
}

async function apiRequest(path, options = {}) {
    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            ...(options.body ? {
                "Content-Type": "application/json"
            } : {}),
            Authorization: `Bearer ${getToken() || ""}`,
            ...(options.headers || {})
        }
    });

    const data = await response.json().catch(() => ({}));

    
if (response.status === 401) {
    for (const storage of [localStorage, sessionStorage]) {
        storage.removeItem("authToken");
        storage.removeItem("loggedInUser");
        storage.removeItem("userRole");
        storage.removeItem("personName");
    }

    window.location.href = "../index.html";
    throw new Error("Session expired. Please log in again.");
}


    if (!response.ok) {
        throw new Error(data.error || "Request failed.");
    }

    return data;
}

// ========================================
// LOAD ACTIVE PEOPLE DYNAMICALLY
// ========================================

async function loadPeople() {
    if (spentBySelect) {
        spentBySelect.innerHTML =
            '<option value="">Loading people...</option>';
    }

    if (splitPeopleContainer) {
        splitPeopleContainer.innerHTML =
            '<p class="section-description">Loading people...</p>';
    }

    const response = await apiRequest("/api/people");

    const accounts = Array.isArray(response)
        ? response
        : response.people || [];

    people = accounts.filter(function (person) {
        return (
            person.username &&
            person.role !== "admin" &&
            (person.enabled === true ||
             person.enabled === 1 ||
             person.enabled === "1")
        );
    });

    // Populate Spent By.
    if (spentBySelect) {
        spentBySelect.innerHTML =
            '<option value="">Select person</option>';

        people.forEach(function (person) {
            const option = document.createElement("option");
            option.value = person.username;
            option.textContent = person.name || person.username;
            spentBySelect.appendChild(option);
        });
    }

    // Populate Split With.
    if (splitPeopleContainer) {
        splitPeopleContainer.innerHTML = "";

        if (people.length === 0) {
            splitPeopleContainer.innerHTML = `
                <p class="section-description">
                    No active people found. Add or enable an account first.
                </p>
            `;
        } else {
            people.forEach(function (person, index) {
                const row = document.createElement("div");
                row.className = "person-row";

                const checkboxId = `personCheck${index}`;
                const amountId = `personAmount${index}`;

                row.innerHTML = `
                    <div class="person-check">
                        <input
                            type="checkbox"
                            class="person-checkbox"
                            id="${checkboxId}"
                            value="${escapeHTML(person.username)}"
                            checked
                        >
                        <label for="${checkboxId}">
                            ${escapeHTML(person.name || person.username)}
                        </label>
                    </div>

                    <div class="person-amount-input">
                        <span>₹</span>
                        <input
                            type="number"
                            class="given-amount"
                            id="${amountId}"
                            data-person="${escapeHTML(person.username)}"
                            min="0"
                            step="0.01"
                            value="0.00"
                        >
                    </div>
                `;

                splitPeopleContainer.appendChild(row);
            });
        }
    }

    // Refresh references AFTER creating the dynamic elements.
    checkboxes = Array.from(
        document.querySelectorAll(".person-checkbox")
    );

    amountInputs = Array.from(
        document.querySelectorAll(".given-amount")
    );

    checkboxes.forEach(function (checkbox) {
        const input = getPersonInput(checkbox.value);

        if (input) {
            input.disabled = !checkbox.checked;
        }
    });

    updateToggleButton();
}

// ========================================
// AMOUNT CALCULATION
// ========================================

function calculateAmounts() {
    const total = Number(totalAmount?.value) || 0;

    let givenInPaise = 0;

    amountInputs.forEach(function (input) {
        if (!input.disabled) {
            const amount = Number(input.value);

            if (Number.isFinite(amount) && amount >= 0) {
                givenInPaise += Math.round(amount * 100);
            }
        }
    });

    const totalInPaise = Math.round(total * 100);
    const differenceInPaise = totalInPaise - givenInPaise;

    if (displayTotal) {
        displayTotal.textContent = formatCurrency(total);
    }

    if (displayGiven) {
        displayGiven.textContent = formatCurrency(givenInPaise / 100);
    }

    if (displayDifference) {
        displayDifference.textContent =
            formatCurrency(Math.abs(differenceInPaise) / 100);
    }

    if (totalInPaise <= 0) {
        displayFormMessage("", "");
        return false;
    }

    if (differenceInPaise === 0) {
        displayFormMessage("✓ Amounts are correct.", "success");
        return true;
    }

    if (differenceInPaise > 0) {
        displayFormMessage(
            "⚠ " + formatCurrency(differenceInPaise / 100) +
            " is still remaining.",
            "warning"
        );
        return false;
    }

    displayFormMessage(
        "⚠ Given amount exceeds the total by " +
        formatCurrency(Math.abs(differenceInPaise) / 100) + ".",
        "error"
    );

    return false;
}

function redistributeAmount() {
    const total = Number(totalAmount?.value) || 0;

    const selectedPeople = checkboxes.filter(
        checkbox => checkbox.checked
    );

    if (selectedPeople.length === 0 || total <= 0) {
        amountInputs.forEach(function (input) {
            input.value = "0.00";
        });

        calculateAmounts();
        return;
    }

    // Work in paise to avoid rounding errors.
    const totalInPaise = Math.round(total * 100);
    const baseAmount = Math.floor(
        totalInPaise / selectedPeople.length
    );
    const remainder = totalInPaise % selectedPeople.length;

    selectedPeople.forEach(function (checkbox, index) {
        const input = getPersonInput(checkbox.value);
        if (!input) return;

        let amountInPaise = baseAmount;

        if (index < remainder) {
            amountInPaise += 1;
        }

        input.value = (amountInPaise / 100).toFixed(2);
        input.disabled = false;
    });

    checkboxes.forEach(function (checkbox) {
        if (!checkbox.checked) {
            const input = getPersonInput(checkbox.value);

            if (input) {
                input.value = "0.00";
                input.disabled = true;
            }
        }
    });

    calculateAmounts();
}

// ========================================
// SELECT / UNSELECT ALL
// ========================================

function updateToggleButton() {
    if (!togglePeopleBtn) return;

    const allSelected =
        checkboxes.length > 0 &&
        checkboxes.every(checkbox => checkbox.checked);

    togglePeopleBtn.textContent =
        allSelected ? "Unselect All" : "Select All";
}

function toggleAllPeople() {
    const allSelected =
        checkboxes.length > 0 &&
        checkboxes.every(checkbox => checkbox.checked);

    checkboxes.forEach(function (checkbox) {
        checkbox.checked = !allSelected;

        const input = getPersonInput(checkbox.value);

        if (input) {
            input.disabled = allSelected;

            if (allSelected) {
                input.value = "0.00";
            }
        }
    });

    redistributeAmount();
    updateToggleButton();
}

window.toggleAllPeople = toggleAllPeople;

if (togglePeopleBtn) {
    togglePeopleBtn.addEventListener("click", toggleAllPeople);
}

// ========================================
// DYNAMIC SPLIT INPUT EVENTS
// ========================================

if (splitPeopleContainer) {
    splitPeopleContainer.addEventListener("change", function (event) {
        if (!event.target.matches(".person-checkbox")) return;

        const checkbox = event.target;
        const input = getPersonInput(checkbox.value);

        if (input) {
            input.disabled = !checkbox.checked;

            if (!checkbox.checked) {
                input.value = "0.00";
            }
        }

        redistributeAmount();
        updateToggleButton();
    });

    splitPeopleContainer.addEventListener("input", function (event) {
        if (event.target.matches(".given-amount")) {
            calculateAmounts();
        }
    });
}

if (totalAmount) {
    totalAmount.addEventListener("input", redistributeAmount);
}

// ========================================
// LOAD EXPENSE FOR EDIT
// ========================================

async function loadExpenseForEdit() {
    if (!isEditMode) return;

    const data = await apiRequest("/api/expenses");

    const expenses = Array.isArray(data)
        ? data
        : data.expenses || [];

    const expense = expenses.find(
        item => String(item.id) === String(editExpenseId)
    );

    if (!expense) {
        throw new Error("The selected expense could not be found.");
    }

    document.getElementById("category").value = expense.category || "";
    document.getElementById("expenseDate").value = expense.date || "";
    document.getElementById("expenseName").value = expense.name || "";
    totalAmount.value = Number(expense.totalAmount || 0).toFixed(2);
    document.getElementById("details").value = expense.details || "";

    const splitAmounts = expense.splits || expense.split || {};

    // Include the historical payer even if the account is now disabled.
    // This keeps old expenses viewable and editable.
    const payer = expense.spentBy || "";

    if (
        payer &&
        !Array.from(spentBySelect.options).some(
            option => option.value === payer
        )
    ) {
        const option = document.createElement("option");
        option.value = payer;
        option.textContent = `${payer} (historical account)`;
        spentBySelect.appendChild(option);
    }

    spentBySelect.value = payer;

    checkboxes.forEach(function (checkbox) {
        const input = getPersonInput(checkbox.value);
        const amount = Number(splitAmounts[checkbox.value] || 0);

        checkbox.checked =
            Object.prototype.hasOwnProperty.call(
                splitAmounts,
                checkbox.value
            ) && amount > 0;

        if (input) {
            input.value = amount.toFixed(2);
            input.disabled = !checkbox.checked;
        }
    });

    if (pageTitle) {
        pageTitle.textContent = "✏️ Edit Expense";
    }

    if (pageDescription) {
        pageDescription.textContent =
            "Update the expense information and amount given by each person.";
    }

    if (submitButton) {
        submitButton.textContent = "💾 Update Expense";
    }

    updateToggleButton();
    calculateAmounts();
}

// ========================================
// SAVE / UPDATE EXPENSE
// ========================================

if (expenseForm) {
    expenseForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        if (isSaving) return;

        if (!getToken()) {
            await showMessageBox(
                "Please log in again.",
                "error",
                "Session Expired"
            );

            window.location.href = "../index.html";
            return;
        }

        const total = Number(totalAmount.value) || 0;

        if (!Number.isFinite(total) || total <= 0) {
            displayFormMessage(
                "Please enter a valid total expense amount.",
                "error"
            );
            return;
        }

        const split = {};
        let givenInPaise = 0;
        let invalidAmount = false;

        amountInputs.forEach(function (input) {
            if (input.disabled) return;

            const amount = Number(input.value);

            if (!Number.isFinite(amount) || amount < 0) {
                invalidAmount = true;
                return;
            }

            givenInPaise += Math.round(amount * 100);
            split[input.dataset.person] = Number(amount.toFixed(2));
        });

        if (invalidAmount) {
            displayFormMessage(
                "Enter valid, non-negative amounts for selected people.",
                "error"
            );
            return;
        }

        if (Object.keys(split).length === 0) {
            displayFormMessage(
                "Please select at least one person.",
                "error"
            );
            return;
        }

        if (givenInPaise !== Math.round(total * 100)) {
            displayFormMessage(
                "Please make sure Total Given equals Total Expense.",
                "error"
            );
            return;
        }

        const category = document.getElementById("category").value;
        const name = document.getElementById("expenseName").value.trim();
        const date = document.getElementById("expenseDate").value;
        const spentBy = spentBySelect.value;
        const details = document.getElementById("details").value.trim();

        if (!category || !name || !date || !spentBy) {
            displayFormMessage(
                "Please complete all required fields.",
                "error"
            );
            return;
        }

        const apiExpense = {
            category,
            name,
            date,
            totalAmount: total,
            spentBy,
            details,
            splits: split
        };

        const url = isEditMode
            ? `${API_URL}/api/expenses/${encodeURIComponent(editExpenseId)}`
            : `${API_URL}/api/expenses`;

        isSaving = true;

        try {
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent =
                    isEditMode ? "Updating..." : "Saving...";
            }

            const response = await fetch(url, {
                method: isEditMode ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getToken()}`
                },
                body: JSON.stringify(apiExpense)
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data.error || "Unable to save the expense."
                );
            }

            localStorage.removeItem("editExpenseId");

            await showMessageBox(
                isEditMode
                    ? "Expense updated successfully!"
                    : "Expense saved successfully!",
                "success",
                isEditMode ? "Expense Updated" : "Expense Saved"
            );

            window.location.href = "admin-dashboard.html";

        } catch (error) {
            console.error("Saving expense failed:", error);

            await showMessageBox(
                error.message || "Unable to connect to the server.",
                "error",
                "Save Failed"
            );

        } finally {
            isSaving = false;

            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent =
                    isEditMode ? "💾 Update Expense" : "Save Expense";
            }
        }
    });
}

// ========================================
// BACK BUTTON
// ========================================

function goBack() {
    if (isEditMode) {
        window.location.href = "all-expenses.html";
    } else {
        window.location.href = "admin-dashboard.html";
    }
}

window.goBack = goBack;

const headerBackButton = document.getElementById("backBtn");

if (headerBackButton) {
    headerBackButton.addEventListener("click", goBack);
}

// ========================================
// INITIALIZE PAGE
// ========================================

async function initializeExpenseForm() {
    try {
        await loadPeople();

        if (isEditMode) {
            await loadExpenseForEdit();
        } else {
            redistributeAmount();
            updateToggleButton();
        }

    } catch (error) {
        console.error("Expense form initialization failed:", error);

        await showMessageBox(
            error.message || "Unable to load people from the server.",
            "error",
            "Loading Failed"
        );

        if (spentBySelect) {
            spentBySelect.innerHTML =
                '<option value="">Unable to load people</option>';
        }

        if (splitPeopleContainer) {
            splitPeopleContainer.innerHTML = `
                <p class="form-message error">
                    Unable to load people. Refresh the page and try again.
                </p>
            `;
        }
    }
}

initializeExpenseForm();
