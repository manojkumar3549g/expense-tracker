
"use strict";

// ========================================
// ADMIN DASHBOARD
// ========================================

const API_URL =
    "https://expense-tracker-api.manojkumar3549g.workers.dev";

const token = localStorage.getItem("authToken");
const role = localStorage.getItem("userRole");

if (role !== "admin" || !token) {
    window.location.href = "../index.html";
}

// ========================================
// HELPERS
// ========================================

function escapeHTML(value) {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
}

async function apiRequest(path) {
    const response = await fetch(`${API_URL}${path}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`
        }
    });

    const data = await response.json().catch(() => ({}));

    if (response.status === 401) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("loggedInUser");
        localStorage.removeItem("userRole");
        localStorage.removeItem("personName");

        window.location.href = "../index.html";
        throw new Error("Session expired. Please log in again.");
    }

    if (!response.ok) {
        throw new Error(data.error || "Unable to load dashboard data.");
    }

    return data;
}

function formatAmount(amount) {
    return "₹" + Number(amount || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function formatDate(value) {
    if (!value) return "Date unavailable";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short"
    });
}

// ========================================
// DASHBOARD STATISTICS
// ========================================

async function loadDashboardStats() {
    const data = await apiRequest("/api/dashboard");

    const peopleCount = document.getElementById("peopleCount");
    const expenseCount = document.getElementById("expenseCount");
    const totalAmount = document.getElementById("totalAmount");
    const requestCount = document.getElementById("requestCount");
    const requestBadge = document.getElementById("requestBadge");

    if (peopleCount) {
        peopleCount.textContent = data.people ?? 0;
    }

    if (expenseCount) {
        expenseCount.textContent = data.expenseCount ?? 0;
    }

    if (totalAmount) {
        totalAmount.textContent = formatAmount(data.totalAmount);
    }

    if (requestCount) {
        requestCount.textContent = data.pendingRequests ?? 0;
    }

    if (requestBadge) {
        requestBadge.textContent = data.pendingRequests ?? 0;
    }
}

// ========================================
// RECENT CHANGE REQUESTS
// ========================================

function getFieldLabel(field) {
    const labels = {
        myGivenAmount: "Amount Given",
        spentBy: "Spent By",
        details: "Expense Details",
        date: "Expense Date"
    };

    return labels[field] || field || "Change";
}

function addRequestStyles() {
    if (document.getElementById("professionalRequestStyles")) return;

    const style = document.createElement("style");
    style.id = "professionalRequestStyles";

    style.textContent = `
        .recent-requests-list {
            display: flex;
            flex-direction: column;
            gap: 16px;
            margin-top: 24px;
            width: 100%;
            box-sizing: border-box;
        }

        .request-card {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 14px;
            padding: 22px;
            box-shadow: 0 3px 12px rgba(15, 23, 42, 0.04);
            transition: box-shadow 0.2s ease, border-color 0.2s ease;
            min-width: 0;
            box-sizing: border-box;
        }

        .request-card:hover {
            border-color: #cbd5e1;
            box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
        }

        .request-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 14px;
            flex-wrap: wrap;
            margin-bottom: 18px;
        }

        .request-title {
            margin: 0 0 6px;
            color: #111827;
            font-size: 17px;
            font-weight: 700;
            line-height: 1.4;
            overflow-wrap: anywhere;
        }

        .request-person {
            margin: 0;
            color: #64748b;
            font-size: 13px;
            line-height: 1.5;
        }

        .request-card .status {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 6px 11px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 700;
            white-space: nowrap;
            background: #f1f5f9;
            color: #475569;
        }

        .request-card .status.pending {
            background: #fff7ed;
            color: #c2410c;
        }

        .request-card .status.approved {
            background: #dcfce7;
            color: #166534;
        }

        .request-card .status.rejected {
            background: #fee2e2;
            color: #b91c1c;
        }

        .request-details {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
            padding-top: 17px;
            border-top: 1px solid #eef2f7;
        }

        .request-details p {
            margin: 0;
            min-width: 0;
            color: #475569;
            font-size: 13px;
            line-height: 1.6;
            overflow-wrap: anywhere;
        }

        .request-details strong {
            display: block;
            margin-bottom: 3px;
            color: #64748b;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.045em;
        }

        .request-details .request-date {
            grid-column: 1 / -1;
            padding-top: 12px;
            border-top: 1px solid #f1f5f9;
            color: #94a3b8;
            font-size: 12px;
        }

        .view-all-requests {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            align-self: flex-start;
            gap: 8px;
            margin-top: 4px;
            padding: 11px 16px;
            border: 1px solid #dbeafe;
            border-radius: 9px;
            background: #eff6ff;
            color: #1d4ed8;
            font-size: 13px;
            font-weight: 600;
            text-decoration: none;
            transition: background 0.2s ease;
        }

        .view-all-requests:hover {
            background: #dbeafe;
        }

        @media (max-width: 600px) {
            .request-card {
                padding: 16px;
                border-radius: 12px;
            }

            .request-details {
                grid-template-columns: 1fr;
                gap: 14px;
            }

            .request-details .request-date {
                grid-column: auto;
            }

            .request-header {
                margin-bottom: 14px;
            }
        }
    `;

    document.head.appendChild(style);
}

addRequestStyles();

function renderRecentRequests(requests) {
    const container = document.getElementById("recentRequests");
    const statusText = document.getElementById("requestStatus");

    if (!container) return;

    const pendingCount = requests.filter(function (request) {
        return String(request.status).toLowerCase() === "pending";
    }).length;

    if (statusText) {
        statusText.textContent =
            `${pendingCount} pending request(s)`;
    }

    // Display the newest requests first.
    const sortedRequests = [...requests].sort(function (a, b) {
        return new Date(b.created_at || b.createdAt || 0) -
               new Date(a.created_at || a.createdAt || 0);
    });

    const recentRequests = sortedRequests.slice(0, 5);

    if (recentRequests.length === 0) {
        container.className = "empty-state";
        container.innerHTML = `
            <div>🔔</div>
            <h3>No change requests</h3>
            <p>Requests from persons will appear here.</p>
        `;
        return;
    }

    container.className = "recent-requests-list";

    container.innerHTML = recentRequests.map(function (request) {
        const requester =
            request.requester_name ||
            request.requested_by ||
            "Unknown person";

        const expenseName =
            request.expense_name || "Expense";

        const field = getFieldLabel(request.field);

        const currentValue = request.current_value ?? "—";
        const requestedValue = request.requested_value ?? "—";

        const reason = request.reason || "No reason provided";

        const requestStatus =
            String(request.status || "pending").toLowerCase();

        const statusLabel =
            requestStatus.charAt(0).toUpperCase() +
            requestStatus.slice(1);

        return `
            <article class="request-card">
                <div class="request-header">
                    <div>
                        <h3 class="request-title">
                            ${escapeHTML(expenseName)}
                        </h3>
                        <p class="request-person">
                            Requested by ${escapeHTML(requester)}
                        </p>
                    </div>

                    <span class="status ${escapeHTML(requestStatus)}">
                        ${escapeHTML(statusLabel)}
                    </span>
                </div>

                <div class="request-details">
                    <p>
                        <strong>Field:</strong>
                        ${escapeHTML(field)}
                    </p>

                    <p>
                        <strong>Current value:</strong>
                        ${escapeHTML(currentValue)}
                    </p>

                    <p>
                        <strong>Requested value:</strong>
                        ${escapeHTML(requestedValue)}
                    </p>

                    <p>
                        <strong>Reason:</strong>
                        ${escapeHTML(reason)}
                    </p>

                    <p class="request-date">
                        ${escapeHTML(formatDate(
                            request.created_at || request.createdAt
                        ))}
                    </p>
                </div>
            </article>
        `;
    }).join("");

    const link = document.createElement("a");
    link.href = "change-requests.html";
    link.className = "view-all-requests";
    link.textContent = "View all change requests →";

    container.appendChild(link);
}

// ========================================
// LOAD CHANGE REQUESTS FROM CLOUDFLARE
// ========================================

async function loadRecentRequests() {
    const container = document.getElementById("recentRequests");

    if (container) {
        container.className = "empty-state";
        container.innerHTML = `
            <h3>Loading change requests...</h3>
            <p>Please wait.</p>
        `;
    }

    try {
        const requests = await apiRequest("/api/change-requests");

        renderRecentRequests(
            Array.isArray(requests) ? requests : []
        );

    } catch (error) {
        console.error("Loading change requests failed:", error);

        if (container) {
            container.className = "empty-state";
            container.innerHTML = `
                <h3>Unable to load change requests</h3>
                <p>${escapeHTML(error.message)}</p>
                <button type="button" id="retryRequestsBtn">
                    Try Again
                </button>
            `;

            const retryButton =
                document.getElementById("retryRequestsBtn");

            if (retryButton) {
                retryButton.addEventListener("click", loadRecentRequests);
            }
        }
    }
}

// ========================================
// LOGOUT
// ========================================

function logout() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("userRole");
    localStorage.removeItem("personName");

    window.location.href = "../index.html";
}

window.logout = logout;

// ========================================
// INITIAL LOAD
// ========================================

async function initializeDashboard() {
    try {
        await loadDashboardStats();
    } catch (error) {
        console.error("Loading dashboard statistics failed:", error);
    }

    await loadRecentRequests();
}

initializeDashboard();
