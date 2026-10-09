
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
    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            Authorization: `Bearer ${token}`,
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...(options.headers || {})
        }
    });

    const data = await response.json().catch(() => ({}));

    if (response.status === 401 || response.status === 403) {
        if (data.error) {
            throw new Error(data.error);
        }

        localStorage.removeItem("authToken");
        localStorage.removeItem("loggedInUser");
        localStorage.removeItem("userRole");
        localStorage.removeItem("personName");

        window.location.href = "../index.html";
        throw new Error("Your session has expired. Please log in again.");
    }

    if (!response.ok) {
        throw new Error(data.error || "The request failed.");
    }

    return data;
}

// ========================================
// LOAD PEOPLE FROM CLOUDFLARE
// ========================================

async function loadPeople() {
    if (!peopleGrid) return;

    peopleGrid.innerHTML = `
        <div class="empty-state">
            <h3>Loading people...</h3>
        </div>
    `;

    try {
        const data = await apiRequest("/api/people");

        people = (Array.isArray(data) ? data : data.people || [])
            .map(function (person) {
                return {
                    name: person.name || person.username,
                    username: person.username,
                    role: person.role || "person",
                    active: person.enabled === true ||
                            person.enabled === 1
                };
            });

        renderPeople();
    } catch (error) {
        console.error("Loading people failed:", error);

        peopleGrid.innerHTML = `
            <div class="empty-state">
                <h3>Unable to load people</h3>
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
// RENDER PEOPLE
// ========================================

function renderPeople() {
    if (!peopleGrid) return;

    peopleGrid.innerHTML = "";

    if (peopleCountText) {
        peopleCountText.textContent =
            `${people.length} ${people.length === 1 ? "person" : "people"}`;
    }

    if (people.length === 0) {
        peopleGrid.innerHTML = `
            <div class="empty-state">
                <h3>No people found</h3>
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
// PERSON CARD
// ========================================

function createPersonCard(person) {
    const card = document.createElement("div");
    card.className = "person-card";

    const statusClass = person.active ? "active" : "inactive";
    const statusText = person.active ? "Active" : "Inactive";

    card.innerHTML = `
        <div class="person-top">
            <div class="person-avatar">👤</div>

            <div>
                <h2 class="person-name">
                    ${escapeHTML(person.name)}
                </h2>

                <div class="person-role">Person</div>
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
                <span class="detail-value">Person</span>
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
                disabled
                title="Account enable/disable API is not available yet"
            >${person.active ? "🔒 Disable" : "🔓 Enable"}</button>
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
    }

    if (personPassword) {
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
// EDIT PERSON
// ========================================

function editPerson(username) {
    const person = people.find(function (item) {
        return item.username === username;
    });

    if (!person) {
        showMessage("Person not found.", "error", "Not Found");
        return;
    }

    editingUsername = username;

    if (modalTitle) {
        modalTitle.textContent = "Edit Person";
    }

    if (personName) {
        personName.value = person.name;
    }

    if (personUsername) {
        personUsername.value = person.username;
        personUsername.disabled = true;
    }

    if (personPassword) {
        personPassword.value = "";
        personPassword.required = false;
        personPassword.placeholder =
            "Editing is not available through the current API";
        personPassword.disabled = true;
    }

    if (personModal) {
        personModal.classList.add("show");
    }

    showMessage(
        "The current API supports adding people, but does not support editing existing accounts yet.",
        "info",
        "Editing Unavailable"
    );
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
    }

    if (personPassword) {
        personPassword.disabled = false;
        personPassword.required = true;
        personPassword.placeholder = "At least 8 characters";
    }
}

window.closePersonModal = closePersonModal;

// ========================================
// SUBMIT FORM - ADD PERSON
// ========================================

if (personForm) {
    personForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        if (isSaving) return;

        const name = personName.value.trim();
        const username = personUsername.value.trim().toLowerCase();
        const password = personPassword.value;

        if (editingUsername) {
            await showMessage(
                "Editing existing accounts is not supported by the current API. No changes were saved.",
                "warning",
                "Editing Unavailable"
            );
            return;
        }

        if (!name || !username || !password) {
            await showMessage(
                "Please enter the person's name, username and password.",
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

        if (password.length < 8) {
            await showMessage(
                "Password must be at least 8 characters long.",
                "warning",
                "Password Too Short"
            );
            return;
        }

        const duplicate = people.some(function (person) {
            return person.username.toLowerCase() === username;
        });

        if (duplicate) {
            await showMessage(
                "This username already exists.",
                "error",
                "Duplicate Username"
            );
            return;
        }

        isSaving = true;

        const submitButton =
            personForm.querySelector('button[type="submit"]');

        if (submitButton) {
            submitButton.disabled = true;
        }

        try {
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

            await loadPeople();
        } catch (error) {
            console.error("Adding person failed:", error);

            await showMessage(
                error.message || "Unable to add person.",
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
    await showMessage(
        "Enable/disable functionality is not available in the current Cloudflare Worker API. No changes were made.",
        "info",
        "Feature Not Available"
    );
}

window.togglePerson = togglePerson;

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
