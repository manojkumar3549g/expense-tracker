
"use strict";

// ========================================
// PEOPLE MANAGEMENT
// ========================================

const API_URL =
    "https://expense-tracker-api.manojkumar3549g.workers.dev";

// ========================================
// ADMIN ACCESS
// ========================================

const role = localStorage.getItem("userRole");
const token = localStorage.getItem("authToken");

if (role !== "admin" || !token) {
    window.location.href = "../index.html";
}

// ========================================
// ELEMENTS
// ========================================

const peopleGrid = document.getElementById("peopleGrid");
const peopleCountText = document.getElementById("peopleCountText");
const personModal = document.getElementById("personModal");
const personForm = document.getElementById("personForm");
const modalTitle = document.getElementById("modalTitle");
const personName = document.getElementById("personName");
const personUsername = document.getElementById("personUsername");
const personPassword = document.getElementById("personPassword");

// ========================================
// DATA
// ========================================

let people = [];
let editingUsername = null;
let isSaving = false;

// ========================================
// HELPERS
// ========================================

function escapeHTML(value) {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
}

async function showMessage(message, type = "info", title = "") {
    if (typeof showAlert === "function") {
        await showAlert(message, type, title);
    } else {
        window.alert(message);
    }
}

async function confirmAction(message) {
    if (typeof showConfirm === "function") {
        return await showConfirm(
            message,
            "Confirm Action",
            "Continue",
            "Cancel"
        );
    }

    return window.confirm(message);
}


async function apiRequest(path, options = {}) {
    const token =
        sessionStorage.getItem("authToken") ||
        localStorage.getItem("authToken");

    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            Authorization: `Bearer ${token || ""}`,
            ...(options.body
                ? { "Content-Type": "application/json" }
                : {}),
            ...(options.headers || {})
        }
    });

    const data = await response.json().catch(() => ({}));

    if (response.status === 401) {
        for (const storage of [localStorage, sessionStorage]) {
            storage.removeItem("authToken");
            storage.removeItem("loggedInUser");
            storage.removeItem("userRole");
            storage.removeItem("personName");
        }

        window.location.href = "../index.html";
        throw new Error("Your session has expired. Please log in again.");
    }

    if (!response.ok) {
        throw new Error(data.error || "The request failed.");
    }

    return data;
}

// ========================================
// LOAD ACCOUNTS FROM CLOUDFLARE
// ========================================

async function loadPeople() {
    if (!peopleGrid) return;

    peopleGrid.innerHTML = `
        <div class="empty-state">
            <h3>Loading accounts...</h3>
        </div>
    `;

    try {
        const data = await apiRequest("/api/people");

        const personAccounts = (
            Array.isArray(data) ? data : data.people || []
        ).map(function (person) {
            return {
                name: person.name || person.username,
                username: person.username,
                role: person.role || "person",
                active: person.enabled === true || person.enabled === 1
            };
        });

        // Add the current admin account to the management screen.
        // The current GET /api/people endpoint returns person accounts only.
        const adminUsername = (
            localStorage.getItem("loggedInUser") || ""
        ).trim().toLowerCase();

        if (
            adminUsername &&
            !personAccounts.some(p => p.username === adminUsername)
        ) {
            personAccounts.push({
                name: localStorage.getItem("personName") || "Admin",
                username: adminUsername,
                role: "admin",
                active: true
            });
        }

        people = personAccounts;
        renderPeople();

    } catch (error) {
        console.error("Loading accounts failed:", error);

        peopleGrid.innerHTML = `
            <div class="empty-state">
                <h3>Unable to load accounts</h3>
                <p>${escapeHTML(error.message)}</p>
                <button type="button" id="retryPeopleBtn">
                    Try Again
                </button>
            </div>
        `;

        const retryButton = document.getElementById("retryPeopleBtn");

        if (retryButton) {
            retryButton.addEventListener("click", loadPeople);
        }
    }
}

// ========================================
// RENDER ACCOUNTS
// ========================================

function renderPeople() {
    if (!peopleGrid) return;

    peopleGrid.innerHTML = "";

    if (peopleCountText) {
        peopleCountText.textContent =
            `${people.length} ${people.length === 1 ? "account" : "accounts"}`;
    }

    if (people.length === 0) {
        peopleGrid.innerHTML = `
            <div class="empty-state">
                <h3>No accounts found</h3>
                <p>Add a person to get started.</p>
            </div>
        `;
        return;
    }

    people.forEach(function (person) {
        peopleGrid.appendChild(createPersonCard(person));
    });
}

// ========================================
// ACCOUNT CARD
// ========================================

function createPersonCard(person) {
    const card = document.createElement("div");
    card.className = "person-card";

    const statusClass = person.active ? "active" : "inactive";
    const statusText = person.active ? "Active" : "Inactive";
    const isAdmin = person.role === "admin";
    const roleLabel = isAdmin ? "Admin" : "Person";

    card.innerHTML = `
        <div class="person-top">
            <div class="person-avatar">${isAdmin ? "🛡️" : "👤"}</div>

            <div>
                <h2 class="person-name">
                    ${escapeHTML(person.name)}
                </h2>
                <div class="person-role">${roleLabel}</div>
            </div>
        </div>

        <div class="person-details">
            <div class="detail-row">
                <span class="detail-label">Username</span>
                <span class="detail-value">
                    ${escapeHTML(person.username)}
                </span>
            </div>

            <div class="detail-row">
                <span class="detail-label">Role</span>
                <span class="detail-value">${roleLabel}</span>
            </div>

            <div class="detail-row">
                <span class="detail-label">Account</span>
                <span class="detail-value">
                    <span class="account-status ${statusClass}">
                        ${statusText}
                    </span>
                </span>
            </div>
        </div>

        <div class="person-actions">
            <button
                type="button"
                class="person-action-btn edit-person"
                data-action="edit"
                data-username="${escapeHTML(person.username)}"
            >✏️ Edit</button>

            

<button
    type="button"
    class="person-action-btn toggle-person"
    data-action="toggle"
    data-username="${escapeHTML(person.username)}"
>
    ${person.active ? "🚫Disable Account" : "✔️Enable Account"}
</button>

<button
    type="button"
    class="person-action-btn delete-person"
    data-action="delete"
    data-username="${escapeHTML(person.username)}"
>
    🗑️ Delete
</button>




        </div>
    `;

    return card;
}

// ========================================
// CARD BUTTONS
// ========================================

if (peopleGrid) {
    peopleGrid.addEventListener("click", function (event) {
        const button = event.target.closest("button[data-action]");

        if (!button) return;

        const action = button.dataset.action;
        const username = button.dataset.username;

        if (action === "edit") {
            editPerson(username);
        } else if (action === "toggle") {
            togglePerson(username);
        } else if (action === "delete") {
            deletePerson(username);
        }
    });
}

// ========================================
// ADD PERSON MODAL
// ========================================

function openAddPersonModal() {
    editingUsername = null;

    if (modalTitle) {
        modalTitle.textContent = "Add Person";
    }

    if (personForm) {
        personForm.reset();
    }

    if (personUsername) {
        personUsername.disabled = false;
        personUsername.required = true;
    }

    if (personPassword) {
        personPassword.disabled = false;
        personPassword.required = true;
        personPassword.value = "";
        personPassword.minLength = 8;
        personPassword.placeholder = "At least 8 characters";
    }

    if (personModal) {
        personModal.classList.add("show");
    }
}

window.openAddPersonModal = openAddPersonModal;

// ========================================
// EDIT ACCOUNT
// ========================================

function editPerson(username) {
    const person = people.find(function (item) {
        return item.username === username;
    });

    if (!person) {
        showMessage("Account not found.", "error", "Not Found");
        return;
    }

    editingUsername = username;

    if (modalTitle) {
        modalTitle.textContent =
            person.role === "admin" ? "Edit Admin Account" : "Edit Person";
    }

    if (personName) {
        personName.value = person.name;
    }

    if (personUsername) {
        personUsername.value = person.username;
        personUsername.disabled = false;
        personUsername.required = true;
    }

    if (personPassword) {
        personPassword.value = "";
        personPassword.disabled = false;
        personPassword.required = false;
        personPassword.minLength = 8;
        personPassword.placeholder =
            "Leave blank to keep the current password";
    }

    if (personModal) {
        personModal.classList.add("show");
    }
}

window.editPerson = editPerson;

// ========================================
// CLOSE MODAL
// ========================================

function closePersonModal() {
    if (personModal) {
        personModal.classList.remove("show");
    }

    editingUsername = null;

    if (personForm) {
        personForm.reset();
    }

    if (personUsername) {
        personUsername.disabled = false;
        personUsername.required = true;
    }

    if (personPassword) {
        personPassword.disabled = false;
        personPassword.required = true;
        personPassword.minLength = 8;
        personPassword.placeholder = "At least 8 characters";
    }
}

window.closePersonModal = closePersonModal;

// ========================================
// SUBMIT FORM - ADD OR EDIT ACCOUNT
// ========================================

if (personForm) {
    personForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        if (isSaving) return;

        const name = personName.value.trim();
        const username = personUsername.value.trim().toLowerCase();
        const password = personPassword.value;

        if (!name || !username) {
            await showMessage(
                "Please enter the name and username.",
                "warning",
                "Missing Information"
            );
            return;
        }

        if (!/^[a-z0-9_]+$/.test(username)) {
            await showMessage(
                "Username can contain lowercase letters, numbers and underscores only.",
                "warning",
                "Invalid Username"
            );
            return;
        }

        if (password && password.length < 8) {
            await showMessage(
                "Password must be at least 8 characters long.",
                "warning",
                "Password Too Short"
            );
            return;
        }

        const duplicate = people.some(function (person) {
            return (
                person.username.toLowerCase() === username &&
                person.username !== editingUsername
            );
        });

        if (duplicate) {
            await showMessage(
                "This username already exists.",
                "error",
                "Duplicate Username"
            );
            return;
        }

        if (!editingUsername && !password) {
            await showMessage(
                "Enter a password of at least 8 characters.",
                "warning",
                "Password Required"
            );
            return;
        }

        const isEditing = Boolean(editingUsername);

        const confirmed = await confirmAction(
            isEditing
                ? "Save these account changes?"
                : "Add this new person?"
        );

        if (!confirmed) return;

        isSaving = true;

        const submitButton =
            personForm.querySelector('button[type="submit"]');

        if (submitButton) {
            submitButton.disabled = true;
        }

        try {
            if (isEditing) {
                const oldUsername = editingUsername;
                const payload = {
                    name: name,
                    username: username
                };

                // A blank password means keep the existing password.
                if (password) {
                    payload.password = password;
                }

                await apiRequest(
                    "/api/people/" + encodeURIComponent(oldUsername),
                    {
                        method: "PUT",
                        body: JSON.stringify(payload)
                    }
                );

                // The current token contains the old username.
                // Log in again after changing the current admin username.
                if (
                    oldUsername ===
                        (localStorage.getItem("loggedInUser") || "")
                            .trim().toLowerCase() &&
                    username !== oldUsername
                ) {
                    localStorage.removeItem("authToken");
                    localStorage.removeItem("loggedInUser");
                    localStorage.removeItem("userRole");
                    localStorage.removeItem("personName");

                    window.location.href = "../index.html";
                    return;
                }

                closePersonModal();

                await showMessage(
                    "Account updated successfully.",
                    "success",
                    "Changes Saved"
                );

            } else {
                await apiRequest("/api/people", {
                    method: "POST",
                    body: JSON.stringify({
                        name: name,
                        username: username,
                        password: password
                    })
                });

                closePersonModal();

                await showMessage(
                    "Person added successfully.",
                    "success",
                    "Person Added"
                );
            }

            await loadPeople();

        } catch (error) {
            console.error("Saving account failed:", error);

            await showMessage(
                error.message || "Unable to save account changes.",
                "error",
                "Save Failed"
            );

        } finally {
            isSaving = false;

            if (submitButton) {
                submitButton.disabled = false;
            }
        }
    });
}

// ========================================
// ENABLE / DISABLE
// ========================================


async function togglePerson(username) {
    const person = people.find(p => p.username === username);

    if (!person) {
        await showMessage("Account not found.", "error", "Error");
        return;
    }

    if (person.role === "admin") {
        await showMessage(
            "The admin account cannot be disabled.",
            "warning",
            "Action Not Allowed"
        );
        return;
    }

    const newEnabled = !person.active;

    const confirmed = await confirmAction(
        newEnabled
            ? `Enable ${person.name}'s account?`
            : `Disable ${person.name}'s account?`
    );

    if (!confirmed) return;

    try {
        await apiRequest(
            `/api/people/${encodeURIComponent(username)}/status`,
            {
                method: "PATCH",
                body: JSON.stringify({ enabled: newEnabled })
            }
        );

        await showMessage(
            newEnabled
                ? "Account enabled successfully."
                : "Account disabled successfully.",
            "success",
            "Account Updated"
        );

        await loadPeople();

    } catch (error) {
        console.error("Updating account status failed:", error);

        await showMessage(
            error.message || "Unable to update account status.",
            "error",
            "Update Failed"
        );
    }
}

window.togglePerson = togglePerson;


async function deletePerson(username) {
    const person = people.find(p => p.username === username);

    if (!person) {
        await showMessage(
            "Person not found.",
            "error",
            "Delete Failed"
        );
        return;
    }

    if (person.role === "admin") {
        await showMessage(
            "The admin account cannot be deleted.",
            "warning",
            "Action Not Allowed"
        );
        return;
    }

    const confirmed = await confirmAction(
        `Permanently delete ${person.name} (${username})? ` +
        "Deletion is allowed only if the account has no historical records."
    );

    if (!confirmed) return;

    try {
        await apiRequest(
            `/api/people/${encodeURIComponent(username)}`,
            { method: "DELETE" }
        );

        await showMessage(
            `${person.name}'s account was deleted successfully.`,
            "success",
            "Account Deleted"
        );

        await loadPeople();

    } catch (error) {
        console.error("Deleting account failed:", error);

        await showMessage(
            error.message ||
            "This account may have historical records. Disable it instead.",
            "warning",
            "Cannot Delete Account"
        );
    }
}

window.deletePerson = deletePerson;

// ========================================
// ESCAPE ATTRIBUTE
// ========================================

function escapeAttribute(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

// ========================================
// CLOSE MODAL WHEN CLICKING OUTSIDE
// ========================================

if (personModal) {
    personModal.addEventListener("click", function (event) {
        if (event.target === personModal) {
            closePersonModal();
        }
    });
}

// ========================================
// INITIAL LOAD
// ========================================

if (role === "admin" && token) {
    loadPeople();
}
