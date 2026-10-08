// ========================================
// PERSONAL EXPENSES
// ========================================


// ========================================
// LOGIN CHECK
// ========================================

const username =
    localStorage.getItem("loggedInUser");

const role =
    localStorage.getItem("userRole");

const personName =
    localStorage.getItem("personName");


if (!username || role !== "person") {

    window.location.href =
        "../index.html";

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
// DISPLAY NAME
// ========================================

document.getElementById(
    "personName"
).textContent =
    personName ||
    people[username] ||
    username;


// ========================================
// LOAD EXPENSES
// ========================================

const expenses =
    JSON.parse(
        localStorage.getItem("expenses") || "[]"
    );


// ========================================
// PERSONAL EXPENSES
// ========================================

const myExpenses = [];


let mySpent = 0;

let myGiven = 0;


expenses.forEach(
    function (expense) {


        let myAmount = 0;


        // Amount given by this person

        if (
            expense.split &&
            expense.split[username] !== undefined
        ) {

            myAmount =
                Number(
                    expense.split[username]
                ) || 0;

        }


        // Amount actually spent

        if (
            expense.spentBy === username
        ) {

            mySpent +=
                Number(
                    expense.totalAmount
                ) || 0;

        }


        // Add if person participated

        if (
            myAmount > 0 ||
            expense.spentBy === username
        ) {

            myGiven += myAmount;


            myExpenses.push({

                ...expense,

                myGiven:
                    myAmount

            });

        }

    }
);


// ========================================
// SUMMARY
// ========================================

document.getElementById(
    "mySpent"
).textContent =
    formatCurrency(mySpent);


document.getElementById(
    "myGiven"
).textContent =
    formatCurrency(myGiven);


document.getElementById(
    "myExpenseCount"
).textContent =
    myExpenses.length;


document.getElementById(
    "transactionStatus"
).textContent =

    myExpenses.length === 1

        ? "1 transaction"

        : `${myExpenses.length} transactions`;


// ========================================
// DISPLAY EXPENSES
// ========================================

const expenseList =
    document.getElementById(
        "expenseList"
    );


if (myExpenses.length === 0) {


    expenseList.innerHTML = `

        <div class="empty-state">

            <div>
                🧾
            </div>

            <h3>
                No personal expenses yet
            </h3>

            <p>
                Expenses in which you participate
                will appear here.
            </p>

        </div>

    `;


} else {


    myExpenses
        .slice()
        .sort(
            function (a, b) {

                return (
                    new Date(b.date) -
                    new Date(a.date)
                );

            }
        )
        .forEach(
            function (expense) {

                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "expense-card";


                const spentBy =
                    people[
                        expense.spentBy
                    ] ||
                    expense.spentBy ||
                    "-";


                const spentByMe =
                    expense.spentBy ===
                    username;


                card.innerHTML = `

                    <div class="expense-top">


                        <div class="expense-title">

                            <div class="expense-icon">

                                ${getCategoryIcon(
                                    expense.category
                                )}

                            </div>


                            <div>

                                <h3>

                                    ${escapeHTML(
                                        expense.name
                                    )}

                                </h3>


                                <p>

                                    ${escapeHTML(
                                        expense.category
                                    )}

                                    •

                                    ${formatDate(
                                        expense.date
                                    )}

                                </p>

                            </div>

                        </div>


                        <div class="expense-total">

                            <span>
                                Total Expense
                            </span>

                            <strong>

                                ${formatCurrency(
                                    expense.totalAmount
                                )}

                            </strong>

                        </div>


                    </div>



                    <div class="expense-details">


                        <div class="detail-box">

                            <span>
                                Spent By
                            </span>

                            <strong>

                                ${escapeHTML(
                                    spentBy
                                )}

                                ${
                                    spentByMe
                                        ? " (You)"
                                        : ""
                                }

                            </strong>

                        </div>


                        <div class="detail-box">

                            <span>
                                My Given
                            </span>

                            <strong>

                                ${formatCurrency(
                                    expense.myGiven
                                )}

                            </strong>

                        </div>


                        <div class="detail-box">

                            <span>
                                Date
                            </span>

                            <strong>

                                ${formatDate(
                                    expense.date
                                )}

                            </strong>

                        </div>


                    </div>


                    ${
                        expense.details
                            ? `

                        <div class="additional-details">

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


                    <div class="expense-actions">

                        <a
                            class="request-btn"
                            href="request-change.html?expense=${encodeURIComponent(
                                expense.id
                            )}"
                        >

                            📝 Request a Change

                        </a>

                    </div>

                `;


                expenseList.appendChild(
                    card
                );

            }
        );

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


    return (
        icons[category] ||
        "🧾"
    );

}


// ========================================
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
// DATE
// ========================================

function formatDate(date) {

    if (!date) {

        return "-";

    }


    const parts =
        date.split("-");


    if (parts.length !== 3) {

        return date;

    }


    return (
        `${parts[2]}-${parts[1]}-${parts[0]}`
    );

}


// ========================================
// ESCAPE HTML
// ========================================

function escapeHTML(value) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        value ?? "";

    return div.innerHTML;

}

// ========================================
// BACK BUTTON
// ========================================

const backBtn =
    document.getElementById("backBtn");

if (backBtn) {

    backBtn.addEventListener(
        "click",
        function () {

            window.location.href =
                "person-dashboard.html";

        }
    );

}


// ========================================
// LOGOUT
// ========================================

function logout() {

    localStorage.removeItem(
        "loggedInUser"
    );

    localStorage.removeItem(
        "userRole"
    );

    localStorage.removeItem(
        "personName"
    );


    window.location.href =
        "../index.html";

}