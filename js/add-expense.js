// ========================================
// ADD / EDIT EXPENSE
// ========================================

const API_URL =
    "https://expense-tracker-api.manojkumar3549g.workers.dev";

// ========================================
// ADMIN ACCESS
// ========================================

const role = localStorage.getItem("userRole");

if (role !== "admin") {
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

const checkboxes = document.querySelectorAll(".person-checkbox");
const amountInputs = document.querySelectorAll(".given-amount");

const pageTitle = document.querySelector("h1");
const pageDescription = document.querySelector(".welcome-section p");

const submitButton = expenseForm
    ? expenseForm.querySelector('button[type="submit"]')
    : null;

// ========================================
// EDIT MODE
// ========================================

const urlParams = new URLSearchParams(window.location.search);

let editExpenseId = urlParams.get("edit");

if (!editExpenseId) {
    editExpenseId = localStorage.getItem("editExpenseId");
}

const isEditMode = Boolean(editExpenseId);

// ========================================
// HELPERS
// ========================================

function getToken() {
    return localStorage.getItem("authToken");
}

function getPersonInput(person) {
    return document.querySelector(
        `.given-amount[data-person="${person}"]`
    );
}

function formatCurrency(amount) {
    return Number(amount || 0).toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
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

// ========================================
// INITIAL PEOPLE STATE
// ========================================

checkboxes.forEach(function (checkbox) {
    checkbox.checked = true;

    const input = getPersonInput(checkbox.value);

    if (input) {
        input.disabled = false;
    }
});

// ========================================
// AUTOMATIC SPLIT
// ========================================

function redistributeAmount() {
    const total = Number(totalAmount.value) || 0;

    const selectedPeople = Array.from(checkboxes).filter(
        function (checkbox) {
            return checkbox.checked;
        }
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
    const peopleCount = selectedPeople.length;

    const baseAmount = Math.floor(totalInPaise / peopleCount);
    const remainder = totalInPaise % peopleCount;

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
// CALCULATE AMOUNTS
// ========================================

function calculateAmounts() {
    const total = Number(totalAmount.value) || 0;

    let givenInPaise = 0;

    amountInputs.forEach(function (input) {
        if (!input.disabled) {
            const amount = Number(input.value) || 0;
            givenInPaise += Math.round(amount * 100);
        }
    });

    const totalInPaise = Math.round(total * 100);
    const differenceInPaise = totalInPaise - givenInPaise;

    if (displayTotal) {
        displayTotal.textContent = formatCurrency(total);
    }

    if (displayGiven) {
        displayGiven.textContent = formatCurrency(
            givenInPaise / 100
        );
    }

    if (displayDifference) {
        displayDifference.textContent = formatCurrency(
            Math.abs(differenceInPaise) / 100
        );
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
            "⚠ " +
                formatCurrency(differenceInPaise / 100) +
                " is still remaining.",
            "warning"
        );

        return false;
    }

    displayFormMessage(
        "⚠ Given amount exceeds the total by " +
            formatCurrency(Math.abs(differenceInPaise) / 100) +
            ".",
        "error"
    );

    return false;
}

// ========================================
// LOAD EXPENSE FOR EDIT
// ========================================

async function loadExpenseForEdit() {
    if (!isEditMode) return;

    const token = getToken();

    if (!token) {
        await showMessageBox(
            "Please log in again.",
            "error",
            "Session Expired"
        );

        window.location.href = "../index.html";
        return;
    }

    let expense;

    try {
        const response = await fetch(`${API_URL}/api/expenses`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || "Unable to load expenses."
            );
        }

        const expenses = Array.isArray(data)
            ? data
            : data.expenses || [];

        expense = expenses.find(function (item) {
            return String(item.id) === String(editExpenseId);
        });
    } catch (error) {
        await showMessageBox(
            error.message || "Unable to connect to the server.",
            "error",
            "Load Failed"
        );

        return;
    }

    if (!expense) {
        await showMessageBox(
            "The selected expense could not be found.",
            "error",
            "Expense Not Found"
        );

        window.location.href = "all-expenses.html";
        return;
    }

    // Fill basic information.
    document.getElementById("category").value =
        expense.category || "";

    document.getElementById("expenseDate").value =
        expense.date || "";

    document.getElementById("expenseName").value =
        expense.name || "";

    document.getElementById("totalAmount").value =
        Number(expense.totalAmount || 0).toFixed(2);

    document.getElementById("spentBy").value =
        expense.spentBy || "";

    document.getElementById("details").value =
        expense.details || "";

    // API returns "splits". Also support older "split" data.
    const splitAmounts = expense.splits || expense.split || {};

    checkboxes.forEach(function (checkbox) {
        const person = checkbox.value;
        const input = getPersonInput(person);
        const amount = Number(splitAmounts[person] || 0);

        if (amount > 0) {
            checkbox.checked = true;

            if (input) {
                input.disabled = false;
                input.value = amount.toFixed(2);
            }
        } else {
            checkbox.checked = false;

            if (input) {
                input.disabled = true;
                input.value = "0.00";
            }
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
// PERSON CHECKBOX CHANGE
// ========================================

checkboxes.forEach(function (checkbox) {
    checkbox.addEventListener("change", function () {
        const input = getPersonInput(this.value);

        if (input) {
            input.disabled = !this.checked;

            if (!this.checked) {
                input.value = "0.00";
            }
        }

        redistributeAmount();
        updateToggleButton();
    });
});

// ========================================
// AMOUNT INPUT CHANGE
// ========================================

amountInputs.forEach(function (input) {
    input.addEventListener("input", calculateAmounts);
});

// ========================================
// TOTAL AMOUNT CHANGE
// ========================================

if (totalAmount) {
    totalAmount.addEventListener("input", function () {
        redistributeAmount();
    });
}

// ========================================
// SELECT / UNSELECT ALL
// ========================================

function toggleAllPeople() {
    const allSelected = Array.from(checkboxes).every(
        function (checkbox) {
            return checkbox.checked;
        }
    );

    checkboxes.forEach(function (checkbox) {
        const input = getPersonInput(checkbox.value);

        checkbox.checked = !allSelected;

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

// Keep compatibility with HTML using onclick="toggleAllPeople()".
window.toggleAllPeople = toggleAllPeople;

// ========================================
// UPDATE SELECT BUTTON TEXT
// ========================================

function updateToggleButton() {
    if (!togglePeopleBtn) return;

    const allSelected = Array.from(checkboxes).every(
        function (checkbox) {
            return checkbox.checked;
        }
    );

    togglePeopleBtn.textContent = allSelected
        ? "Unselect All"
        : "Select All";
}

// ========================================
// SAVE / UPDATE EXPENSE THROUGH API
// ========================================

if (expenseForm) {
    expenseForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const token = getToken();

        if (!token) {
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

        amountInputs.forEach(function (input) {
            if (!input.disabled) {
                const amount = Number(input.value);

                if (!Number.isFinite(amount) || amount < 0) {
                    return;
                }

                givenInPaise += Math.round(amount * 100);
                split[input.dataset.person] = Number(amount.toFixed(2));
            }
        });

        const totalInPaise = Math.round(total * 100);

        if (Object.keys(split).length === 0) {
            displayFormMessage(
                "Please select at least one person.",
                "error"
            );
            return;
        }

        if (givenInPaise !== totalInPaise) {
            displayFormMessage(
                "Please make sure Total Given equals Total Expense.",
                "error"
            );
            return;
        }

        const category = document.getElementById("category").value;
        const name = document.getElementById("expenseName").value.trim();
        const date = document.getElementById("expenseDate").value;
        const spentBy = document.getElementById("spentBy").value;
        const details = document.getElementById("details").value.trim();

        if (!category || !name || !date || !spentBy) {
            displayFormMessage(
                "Please complete all required fields.",
                "error"
            );
            return;
        }

        // Match the Cloudflare Worker API format.
        const apiExpense = {
            category: category,
            name: name,
            date: date,
            totalAmount: total,
            spentBy: spentBy,
            details: details,
            splits: split
        };

        const url = isEditMode
            ? `${API_URL}/api/expenses/${encodeURIComponent(editExpenseId)}`
            : `${API_URL}/api/expenses`;

        try {
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = isEditMode
                    ? "Updating..."
                    : "Saving...";
            }

            const response = await fetch(url, {
                method: isEditMode ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(apiExpense)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Unable to save the expense."
                );
            }

            if (isEditMode) {
                localStorage.removeItem("editExpenseId");

                await showMessageBox(
                    "Expense updated successfully!",
                    "success",
                    "Expense Updated"
                );
            } else {
                await showMessageBox(
                    "Expense saved successfully!",
                    "success",
                    "Expense Saved"
                );
            }

            window.location.href = "admin-dashboard.html";
        } catch (error) {
            await showMessageBox(
                error.message || "Unable to connect to the server.",
                "error",
                "Save Failed"
            );
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = isEditMode
                    ? "💾 Update Expense"
                    : "Save Expense";
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
// INITIAL LOAD
// ========================================

if (isEditMode) {
    loadExpenseForEdit();
} else {
    updateToggleButton();
    redistributeAmount();
}