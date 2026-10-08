// ========================================
// ALL EXPENSES PAGE
// ========================================


// ----------------------------------------
// LOGIN / ROLE
// ----------------------------------------

const username =
    localStorage.getItem("loggedInUser");

const role =
    localStorage.getItem("userRole");


// ----------------------------------------
// AUTH CHECK
// ----------------------------------------

if (!username || !role) {

    window.location.href = "../index.html";

}


// ----------------------------------------
// ELEMENTS
// ----------------------------------------

const searchInput =
    document.getElementById("searchInput");

const categoryFilter =
    document.getElementById("categoryFilter");

const dateFilter =
    document.getElementById("dateFilter");

const clearFilters =
    document.getElementById("clearFilters");

const expensesContainer =
    document.getElementById("expensesContainer");

const expenseCount =
    document.getElementById("expenseCount");

const totalAmount =
    document.getElementById("totalAmount");

const yourGiven =
    document.getElementById("yourGiven");

const backBtn =
    document.getElementById("backBtn");


// ----------------------------------------
// PEOPLE
// ----------------------------------------

const people = {

    vetri: "Vetrivel",

    nitheen: "Nitheen",

    yash: "Yaswanth",

    dharshu: "Dharshini",

    mano: "ManojKumar"

};


// ----------------------------------------
// LOAD EXPENSES
// ----------------------------------------

let expenses =
    JSON.parse(
        localStorage.getItem("expenses") || "[]"
    );


// ----------------------------------------
// BACK BUTTON
// ----------------------------------------

if (role === "admin") {

    backBtn.href =
        "admin-dashboard.html";

} else {

    backBtn.href =
        "person-dashboard.html";

}


// ----------------------------------------
// EVENT LISTENERS
// ----------------------------------------

searchInput.addEventListener(
    "input",
    renderExpenses
);

categoryFilter.addEventListener(
    "change",
    renderExpenses
);

dateFilter.addEventListener(
    "change",
    renderExpenses
);


clearFilters.addEventListener(
    "click",
    function () {

        searchInput.value = "";

        categoryFilter.value = "all";

        dateFilter.value = "";

        renderExpenses();

    }
);


// ----------------------------------------
// RENDER
// ----------------------------------------

function renderExpenses() {

    const search =
        searchInput.value
            .trim()
            .toLowerCase();

    const category =
        categoryFilter.value;

    const date =
        dateFilter.value;


    const filteredExpenses =
        expenses.filter(function (expense) {

            const matchesSearch =
                !search ||
                expense.name
                    .toLowerCase()
                    .includes(search);


            const matchesCategory =
                category === "all" ||
                expense.category === category;


            const matchesDate =
                !date ||
                expense.date === date;


            return (
                matchesSearch &&
                matchesCategory &&
                matchesDate
            );

        });


    updateSummary(filteredExpenses);

    displayExpenses(filteredExpenses);

}


// ----------------------------------------
// SUMMARY
// ----------------------------------------

function updateSummary(filteredExpenses) {

    expenseCount.textContent =
        filteredExpenses.length;


    let total = 0;

    let given = 0;


    filteredExpenses.forEach(
        function (expense) {

            total +=
                Number(expense.totalAmount) || 0;


            if (
                expense.split &&
                expense.split[username]
            ) {

                given +=
                    Number(
                        expense.split[username]
                    ) || 0;

            }

        }
    );


    totalAmount.textContent =
        formatCurrency(total);


    yourGiven.textContent =
        formatCurrency(given);

}


// ----------------------------------------
// DISPLAY EXPENSES
// ----------------------------------------

function displayExpenses(
    filteredExpenses
) {

    expensesContainer.innerHTML = "";


    if (filteredExpenses.length === 0) {

        expensesContainer.innerHTML = `

            <div class="empty-state">

                <h3>No expenses found</h3>

                <p>
                    There are no expenses matching
                    your current filters.
                </p>

            </div>

        `;

        return;

    }


    // Newest first

    const sortedExpenses =
        [...filteredExpenses].sort(
            function (a, b) {

                return (
                    new Date(b.date) -
                    new Date(a.date)
                );

            }
        );


    sortedExpenses.forEach(
        function (expense) {

            expensesContainer.appendChild(
                createExpenseCard(expense)
            );

        }
    );

}


// ----------------------------------------
// CREATE EXPENSE CARD
// ----------------------------------------

function createExpenseCard(expense) {

    const card =
        document.createElement("div");

    card.className =
        "expense-card";


    const spentByName =
        people[expense.spentBy] ||
        expense.spentBy ||
        "Unknown";


    const splitHTML =
        createSplitHTML(expense);


    let actionsHTML = "";


    // ------------------------------------
    // ADMIN ACTIONS
    // ------------------------------------

    if (role === "admin") {

        actionsHTML = `

            <div class="expense-actions">

                <button
                    type="button"
                    class="action-btn edit-btn"
                    onclick="editExpense(${expense.id})"
                >
                    ✏️ Edit
                </button>


                <button
                    type="button"
                    class="action-btn delete-btn"
                    onclick="deleteExpense(${expense.id})"
                >
                    🗑️ Delete
                </button>

            </div>

        `;

    }


    // ------------------------------------
    // PERSON ACTION
    // ------------------------------------

    else {

        actionsHTML = `

            <div class="expense-actions">

                <button
                    type="button"
                    class="action-btn request-btn"
                    onclick="requestChange(${expense.id})"
                >
                    📝 Request a Change
                </button>

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

                ${formatCurrency(
                    expense.totalAmount
                )}

            </div>

        </div>


        <div class="expense-info">

            <div class="info-box">

                <span class="info-label">
                    Date
                </span>

                <span class="info-value">
                    ${formatDate(expense.date)}
                </span>

            </div>


            <div class="info-box">

                <span class="info-label">
                    Spent By
                </span>

                <span class="info-value">
                    ${escapeHTML(spentByName)}
                </span>

            </div>


            <div class="info-box">

                <span class="info-label">
                    Total
                </span>

                <span class="info-value">
                    ${formatCurrency(
                        expense.totalAmount
                    )}
                </span>

            </div>

        </div>


        <div class="split-section">

            <div class="split-title">
                Amount Given
            </div>

            <div class="split-list">

                ${splitHTML}

            </div>

        </div>


        ${
            expense.details
                ? `
                    <div class="expense-details">

                        <strong>
                            Details:
                        </strong>

                        ${escapeHTML(
                            expense.details
                        )}

                    </div>
                  `
                : ""
        }


        ${actionsHTML}

    `;


    return card;

}


// ----------------------------------------
// SPLIT HTML
// ----------------------------------------

function createSplitHTML(expense) {

    let html = "";


    Object.keys(people).forEach(
        function (person) {

            const amount =
                expense.split &&
                expense.split[person]
                    ? Number(
                        expense.split[person]
                    )
                    : 0;


            html += `

                <div class="split-person">

                    <span class="split-person-name">

                        ${people[person]}

                    </span>

                    <span class="split-person-amount">

                        ${formatCurrency(amount)}

                    </span>

                </div>

            `;

        }
    );


    return html;

}


// ----------------------------------------
// ADMIN - EDIT
// ----------------------------------------

function editExpense(id) {

    localStorage.setItem(
        "editExpenseId",
        id
    );


    window.location.href =
        "add-expense.html?edit=" + id;

}


// ----------------------------------------
// ADMIN - DELETE
// ----------------------------------------

async function deleteExpense(id) {

    const expense =
        expenses.find(
            function (item) {

                return item.id === id;

            }
        );


    if (!expense) {

        return;

    }


    const confirmed = await showConfirm(
    `Delete "${expense.name}"?`,
    "Delete Expense",
    "Delete",
    "Cancel"
);

if (!confirmed) {
    return;
}


    expenses =
        expenses.filter(
            function (item) {

                return item.id !== id;

            }
        );


    localStorage.setItem(
        "expenses",
        JSON.stringify(expenses)
    );


    renderExpenses();

}


// ----------------------------------------
// PERSON - REQUEST CHANGE
// ----------------------------------------

function requestChange(id) {

    window.location.href =
        "request-change.html?expense=" + encodeURIComponent(id);

}


// ----------------------------------------
// FORMAT CURRENCY
// ----------------------------------------

function formatCurrency(amount) {

    return Number(amount || 0)
        .toLocaleString(
            "en-IN",
            {
                style: "currency",
                currency: "INR",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );

}


// ----------------------------------------
// FORMAT DATE
// ----------------------------------------

function formatDate(date) {

    if (!date) {

        return "-";

    }


    const parts =
        date.split("-");


    if (parts.length !== 3) {

        return date;

    }


    return `${parts[2]}-${parts[1]}-${parts[0]}`;

}


// ----------------------------------------
// ESCAPE HTML
// ----------------------------------------

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value ?? "";

    return div.innerHTML;

}


// ----------------------------------------
// INITIAL LOAD
// ----------------------------------------

renderExpenses();