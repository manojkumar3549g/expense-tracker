
// ========================================
// CHANGE REQUESTS - ADMIN
// ========================================

const API_URL =
    "https://expense-tracker-api.manojkumar3549g.workers.dev";


 // ========================================
// ADMIN ACCESS
// ========================================

const role =
    sessionStorage.getItem("userRole") ||
    localStorage.getItem("userRole");

const token =
    sessionStorage.getItem("authToken") ||
    localStorage.getItem("authToken");

if (role !== "admin" || !token) {
    window.location.href = "../index.html";
}


// ========================================
// ELEMENTS
// ========================================

const requestsContainer =
    document.getElementById("requestsContainer");

const totalRequests =
    document.getElementById("totalRequests");

const pendingRequests =
    document.getElementById("pendingRequests");

const approvedRequests =
    document.getElementById("approvedRequests");

const rejectedRequests =
    document.getElementById("rejectedRequests");

const filterButtons =
    document.querySelectorAll(".filter-btn");

// ========================================
// DATA
// ========================================

let requests = [];
let currentFilter = "all";
let isLoading = false;

const people = {
    vetri: "Vetrivel",
    nitheen: "Nitheen",
    yash: "Yaswanth",
    dharshu: "Dharshini",
    mano: "ManojKumar"
};

// ========================================
// HELPERS
// ========================================

function escapeHTML(value) {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
}

function formatCurrency(amount) {
    return Number(amount || 0).toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function formatDateTime(value) {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short"
    });
}

function formatFieldName(field) {
    const names = {
        myGivenAmount: "My Given Amount",
        spentBy: "Spent By",
        details: "Expense Details",
        date: "Date"
    };

    return names[field] || field || "Unknown";
}

function formatValue(value, field) {
    if (value === null || value === undefined || value === "") {
        return "-";
    }

    if (field === "myGivenAmount") {
        return formatCurrency(value);
    }

    if (field === "spentBy") {
        return people[String(value).toLowerCase()] || String(value);
    }

    return String(value);
}

async function showMessage(message, type, title) {
    if (typeof showAlert === "function") {
        await showAlert(message, type, title);
    } else {
        window.alert(message);
    }
}

async function confirmAction(message, title, confirmText) {
    if (typeof showConfirm === "function") {
        return await showConfirm(
            message,
            title,
            confirmText,
            "Cancel"
        );
    }

    return window.confirm(message);
}

// The Worker uses snake_case database columns.
// Normalize them for consistent rendering.
function normalizeRequest(request) {
    return {
        ...request,
        id: request.id,
        expenseId: request.expenseId ?? request.expense_id,
        requestedBy: request.requestedBy ?? request.requested_by,
        personName:
            request.personName ??
            request.requester_name ??
            people[request.requestedBy ?? request.requested_by] ??
            request.requestedBy ??
            request.requested_by ??
            "Unknown",
        expenseName:
            request.expenseName ??
            request.expense_name ??
            "",
        field: request.field ?? request.field_name,
        currentValue: request.currentValue ?? request.current_value,
        requestedValue: request.requestedValue ?? request.requested_value,
        createdAt: request.createdAt ?? request.created_at,
        reviewedAt: request.reviewedAt ?? request.reviewed_at,
        status: String(request.status || "pending").toLowerCase()
    };
}

// ========================================
// LOAD REQUESTS FROM CLOUDFLARE
// ========================================

async function loadRequests() {
    if (isLoading) return;

    isLoading = true;

    if (requestsContainer) {
        requestsContainer.innerHTML = `
            <div class="empty-state">
                <h3>Loading change requests...</h3>
            </div>
        `;
    }

    try {
        const response = await fetch(
            `${API_URL}/api/change-requests`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem("authToken");
                localStorage.removeItem("loggedInUser");
                localStorage.removeItem("userRole");
                localStorage.removeItem("personName");

                window.location.href = "../index.html";
                return;
            }

            throw new Error(
                data.error || "Unable to load change requests."
            );
        }

        const result = Array.isArray(data)
            ? data
            : (data.requests || []);

        requests = result.map(normalizeRequest);

        renderRequests();

    } catch (error) {
        console.error("Loading change requests failed:", error);

        if (requestsContainer) {
            requestsContainer.innerHTML = `
                <div class="empty-state">
                    <h3>Unable to load change requests</h3>
                    <p>${escapeHTML(error.message)}</p>
                    <button type="button" id="retryRequestsBtn">
                        Try Again
                    </button>
                </div>
            `;

            const retryButton =
                document.getElementById("retryRequestsBtn");

            if (retryButton) {
                retryButton.addEventListener("click", loadRequests);
            }
        }
    } finally {
        isLoading = false;
    }
}

// ========================================
// FILTER BUTTONS
// ========================================

filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        filterButtons.forEach(function (item) {
            item.classList.remove("active");
        });

        this.classList.add("active");
        currentFilter = this.dataset.filter || "all";

        renderRequests();
    });
});

// ========================================
// SUMMARY
// ========================================

function updateSummary() {
    const pendingCount = requests.filter(
        request => request.status === "pending"
    ).length;

    const approvedCount = requests.filter(
        request => request.status === "approved"
    ).length;

    const rejectedCount = requests.filter(
        request => request.status === "rejected"
    ).length;

    if (totalRequests) {
        totalRequests.textContent = requests.length;
    }

    if (pendingRequests) {
        pendingRequests.textContent = pendingCount;
    }

    if (approvedRequests) {
        approvedRequests.textContent = approvedCount;
    }

    if (rejectedRequests) {
        rejectedRequests.textContent = rejectedCount;
    }
}

// ========================================
// RENDER REQUESTS
// ========================================

function renderRequests() {
    updateSummary();

    if (!requestsContainer) return;

    requestsContainer.innerHTML = "";

    const filteredRequests = requests
        .filter(function (request) {
            return currentFilter === "all" ||
                request.status === currentFilter;
        })
        .sort(function (a, b) {
            return new Date(b.createdAt || 0) -
                new Date(a.createdAt || 0);
        });

    if (filteredRequests.length === 0) {
        const label = currentFilter === "all"
            ? ""
            : currentFilter + " ";

        requestsContainer.innerHTML = `
            <div class="empty-state">
                <h3>No ${escapeHTML(label)}requests found</h3>
                <p>There are no change requests in this category.</p>
            </div>
        `;
        return;
    }

    filteredRequests.forEach(function (request) {
        requestsContainer.appendChild(createRequestCard(request));
    });
}

// ========================================
// CREATE REQUEST CARD
// ========================================

function createRequestCard(request) {
    const card = document.createElement("div");
    card.className = "request-card";

    const personName =
        request.personName ||
        people[String(request.requestedBy).toLowerCase()] ||
        request.requestedBy ||
        "Unknown";

    const expenseName =
        request.expenseName ||
        `Expense #${request.expenseId}`;

    const fieldName = formatFieldName(request.field);

    const currentValue = formatValue(
        request.currentValue,
        request.field
    );

    const requestedValue = formatValue(
        request.requestedValue,
        request.field
    );

    const status = request.status || "pending";

    let actionsHTML = "";

    if (status === "pending") {
        actionsHTML = `
            <div class="request-actions">
                <button
                    type="button"
                    class="action-btn approve-btn"
                    data-action="approve"
                    data-id="${escapeHTML(request.id)}"
                >✓ Approve</button>

                <button
                    type="button"
                    class="action-btn reject-btn"
                    data-action="reject"
                    data-id="${escapeHTML(request.id)}"
                >✕ Reject</button>
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
                    <strong>${escapeHTML(personName)}</strong>
                </div>
            </div>

            <span class="status ${escapeHTML(status)}">
                ${escapeHTML(status)}
            </span>
        </div>

        <div class="request-details">
            <div class="detail-box">
                <span class="detail-label">Requested Change</span>
                <span class="detail-value">
                    ${escapeHTML(fieldName)}
                </span>
            </div>

            <div class="detail-box">
                <span class="detail-label">Current Value</span>
                <span class="detail-value">
                    ${escapeHTML(currentValue)}
                </span>
            </div>

            <div class="detail-box">
                <span class="detail-label">Requested Value</span>
                <span class="detail-value">
                    ${escapeHTML(requestedValue)}
                </span>
            </div>
        </div>

        <div class="reason-box">
            <strong>Reason</strong>
            <p>${escapeHTML(request.reason || "No reason provided.")}</p>
        </div>

        <div class="request-details">
            <div class="detail-box">
                <span class="detail-label">Submitted</span>
                <span class="detail-value">
                    ${formatDateTime(request.createdAt)}
                </span>
            </div>

            ${
                request.reviewedAt
                    ? `
                        <div class="detail-box">
                            <span class="detail-label">Reviewed</span>
                            <span class="detail-value">
                                ${formatDateTime(request.reviewedAt)}
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
// APPROVE / REJECT BUTTONS
// ========================================

if (requestsContainer) {
    requestsContainer.addEventListener("click", function (event) {
        const button = event.target.closest("button[data-action]");

        if (!button) return;

        const id = button.dataset.id;
        const action = button.dataset.action;

        if (action === "approve") {
            approveRequest(id);
        } else if (action === "reject") {
            rejectRequest(id);
        }
    });
}

// ========================================
// REVIEW REQUEST THROUGH API
// ========================================

async function reviewRequest(id, action) {
    const request = requests.find(function (item) {
        return String(item.id) === String(id);
    });

    if (!request) {
        await showMessage(
            "The selected change request could not be found. Please refresh the page.",
            "error",
            "Request Not Found"
        );
        return;
    }

    if (request.status !== "pending") {
        await showMessage(
            "This request has already been reviewed.",
            "warning",
            "Already Reviewed"
        );
        return;
    }

    const isApprove = action === "approve";

    const confirmed = await confirmAction(
        isApprove
            ? "Approve this change request?"
            : "Reject this change request?",
        isApprove
            ? "Approve Change Request"
            : "Reject Change Request",
        isApprove ? "Approve" : "Reject"
    );

    if (!confirmed) return;

    const buttonSelector =
        `button[data-action="${action}"][data-id="${CSS.escape(String(id))}"]`;

    const clickedButton = requestsContainer
        ? requestsContainer.querySelector(buttonSelector)
        : null;

    if (clickedButton) {
        clickedButton.disabled = true;
        clickedButton.textContent = isApprove
            ? "Approving..."
            : "Rejecting...";
    }

    try {
        const response = await fetch(
            `${API_URL}/api/change-requests/${encodeURIComponent(id)}/${action}`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error ||
                `Unable to ${action} the change request.`
            );
        }

        await showMessage(
            isApprove
                ? "The change request has been approved successfully."
                : "The change request has been rejected.",
            isApprove ? "success" : "warning",
            isApprove ? "Request Approved" : "Request Rejected"
        );

        // Refresh from the server so status and data remain authoritative.
        await loadRequests();

    } catch (error) {
        console.error(`${action} request failed:`, error);

        await showMessage(
            error.message || "Unable to connect to the server.",
            "error",
            "Request Failed"
        );

        if (clickedButton) {
            clickedButton.disabled = false;
            clickedButton.textContent = isApprove
                ? "✓ Approve"
                : "✕ Reject";
        }
    }
}

// ========================================
// APPROVE REQUEST
// ========================================

async function approveRequest(id) {
    return reviewRequest(id, "approve");
}

window.approveRequest = approveRequest;

// ========================================
// REJECT REQUEST
// ========================================

async function rejectRequest(id) {
    return reviewRequest(id, "reject");
}

window.rejectRequest = rejectRequest;

// ========================================
// INITIAL LOAD
// ========================================

if (role === "admin" && token) {
    loadRequests();
}
