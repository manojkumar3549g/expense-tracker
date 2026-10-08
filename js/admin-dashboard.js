// Check login

const role =
    localStorage.getItem("userRole");

if (role !== "admin") {

    window.location.href =
        "../index.html";

}


// Load expenses

let expenses =
    JSON.parse(
        localStorage.getItem("expenses")
    ) || [];


// Load change requests

let changeRequests =
    JSON.parse(
        localStorage.getItem("changeRequests")
    ) || [];


// Update statistics

function updateDashboard() {

    document.getElementById("peopleCount")
        .textContent = 5;


    document.getElementById("expenseCount")
        .textContent = expenses.length;


    const total =
        expenses.reduce(
            (sum, expense) =>
                sum + Number(expense.totalAmount),
            0
        );


    document.getElementById("totalAmount")
        .textContent =
        "₹" + total.toLocaleString("en-IN");


    const pendingRequests =
        changeRequests.filter(
            request =>
                request.status === "pending"
        );


    document.getElementById("requestCount")
        .textContent =
        pendingRequests.length;


    document.getElementById("requestBadge")
        .textContent =
        pendingRequests.length;


    if (pendingRequests.length > 0) {

        document.getElementById("requestStatus")
            .textContent =
            pendingRequests.length +
            " pending request(s)";

    }

}


// Logout

function logout() {

    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("userRole");
    localStorage.removeItem("personName");

    window.location.href =
        "../index.html";

}


updateDashboard();