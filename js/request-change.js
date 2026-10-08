// ========================================
// REQUEST CHANGE
// ========================================


// LOGIN CHECK

const username = localStorage.getItem("loggedInUser");
const role = localStorage.getItem("userRole");
const personName = localStorage.getItem("personName");

if (!username || role !== "person") {
    window.location.href = "../index.html";
}


// ========================================
// ELEMENTS
// ========================================

const personNameElement =
    document.getElementById("personName");

const form =
    document.getElementById("changeRequestForm");

const expenseSelect =
    document.getElementById("expenseSelect");

const fieldSelect =
    document.getElementById("fieldSelect");

const currentValue =
    document.getElementById("currentValue");

const requestedValue =
    document.getElementById("requestedValue");

const reason =
    document.getElementById("reason");

const expenseInfo =
    document.getElementById("expenseInfo");

const expenseName =
    document.getElementById("expenseName");

const expenseTotal =
    document.getElementById("expenseTotal");

const expenseSpentBy =
    document.getElementById("expenseSpentBy");

const message =
    document.getElementById("message");

const backBtn =
    document.getElementById("backBtn");


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
// DISPLAY USER
// ========================================

personNameElement.textContent =
    personName || people[username] || username;


// ========================================
// LOAD EXPENSES
// ========================================

let expenses = JSON.parse(
    localStorage.getItem("expenses") || "[]"
);


// ========================================
// URL PARAMETER
// ========================================

const urlParams =
    new URLSearchParams(window.location.search);

const requestedExpenseId =
    urlParams.get("expense");


// ========================================
// CURRENCY
// ========================================

function formatCurrency(amount) {

    return Number(amount || 0).toLocaleString(
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

    const parts = date.split("-");

    if (parts.length !== 3) {
        return date;
    }

    return `${parts[2]}-${parts[1]}-${parts[0]}`;
}


// ========================================
// LOAD EXPENSE DROPDOWN
// ========================================

function loadExpenses() {

    expenseSelect.innerHTML = `
        <option value="">
            -- Select an Expense --
        </option>
    `;

    if (expenses.length === 0) {

        expenseSelect.innerHTML += `
            <option value="" disabled>
                No expenses available
            </option>
        `;

        return;
    }

    const sortedExpenses =
        [...expenses].sort(function (a, b) {
            return new Date(b.date) - new Date(a.date);
        });

    sortedExpenses.forEach(function (expense) {

        const option =
            document.createElement("option");

        option.value = expense.id;

        option.textContent =
            `${expense.name} - ${formatCurrency(
                expense.totalAmount
            )} - ${formatDate(expense.date)}`;

        expenseSelect.appendChild(option);
    });


    // Open selected expense from All Expenses

    if (requestedExpenseId) {

        const matchingExpense =
            expenses.find(function (expense) {

                return String(expense.id) ===
                    String(requestedExpenseId);

            });

        if (matchingExpense) {

            expenseSelect.value =
                matchingExpense.id;

            showExpenseInfo();
        }
    }
}


// ========================================
// GET SELECTED EXPENSE
// ========================================

function getSelectedExpense() {

    const id =
        expenseSelect.value;

    return expenses.find(function (expense) {

        return String(expense.id) ===
            String(id);

    });
}


// ========================================
// SHOW EXPENSE INFORMATION
// ========================================

function showExpenseInfo() {

    const expense =
        getSelectedExpense();

    if (!expense) {

        expenseInfo.style.display = "none";

        return;
    }

    expenseInfo.style.display = "block";

    expenseName.textContent =
        expense.name || "-";

    expenseTotal.textContent =
        formatCurrency(expense.totalAmount);

    expenseSpentBy.textContent =
        people[expense.spentBy] ||
        expense.spentBy ||
        "-";

    updateCurrentValue();
}


// ========================================
// CURRENT VALUE
// ========================================

function updateCurrentValue() {

    const expense =
        getSelectedExpense();

    const field =
        fieldSelect.value;

    if (!expense || !field) {

        currentValue.value = "";

        return;
    }

    let value = "";

    switch (field) {

        case "myGivenAmount":

            value =
                expense.split &&
                expense.split[username] !== undefined
                    ? expense.split[username]
                    : 0;

            currentValue.value =
                formatCurrency(value);

            break;


        case "spentBy":

            currentValue.value =
                people[expense.spentBy] ||
                expense.spentBy ||
                "";

            break;


        case "details":

            currentValue.value =
                expense.details ||
                "No details";

            break;


        case "date":

            currentValue.value =
                expense.date ||
                "";

            break;
    }
}


// ========================================
// REQUESTED VALUE SETTINGS
// ========================================

function updateRequestedField() {

    requestedValue.value = "";

    requestedValue.type = "text";

    requestedValue.removeAttribute("min");
    requestedValue.removeAttribute("step");

    switch (fieldSelect.value) {

        case "myGivenAmount":

            requestedValue.type = "number";

            requestedValue.step = "0.01";

            requestedValue.min = "0";

            requestedValue.placeholder =
                "Example: 250";

            break;


        case "spentBy":

            requestedValue.placeholder =
                "Example: vetri";

            break;


        case "details":

            requestedValue.placeholder =
                "Enter updated expense details";

            break;


        case "date":

            requestedValue.type = "date";

            requestedValue.placeholder = "";

            break;


        default:

            requestedValue.placeholder =
                "Enter the new value";
    }
}


// ========================================
// EXPENSE CHANGE
// ========================================

expenseSelect.addEventListener(
    "change",
    function () {

        showExpenseInfo();

    }
);


// ========================================
// FIELD CHANGE
// ========================================

fieldSelect.addEventListener(
    "change",
    function () {

        updateCurrentValue();

        updateRequestedField();

    }
);


// ========================================
// SUBMIT REQUEST
// ========================================

form.addEventListener(
    "submit",
    function (event) {

        event.preventDefault();

        const expense =
            getSelectedExpense();

        if (!expense) {

            showMessage(
                "Please select an expense.",
                "error"
            );

            return;
        }

        const field =
            fieldSelect.value;

        const newValue =
            requestedValue.value.trim();

        const requestReason =
            reason.value.trim();


        if (!field) {

            showMessage(
                "Please select what you want to change.",
                "error"
            );

            return;
        }


        if (!newValue) {

            showMessage(
                "Please enter the requested value.",
                "error"
            );

            return;
        }


        if (!requestReason) {

            showMessage(
                "Please enter a reason.",
                "error"
            );

            return;
        }


        // Validate amount

        if (field === "myGivenAmount") {

            const amount =
                Number(newValue);

            if (
                Number.isNaN(amount) ||
                amount < 0
            ) {

                showMessage(
                    "Please enter a valid amount.",
                    "error"
                );

                return;
            }
        }


        // Validate spent-by username

        if (field === "spentBy") {

            const requestedUsername =
                newValue.toLowerCase();

            if (!people[requestedUsername]) {

                showMessage(
                    "Enter a valid person username: vetri, nitheen, yash, dharshu or mano.",
                    "error"
                );

                return;
            }
        }


        // LOAD REQUESTS

        const requests =
            JSON.parse(
                localStorage.getItem(
                    "changeRequests"
                ) || "[]"
            );


        // PREVENT DUPLICATE PENDING REQUEST

        const duplicateRequest =
            requests.some(function (request) {

                return (
                    String(request.expenseId) ===
                    String(expense.id)

                    &&

                    request.requestedBy ===
                    username

                    &&

                    (
                        request.field === field ||
                        request.fieldName === field
                    )

                    &&

                    request.status ===
                    "pending"
                );

            });


        if (duplicateRequest) {

            showMessage(
                "You already have a pending request for this field.",
                "error"
            );

            return;
        }


        // CREATE REQUEST

        const request = {

            id: Date.now(),

            expenseId: expense.id,

            expenseName:
                expense.name,

            requestedBy:
                username,

            personName:
                personName ||
                people[username],

            field:
                field,

            currentValue:
                getRawCurrentValue(
                    expense,
                    field
                ),

            requestedValue:
                field === "spentBy"
                    ? newValue.toLowerCase()
                    : newValue,

            reason:
                requestReason,

            status:
                "pending",

            createdAt:
                new Date().toISOString()
        };


        requests.push(request);


        localStorage.setItem(
            "changeRequests",
            JSON.stringify(requests)
        );


        // SUCCESS

        showMessage(
            "✓ Change request submitted successfully. Admin will review it.",
            "success"
        );


        form.reset();

        currentValue.value = "";

        expenseInfo.style.display = "none";


        // RETURN TO DASHBOARD

        setTimeout(function () {

            window.location.href =
                "person-dashboard.html";

        }, 1200);

    }
);


// ========================================
// RAW CURRENT VALUE
// ========================================

function getRawCurrentValue(
    expense,
    field
) {

    switch (field) {

        case "myGivenAmount":

            return (
                expense.split &&
                expense.split[username] !== undefined
            )
                ? Number(
                    expense.split[username]
                )
                : 0;


        case "spentBy":

            return expense.spentBy || "";


        case "details":

            return expense.details || "";


        case "date":

            return expense.date || "";


        default:

            return "";
    }
}


// ========================================
// MESSAGE
// ========================================

function showMessage(
    text,
    type
) {

    message.textContent =
        text;

    message.className =
        "message " + type;

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// ========================================
// BACK BUTTON
// ========================================

backBtn.addEventListener(
    "click",
    function () {

        window.location.href =
            "person-dashboard.html";

    }
);


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


// ========================================
// INITIAL LOAD
// ========================================

loadExpenses();

updateRequestedField();

// ========================================
// TOP BACK BUTTON
// ========================================

const topBackBtn =
    document.getElementById("topBackBtn");

if (topBackBtn) {

    topBackBtn.addEventListener(
        "click",
        function () {

            window.location.href =
                "person-dashboard.html";

        }
    );

}