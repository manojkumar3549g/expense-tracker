// ======================================
// PERSON DASHBOARD
// ======================================

// LOGIN CHECK

const username = localStorage.getItem("loggedInUser");
const role = localStorage.getItem("userRole");
const personName = localStorage.getItem("personName");

if (!username || role !== "person") {
    window.location.href = "../index.html";
}


// ======================================
// DISPLAY USER
// ======================================

document.getElementById("personName").textContent =
    personName || getPersonName(username);

document.getElementById("welcomeName").textContent =
    personName || getPersonName(username);


// ======================================
// LOAD EXPENSES
// ======================================

const expenses =
    JSON.parse(localStorage.getItem("expenses") || "[]");


// ======================================
// CALCULATE PERSON DATA
// ======================================

let mySpent = 0;
let myGiven = 0;
let myExpenses = [];

expenses.forEach(function (expense) {

    // Amount actually spent by this person

    if (expense.spentBy === username) {
        mySpent += Number(expense.totalAmount) || 0;
    }

    // Amount given by this person

    if (
        expense.split &&
        expense.split[username] !== undefined
    ) {

        const amount =
            Number(expense.split[username]) || 0;

        myGiven += amount;

        myExpenses.push({
            ...expense,
            myGiven: amount
        });
    }
});


// ======================================
// UPDATE SUMMARY
// ======================================

document.getElementById("mySpent").textContent =
    formatCurrency(mySpent);

document.getElementById("myGiven").textContent =
    formatCurrency(myGiven);

document.getElementById("expenseCount").textContent =
    myExpenses.length;

document.getElementById("transactionStatus").textContent =
    myExpenses.length +
    (
        myExpenses.length === 1
            ? " transaction"
            : " transactions"
    );


// ======================================
// DISPLAY TRANSACTIONS
// ======================================

const transactionList =
    document.getElementById("transactionList");


if (myExpenses.length === 0) {

    transactionList.innerHTML = `
        <div class="empty-state">

            <div>🧾</div>

            <h3>No transactions yet</h3>

            <p>
                Your expenses will appear here.
            </p>

        </div>
    `;

} else {

    myExpenses
        .slice()
        .sort(function (a, b) {

            return new Date(b.date) -
                   new Date(a.date);

        })
        .forEach(function (expense) {

            const spentByMe =
                expense.spentBy === username;


            const card =
                document.createElement("div");

            card.className =
                "transaction-card";


            card.innerHTML = `

                <div class="transaction-main">

                    <div class="transaction-icon">

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


                <div class="transaction-info">

                    <div>

                        <span>
                            Total
                        </span>

                        <strong>
                            ${formatCurrency(
                                expense.totalAmount
                            )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            My Given
                        </span>

                        <strong>
                            ${formatCurrency(
                                expense.myGiven
                            )}
                        </strong>

                    </div>


                    <div>

                        <span>
                            ${
                                spentByMe
                                    ? "I Spent"
                                    : "Spent By"
                            }
                        </span>

                        <strong>

                            ${
                                spentByMe
                                    ? "Yes"
                                    : escapeHTML(
                                        getPersonName(
                                            expense.spentBy
                                        )
                                    )
                            }

                        </strong>

                    </div>

                </div>

            `;


            transactionList.appendChild(card);

        });

}


// ======================================
// GET PERSON NAME
// ======================================

function getPersonName(username) {

    const names = {

        vetri: "Vetrivel",

        nitheen: "Nitheen",

        yash: "Yaswanth",

        dharshu: "Dharshini",

        mano: "ManojKumar"

    };

    return names[username] ||
           username ||
           "User";
}


// ======================================
// CATEGORY ICON
// ======================================

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


// ======================================
// FORMAT CURRENCY
// ======================================

function formatCurrency(amount) {

    return Number(amount || 0)
        .toLocaleString("en-IN", {

            style: "currency",

            currency: "INR",

            minimumFractionDigits: 2,

            maximumFractionDigits: 2

        });
}


// ======================================
// FORMAT DATE
// ======================================

function formatDate(date) {

    if (!date) {
        return "-";
    }

    return new Date(
        date + "T00:00:00"
    ).toLocaleDateString(

        "en-IN",

        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }

    );
}


// ======================================
// ESCAPE HTML
// ======================================

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value ?? "";

    return div.innerHTML;
}


// ======================================
// LOGOUT
// ======================================

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