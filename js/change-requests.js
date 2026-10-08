// ========================================
// CHANGE REQUESTS
// ========================================


// ----------------------------------------
// ADMIN ACCESS
// ----------------------------------------

const role =
    localStorage.getItem("userRole");


if (role !== "admin") {

    window.location.href =
        "../index.html";

}


// ----------------------------------------
// ELEMENTS
// ----------------------------------------

const requestsContainer =
    document.getElementById(
        "requestsContainer"
    );

const totalRequests =
    document.getElementById(
        "totalRequests"
    );

const pendingRequests =
    document.getElementById(
        "pendingRequests"
    );

const approvedRequests =
    document.getElementById(
        "approvedRequests"
    );

const rejectedRequests =
    document.getElementById(
        "rejectedRequests"
    );

const filterButtons =
    document.querySelectorAll(
        ".filter-btn"
    );


// ----------------------------------------
// DATA
// ----------------------------------------

let requests =
    JSON.parse(
        localStorage.getItem(
            "changeRequests"
        ) || "[]"
    );


let expenses =
    JSON.parse(
        localStorage.getItem(
            "expenses"
        ) || "[]"
    );


let currentFilter = "all";


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
// FILTER BUTTONS
// ----------------------------------------

filterButtons.forEach(
    function (button) {

        button.addEventListener(
            "click",
            function () {

                filterButtons.forEach(
                    function (item) {

                        item.classList.remove(
                            "active"
                        );

                    }
                );


                this.classList.add(
                    "active"
                );


                currentFilter =
                    this.dataset.filter;


                renderRequests();

            }
        );

    }
);


// ----------------------------------------
// SUMMARY
// ----------------------------------------

function updateSummary() {

    totalRequests.textContent =
        requests.length;


    pendingRequests.textContent =
        requests.filter(
            function (request) {

                return request.status === "pending";

            }
        ).length;


    approvedRequests.textContent =
        requests.filter(
            function (request) {

                return request.status === "approved";

            }
        ).length;


    rejectedRequests.textContent =
        requests.filter(
            function (request) {

                return request.status === "rejected";

            }
        ).length;

}


// ----------------------------------------
// RENDER REQUESTS
// ----------------------------------------

function renderRequests() {

    updateSummary();

    requestsContainer.innerHTML = "";


    let filteredRequests =
        requests.filter(
            function (request) {

                if (
                    currentFilter === "all"
                ) {

                    return true;

                }


                return (
                    request.status ===
                    currentFilter
                );

            }
        );


    // Newest first

    filteredRequests.sort(
        function (a, b) {

            return (
                new Date(
                    b.createdAt || 0
                ) -
                new Date(
                    a.createdAt || 0
                )
            );

        }
    );


    if (
        filteredRequests.length === 0
    ) {

        requestsContainer.innerHTML = `

            <div class="empty-state">

                <h3>
                    No ${currentFilter === "all"
                        ? ""
                        : currentFilter + " "
                    }requests found
                </h3>

                <p>
                    There are no change requests
                    in this category.
                </p>

            </div>

        `;

        return;

    }


    filteredRequests.forEach(
        function (request) {

            requestsContainer.appendChild(
                createRequestCard(request)
            );

        }
    );

}


// ----------------------------------------
// CREATE REQUEST CARD
// ----------------------------------------

function createRequestCard(request) {

    const card =
        document.createElement("div");

    card.className =
        "request-card";


    const personName =
        people[request.requestedBy] ||
        request.personName ||
        request.requestedBy ||
        "Unknown";


    const expense =
        expenses.find(
            function (item) {

                return (
                    String(item.id) ===
                    String(request.expenseId)
                );

            }
        );


    const expenseName =
        expense
            ? expense.name
            : (
                request.expenseName ||
                "Expense unavailable"
            );


    const fieldName =
        formatFieldName(
            request.field ||
            request.fieldName
        );


    const currentValue =
        formatValue(
            request.currentValue,
            request.field ||
            request.fieldName
        );


    const requestedValue =
        formatValue(
            request.requestedValue,
            request.field ||
            request.fieldName
        );


    const status =
        request.status || "pending";


    let actionsHTML = "";


    if (status === "pending") {

        actionsHTML = `

            <div class="request-actions">

                <button
                    type="button"
                    class="action-btn approve-btn"
                    onclick="approveRequest(${request.id})"
                >
                    ✓ Approve
                </button>

                <button
                    type="button"
                    class="action-btn reject-btn"
                    onclick="rejectRequest(${request.id})"
                >
                    ✕ Reject
                </button>

            </div>

        `;

    }


    card.innerHTML = `

        <div class="request-header">

            <div>

                <h2 class="request-title">

                    ${escapeHTML(expenseName)}

                </h2>

                <div class="request-person">

                    Requested by:
                    <strong>
                        ${escapeHTML(personName)}
                    </strong>

                </div>

            </div>


            <span class="status ${status}">

                ${status}

            </span>

        </div>


        <div class="request-details">

            <div class="detail-box">

                <span class="detail-label">
                    Requested Change
                </span>

                <span class="detail-value">
                    ${escapeHTML(fieldName)}
                </span>

            </div>


            <div class="detail-box">

                <span class="detail-label">
                    Current Value
                </span>

                <span class="detail-value">
                    ${escapeHTML(currentValue)}
                </span>

            </div>


            <div class="detail-box">

                <span class="detail-label">
                    Requested Value
                </span>

                <span class="detail-value">
                    ${escapeHTML(requestedValue)}
                </span>

            </div>

        </div>


        <div class="reason-box">

            <strong>
                Reason
            </strong>

            <p>
                ${escapeHTML(
                    request.reason ||
                    "No reason provided."
                )}
            </p>

        </div>


        <div class="request-details">

            <div class="detail-box">

                <span class="detail-label">
                    Submitted
                </span>

                <span class="detail-value">
                    ${formatDateTime(
                        request.createdAt
                    )}
                </span>

            </div>

            ${
                request.reviewedAt
                    ? `
                        <div class="detail-box">

                            <span class="detail-label">
                                Reviewed
                            </span>

                            <span class="detail-value">
                                ${formatDateTime(
                                    request.reviewedAt
                                )}
                            </span>

                        </div>
                      `
                    : ""
            }

        </div>


        ${actionsHTML}

    `;


    return card;

}


// ========================================
// APPROVE REQUEST
// ========================================

async function approveRequest(id) {

    const request =
        requests.find(
            function (item) {

                return (
                    String(item.id) ===
                    String(id)
                );

            }
        );


    if (!request) {

        await showAlert(
    "The selected change request could not be found.",
    "error",
    "Request Not Found"
);

        return;

    }


    if (
        request.status !==
        "pending"
    ) {

        await showAlert(
    "This request has already been reviewed and cannot be changed again.",
    "warning",
    "Already Reviewed"
);

        return;

    }


    const confirmed = await showConfirm(
    "Approve this change request?",
    "Approve Change Request",
    "Approve",
    "Cancel"
);

if (!confirmed) {
    return;
}


    const expense =
        expenses.find(
            function (item) {

                return (
                    String(item.id) ===
                    String(request.expenseId)
                );

            }
        );


    if (!expense) {

        await showAlert(
    "The related expense could not be found.",
    "error",
    "Expense Not Found"
);

        return;

    }


    // Apply requested change

    const field =
        request.field ||
        request.fieldName;


    if (
        field ===
        "myGivenAmount"
    ) {

        if (!expense.split) {

            expense.split = {};

        }


        const amount =
            Number(
                request.requestedValue
            );


        if (
            isNaN(amount) ||
            amount < 0
        ) {

            await showAlert(
    "Please enter a valid requested amount.",
    "error",
    "Invalid Amount"
);

            return;

        }


        expense.split[
            request.requestedBy
        ] = amount;

    }


    else if (
        field ===
        "spentBy"
    ) {

        const requestedUsername =
            request.requestedValue;


        if (
            !people[
                requestedUsername
            ]
        ) {

            await showAlert(
    "Please select a valid person.",
    "error",
    "Invalid Person"
);

            return;

        }


        expense.spentBy =
            requestedUsername;

    }


    else if (
        field ===
        "details"
    ) {

        expense.details =
            request.requestedValue || "";

    }


    else if (
        field ===
        "date"
    ) {

        expense.date =
            request.requestedValue;

    }


    else {

        await showAlert(
    "This request type is not supported.",
    "warning",
    "Unsupported Request"
);

        return;

    }


    // Update request

    request.status =
        "approved";


    request.reviewedAt =
        new Date().toISOString();


    request.reviewedBy =
        "admin";


    // Save

    localStorage.setItem(
        "expenses",
        JSON.stringify(expenses)
    );


    localStorage.setItem(
        "changeRequests",
        JSON.stringify(requests)
    );


    await showAlert(
    "The change request has been approved successfully.",
    "success",
    "Request Approved"
);


    renderRequests();

}


// ========================================
// REJECT REQUEST
// ========================================

async function rejectRequest(id)  {

    const request =
        requests.find(
            function (item) {

                return (
                    String(item.id) ===
                    String(id)
                );

            }
        );


    if (!request) {

        await showAlert(
    "The selected change request could not be found.",
    "error",
    "Request Not Found"
);

        return;

    }


    if (
        request.status !==
        "pending"
    ) {

        await showAlert(
    "This request has already been reviewed and cannot be changed again.",
    "warning",
    "Already Reviewed"
);

        return;

    }


    const confirmed = await showConfirm(
    "Reject this change request?",
    "Reject Change Request",
    "Reject",
    "Cancel"
);

if (!confirmed) {
    return;
}


    request.status =
        "rejected";


    request.reviewedAt =
        new Date().toISOString();


    request.reviewedBy =
        "admin";


    localStorage.setItem(
        "changeRequests",
        JSON.stringify(requests)
    );


    await showAlert(
    "The change request has been rejected.",
    "warning",
    "Request Rejected"
);


    renderRequests();

}


// ========================================
// FIELD NAME
// ========================================

function formatFieldName(field) {

    const names = {

        myGivenAmount:
            "My Given Amount",

        spentBy:
            "Spent By",

        details:
            "Expense Details",

        date:
            "Date"

    };


    return (
        names[field] ||
        field ||
        "Unknown"
    );

}


// ========================================
// FORMAT VALUE
// ========================================

function formatValue(
    value,
    field
) {

    if (
        field ===
        "myGivenAmount"
    ) {

        return formatCurrency(value);

    }


    if (
        field ===
        "spentBy"
    ) {

        return (
            people[value] ||
            value ||
            "-"
        );

    }


    return value || "-";

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
// DATE / TIME
// ========================================

function formatDateTime(value) {

    if (!value) {

        return "-";

    }


    const date =
        new Date(value);


    if (
        isNaN(
            date.getTime()
        )
    ) {

        return value;

    }


    return date.toLocaleString(
        "en-IN",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );

}


// ========================================
// ESCAPE HTML
// ========================================

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value ?? "";

    return div.innerHTML;

}


// ========================================
// INITIAL LOAD
// ========================================

renderRequests();