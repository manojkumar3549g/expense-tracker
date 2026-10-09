// ========================================
// ADD / EDIT EXPENSE
// ========================================


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

const totalAmount =
    document.getElementById("totalAmount");

const displayTotal =
    document.getElementById("displayTotal");

const displayGiven =
    document.getElementById("displayGiven");

const displayDifference =
    document.getElementById("displayDifference");

const amountMessage =
    document.getElementById("amountMessage");

const expenseForm =
    document.getElementById("expenseForm");

const togglePeopleBtn =
    document.getElementById("togglePeopleBtn");

const checkboxes =
    document.querySelectorAll(".person-checkbox");

const amountInputs =
    document.querySelectorAll(".given-amount");


// ========================================
// EDIT MODE
// ========================================

// Get ID from:
// add-expense.html?edit=123456

const urlParams =
    new URLSearchParams(window.location.search);

let editExpenseId =
    urlParams.get("edit");

// Also support old localStorage edit ID

if (!editExpenseId) {

    editExpenseId =
        localStorage.getItem("editExpenseId");

}

const isEditMode =
    !!editExpenseId;


// ========================================
// PAGE ELEMENTS
// ========================================

const pageTitle =
    document.querySelector("h1");

const pageDescription =
    document.querySelector(".welcome-section p");

const submitButton =
    expenseForm
        ? expenseForm.querySelector(
            'button[type="submit"]'
        )
        : null;


// ========================================
// INITIAL PEOPLE STATE
// ========================================

checkboxes.forEach(function (checkbox) {

    checkbox.checked = true;

    const input =
        document.querySelector(
            `.given-amount[data-person="${checkbox.value}"]`
        );

    if (input) {
        input.disabled = false;
    }

});


// ========================================
// AUTOMATIC SPLIT
// ========================================

function redistributeAmount() {

    const total =
        Number(totalAmount.value) || 0;

    const selectedPeople =
        Array.from(checkboxes).filter(
            function (checkbox) {
                return checkbox.checked;
            }
        );


    // No people selected

    if (selectedPeople.length === 0) {

        amountInputs.forEach(function (input) {

            input.value = "0.00";

        });

        calculateAmounts();

        return;
    }


    // Total is zero

    if (total <= 0) {

        selectedPeople.forEach(
            function (checkbox) {

                const input =
                    document.querySelector(
                        `.given-amount[data-person="${checkbox.value}"]`
                    );

                if (input) {
                    input.value = "0.00";
                }

            }
        );

        calculateAmounts();

        return;
    }


    // Convert to paise

    const totalInPaise =
        Math.round(total * 100);

    const numberOfPeople =
        selectedPeople.length;

    const baseAmount =
        Math.floor(
            totalInPaise / numberOfPeople
        );

    const remainder =
        totalInPaise % numberOfPeople;


    selectedPeople.forEach(
        function (checkbox, index) {

            const input =
                document.querySelector(
                    `.given-amount[data-person="${checkbox.value}"]`
                );

            if (!input) {
                return;
            }

            let amountInPaise =
                baseAmount;

            if (index < remainder) {
                amountInPaise += 1;
            }

            input.value =
                (amountInPaise / 100).toFixed(2);

        }
    );


    // Unselected = zero

    checkboxes.forEach(
        function (checkbox) {

            if (!checkbox.checked) {

                const input =
                    document.querySelector(
                        `.given-amount[data-person="${checkbox.value}"]`
                    );

                if (input) {
                    input.value = "0.00";
                }

            }

        }
    );


    calculateAmounts();
}


// ========================================
// CALCULATE AMOUNTS
// ========================================

function calculateAmounts() {

    const total =
        Number(totalAmount.value) || 0;

    let givenInPaise = 0;


    amountInputs.forEach(
        function (input) {

            if (!input.disabled) {

                const amount =
                    Number(input.value) || 0;

                givenInPaise +=
                    Math.round(amount * 100);

            }

        }
    );


    const totalInPaise =
        Math.round(total * 100);

    const differenceInPaise =
        totalInPaise -
        givenInPaise;


    const given =
        givenInPaise / 100;

    const difference =
        differenceInPaise / 100;


    displayTotal.textContent =
        formatCurrency(total);

    displayGiven.textContent =
        formatCurrency(given);

    displayDifference.textContent =
        formatCurrency(
            Math.abs(difference)
        );


    if (totalInPaise === 0) {

        amountMessage.textContent = "";

        amountMessage.className =
            "form-message";

        return false;
    }


    if (differenceInPaise === 0) {

        amountMessage.textContent =
            "✓ Amounts are correct.";

        amountMessage.className =
            "form-message success";

        return true;
    }


    if (differenceInPaise > 0) {

        amountMessage.textContent =
            "⚠ " +
            formatCurrency(difference) +
            " is still remaining.";

        amountMessage.className =
            "form-message warning";

        return false;
    }


    amountMessage.textContent =
        "⚠ Given amount exceeds the total by " +
        formatCurrency(
            Math.abs(difference)
        ) +
        ".";

    amountMessage.className =
        "form-message error";

    return false;
}


// ========================================
// LOAD EXPENSE FOR EDIT
// ========================================

async function loadExpenseForEdit() {

    if (!isEditMode) {
        return;
    }


    
    const API_URL =
        "https://expense-tracker-api.manojkumar3549g.workers.dev";

    const token = localStorage.getItem("authToken");

    let expense = null;

    try {
        const response = await fetch(
            `${API_URL}/api/expenses`,
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

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
        await showAlert(
            error.message || "Unable to connect to the server.",
            "error",
            "Load Failed"
        );
        return;
    }



    // Expense not found

if (!expense) {

    await showAlert(
        "The selected expense could not be found.",
        "error",
        "Expense Not Found"
    );

    window.location.href =
        "all-expenses.html";

    return;
}

    // ========================================
    // FILL BASIC INFORMATION
    // ========================================

    document.getElementById(
        "category"
    ).value =
        expense.category || "";


    document.getElementById(
        "expenseDate"
    ).value =
        expense.date || "";


    document.getElementById(
        "expenseName"
    ).value =
        expense.name || "";


    document.getElementById(
        "totalAmount"
    ).value =
        Number(
            expense.totalAmount || 0
        ).toFixed(2);


    document.getElementById(
        "spentBy"
    ).value =
        expense.spentBy || "";


    document.getElementById(
        "details"
    ).value =
        expense.details || "";


    
    // ========================================
    // FILL SPLIT
    // ========================================

    const splitAmounts = expense.splits || expense.split || {};

    checkboxes.forEach(function (checkbox) {
        const person = checkbox.value;

        const input = document.querySelector(
            `.given-amount[data-person="${person}"]`
        );

        const amount = splitAmounts[person] !== undefined
            ? Number(splitAmounts[person])
            : 0;

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



    // ========================================
    // UPDATE PAGE TITLE
    // ========================================

    if (pageTitle) {

        pageTitle.textContent =
            "✏️ Edit Expense";

    }


    if (pageDescription) {

        pageDescription.textContent =
            "Update the expense information and amount given by each person.";

    }


    if (submitButton) {

        submitButton.textContent =
            "💾 Update Expense";

    }


    // ========================================
    // UPDATE BUTTON
    // ========================================

    updateToggleButton();

    calculateAmounts();
}


// ========================================
// CHECKBOX CHANGE
// ========================================

checkboxes.forEach(
    function (checkbox) {

        checkbox.addEventListener(
            "change",
            function () {

                const input =
                    document.querySelector(
                        `.given-amount[data-person="${this.value}"]`
                    );


                if (this.checked) {

                    if (input) {
                        input.disabled = false;
                    }

                } else {

                    if (input) {

                        input.disabled = true;

                        input.value = "0.00";

                    }

                }


                // IMPORTANT:
                // In Edit mode, don't automatically
                // destroy the existing split.

                redistributeAmount();


                updateToggleButton();

            }
        );

    }
);


// ========================================
// AMOUNT INPUT
// ========================================

amountInputs.forEach(
    function (input) {

        input.addEventListener(
            "input",
            calculateAmounts
        );

    }
);


// ========================================
// TOTAL AMOUNT
// ========================================

// ========================================
// TOTAL AMOUNT CHANGE
// ========================================

totalAmount.addEventListener(
    "input",
    function () {

        // Whenever Total Amount changes,
        // redistribute among selected people.
        //
        // This works for BOTH:
        // Add Expense and Edit Expense.

        redistributeAmount();

    }
);

// ========================================
// SELECT / UNSELECT ALL
// ========================================

function toggleAllPeople() {

    const allSelected =
        Array.from(checkboxes).every(
            function (checkbox) {
                return checkbox.checked;
            }
        );


    if (allSelected) {

        // ================================
        // UNSELECT ALL
        // ================================

        checkboxes.forEach(
            function (checkbox) {

                checkbox.checked = false;

                const input =
                    document.querySelector(
                        `.given-amount[data-person="${checkbox.value}"]`
                    );

                if (input) {

                    input.disabled = true;

                    input.value = "0.00";

                }

            }
        );


    } else {

        // ================================
        // SELECT ALL
        // ================================

        checkboxes.forEach(
            function (checkbox) {

                checkbox.checked = true;

                const input =
                    document.querySelector(
                        `.given-amount[data-person="${checkbox.value}"]`
                    );

                if (input) {
                    input.disabled = false;
                }

            }
        );

    }


    // ====================================
    // REDISTRIBUTE FOR BOTH ADD & EDIT
    // ====================================

    redistributeAmount();


    // ====================================
    // UPDATE BUTTON
    // ====================================

    updateToggleButton();

}
// ========================================
// UPDATE SELECT BUTTON TEXT
// ========================================

function updateToggleButton() {

    const allSelected =
        Array.from(checkboxes).every(
            function (checkbox) {
                return checkbox.checked;
            }
        );


    togglePeopleBtn.textContent =
        allSelected
            ? "Unselect All"
            : "Select All";
}


// ========================================
// SAVE / UPDATE EXPENSE
// ========================================

expenseForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const total =
            Number(totalAmount.value) || 0;


        let givenInPaise = 0;

        const split = {};


        // Collect split

        amountInputs.forEach(
            function (input) {

                if (!input.disabled) {

                    const amount =
                        Number(input.value) || 0;


                    givenInPaise +=
                        Math.round(
                            amount * 100
                        );


                    split[
                        input.dataset.person
                    ] = amount;

                }

            }
        );


        const totalInPaise =
            Math.round(total * 100);


        // ========================================
        // VALIDATE TOTAL
        // ========================================

        if (
            totalInPaise !==
            givenInPaise
        ) {

            amountMessage.textContent =
                "Please make sure Total Given equals Total Expense.";

            amountMessage.className =
                "form-message error";

            return;
        }


        // ========================================
        // VALIDATE PERSON
        // ========================================

        if (
            Object.keys(split).length === 0
        ) {

            amountMessage.textContent =
                "Please select at least one person.";

            amountMessage.className =
                "form-message error";

            return;
        }


        // ========================================
        // GET EXPENSE DATA
        // ========================================

        const expenses =
            JSON.parse(
                localStorage.getItem(
                    "expenses"
                ) || "[]"
            );


        const expenseData = {

            id:
                isEditMode
                    ? Number(editExpenseId)
                    : Date.now(),

            category:
                document.getElementById(
                    "category"
                ).value,

            name:
                document.getElementById(
                    "expenseName"
                ).value.trim(),

            date:
                document.getElementById(
                    "expenseDate"
                ).value,

            totalAmount:
                total,

            spentBy:
                document.getElementById(
                    "spentBy"
                ).value,

            details:
                document.getElementById(
                    "details"
                ).value.trim(),

            split:
                split,

            updatedAt:
                new Date().toISOString()

        };


        // ========================================
        // EDIT EXISTING
        // ========================================

        
        // ========================================
        // SAVE THROUGH CLOUDFLARE API
        // ========================================

        const API_URL =
            "https://expense-tracker-api.manojkumar3549g.workers.dev";

        const token = localStorage.getItem("authToken");

        if (!token) {
            await showAlert(
                "Please log in again.",
                "error",
                "Session Expired"
            );
            window.location.href = "../index.html";
            return;
        }

        // Convert the existing form data to the API format.
        const apiExpense = {
            category: expenseData.category,
            name: expenseData.name,
            date: expenseData.date,
            totalAmount: Number(expenseData.totalAmount),
            spentBy: expenseData.spentBy,
            details: expenseData.details || "",
            splits: expenseData.split || {}
        };

        const url = isEditMode
            ? `${API_URL}/api/expenses/${encodeURIComponent(editExpenseId)}`
            : `${API_URL}/api/expenses`;

        try {
            const response = await fetch(url, {
                method: isEditMode ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(apiExpense)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Unable to save the expense."
                );
            }

            // Clear edit mode after a successful server save.
            if (isEditMode) {
                localStorage.removeItem("editExpenseId");

                await showAlert(
                    "Expense updated successfully!",
                    "success",
                    "Expense Updated"
                );
            } else {
                await showAlert(
                    "Expense saved successfully!",
                    "success",
                    "Expense Saved"
                );
            }

            window.location.href = "admin-dashboard.html";

        } catch (error) {
            await showAlert(
                error.message || "Unable to connect to the server.",
                "error",
                "Save Failed"
            );
        }





       

    }
);


// ========================================
// BACK BUTTON
// ========================================

function goBack() {

    if (isEditMode) {

        window.location.href =
            "all-expenses.html";

    } else {

        window.location.href =
            "admin-dashboard.html";

    }

}


// ========================================
// HEADER BACK BUTTON
// ========================================

const headerBackButton =
    document.getElementById("backBtn");

if (headerBackButton) {

    headerBackButton.addEventListener(
        "click",
        function () {
            goBack();
        }
    );

}


// // ========================================
// CURRENCY
// ========================================

function formatCurrency(amount) {

    return Number(
        amount || 0
    ).toLocaleString(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );
}


// ========================================
// INITIAL LOAD
// ========================================

if (isEditMode) {

    // IMPORTANT:
    // Load existing expense instead of
    // automatically creating a new split.

    loadExpenseForEdit();

} else {

    // Normal Add Expense

    updateToggleButton();

    redistributeAmount();

}