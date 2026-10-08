// ========================================
// FINAL BILL
// ========================================


// ----------------------------------------
// LOGIN
// ----------------------------------------

const username =
    localStorage.getItem("loggedInUser");

const role =
    localStorage.getItem("userRole");


if (!username || !role) {

    window.location.href =
        "../index.html";

}


// ----------------------------------------
// ELEMENTS
// ----------------------------------------

const totalExpenses =
    document.getElementById(
        "totalExpenses"
    );

const grandTotal =
    document.getElementById(
        "grandTotal"
    );

const totalPeople =
    document.getElementById(
        "totalPeople"
    );

const personSummary =
    document.getElementById(
        "personSummary"
    );

const expenseTableBody =
    document.getElementById(
        "expenseTableBody"
    );

const backBtn =
    document.getElementById(
        "backBtn"
    );


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

const expenses =
    JSON.parse(
        localStorage.getItem(
            "expenses"
        ) || "[]"
    );


// ----------------------------------------
// BACK BUTTON
// ----------------------------------------

if (role === "admin") {

    backBtn.onclick =
        function () {

            window.location.href =
                "admin-dashboard.html";

        };

} else {

    backBtn.onclick =
        function () {

            window.location.href =
                "person-dashboard.html";

        };

}


// ----------------------------------------
// SUMMARY
// ----------------------------------------

function calculateSummary() {

    let total = 0;


    expenses.forEach(
        function (expense) {

            total +=
                Number(
                    expense.totalAmount
                ) || 0;

        }
    );


    totalExpenses.textContent =
        expenses.length;


    grandTotal.textContent =
        formatCurrency(total);


    totalPeople.textContent =
        Object.keys(people).length;

}


// ----------------------------------------
// PERSON SUMMARY
// ----------------------------------------

function createPersonSummary() {

    personSummary.innerHTML = "";


    Object.keys(people).forEach(
        function (person) {

            let spent = 0;

            let given = 0;


            expenses.forEach(
                function (expense) {

                    // Amount actually paid
                    if (
                        expense.spentBy ===
                        person
                    ) {

                        spent +=
                            Number(
                                expense.totalAmount
                            ) || 0;

                    }


                    // Amount contributed
                    if (
                        expense.split &&
                        expense.split[person]
                    ) {

                        given +=
                            Number(
                                expense.split[person]
                            ) || 0;

                    }

                }
            );


            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "person-bill-card";


            card.innerHTML = `

                <div class="person-bill-name">

                    ${escapeHTML(
                        people[person]
                    )}

                </div>


                <div class="person-stat">

                    <span class="person-stat-label">
                        Spent
                    </span>

                    <span class="person-stat-value">
                        ${formatCurrency(spent)}
                    </span>

                </div>


                <div class="person-stat">

                    <span class="person-stat-label">
                        Given
                    </span>

                    <span class="person-stat-value">
                        ${formatCurrency(given)}
                    </span>

                </div>

            `;


            personSummary.appendChild(
                card
            );

        }
    );

}


// ----------------------------------------
// EXPENSE TABLE
// ----------------------------------------

function createExpenseTable() {

    expenseTableBody.innerHTML = "";


    if (expenses.length === 0) {

        expenseTableBody.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    style="text-align:center; padding:40px;"
                >

                    No expenses recorded yet.

                </td>

            </tr>

        `;

        return;

    }


    const sortedExpenses =
        [...expenses].sort(
            function (a, b) {

                return (
                    new Date(b.date) -
                    new Date(a.date)
                );

            }
        );


    sortedExpenses.forEach(
        function (expense) {

            const row =
                document.createElement(
                    "tr"
                );


            const spentBy =
                people[expense.spentBy] ||
                expense.spentBy ||
                "-";


            let splitHTML = "";


            Object.keys(people).forEach(
                function (person) {

                    const amount =
                        expense.split &&
                        expense.split[person]
                            ? Number(
                                expense.split[person]
                            )
                            : 0;


                    if (amount > 0) {

                        splitHTML += `

                            <div class="split-item">

                                <span>
                                    ${escapeHTML(
                                        people[person]
                                    )}
                                </span>

                                <strong>
                                    ${formatCurrency(
                                        amount
                                    )}
                                </strong>

                            </div>

                        `;

                    }

                }
            );


            row.innerHTML = `

                <td>
                    ${formatDate(
                        expense.date
                    )}
                </td>


                <td>

                    <div class="expense-name">
                        ${escapeHTML(
                            expense.name
                        )}
                    </div>

                    <div class="expense-category">
                        ${escapeHTML(
                            expense.category
                        )}
                    </div>

                </td>


                <td>
                    ${escapeHTML(spentBy)}
                </td>


                <td>
                    <strong>
                        ${formatCurrency(
                            expense.totalAmount
                        )}
                    </strong>
                </td>


                <td>

                    <div class="split-list">

                        ${
                            splitHTML ||
                            "-"
                        }

                    </div>

                </td>

            `;


            expenseTableBody.appendChild(
                row
            );

        }
    );

}


// ----------------------------------------
// CURRENCY
// ----------------------------------------

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


// ----------------------------------------
// DATE
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

calculateSummary();

createPersonSummary();

createExpenseTable();