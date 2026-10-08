// ========================================
// PEOPLE MANAGEMENT
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

const peopleGrid =
    document.getElementById("peopleGrid");

const peopleCountText =
    document.getElementById(
        "peopleCountText"
    );

const personModal =
    document.getElementById("personModal");

const personForm =
    document.getElementById("personForm");

const modalTitle =
    document.getElementById("modalTitle");

const personName =
    document.getElementById("personName");

const personUsername =
    document.getElementById(
        "personUsername"
    );

const personPassword =
    document.getElementById(
        "personPassword"
    );


// ----------------------------------------
// INITIAL PEOPLE
// ----------------------------------------

const defaultPeople = [

    {
        name: "Vetrivel",
        username: "vetri",
        password: "1234",
        role: "person",
        active: true
    },

    {
        name: "Nitheen",
        username: "nitheen",
        password: "1234",
        role: "person",
        active: true
    },

    {
        name: "Yaswanth",
        username: "yash",
        password: "1234",
        role: "person",
        active: true
    },

    {
        name: "Dharshini",
        username: "dharshu",
        password: "1234",
        role: "person",
        active: true
    },

    {
        name: "ManojKumar",
        username: "mano",
        password: "1234",
        role: "person",
        active: true
    }

];


// ----------------------------------------
// LOAD PEOPLE
// ----------------------------------------

let people =
    JSON.parse(
        localStorage.getItem("people")
    );


if (!Array.isArray(people)) {

    people = defaultPeople;

    savePeople();

}


// ----------------------------------------
// EDITING USERNAME
// ----------------------------------------

let editingUsername = null;


// ----------------------------------------
// SAVE
// ----------------------------------------

function savePeople() {

    localStorage.setItem(
        "people",
        JSON.stringify(people)
    );

}


// ----------------------------------------
// RENDER
// ----------------------------------------

function renderPeople() {

    peopleGrid.innerHTML = "";


    peopleCountText.textContent =
        `${people.length} ${
            people.length === 1
                ? "person"
                : "people"
        }`;


    if (people.length === 0) {

        peopleGrid.innerHTML = `

            <div class="empty-state">

                <h3>
                    No people found
                </h3>

                <p>
                    Add a person to get started.
                </p>

            </div>

        `;

        return;

    }


    people.forEach(
        function (person) {

            peopleGrid.appendChild(
                createPersonCard(person)
            );

        }
    );

}


// ----------------------------------------
// PERSON CARD
// ----------------------------------------

function createPersonCard(person) {

    const card =
        document.createElement("div");

    card.className =
        "person-card";


    const statusClass =
        person.active
            ? "active"
            : "inactive";


    const statusText =
        person.active
            ? "Active"
            : "Inactive";


    card.innerHTML = `

        <div class="person-top">

            <div class="person-avatar">
                👤
            </div>


            <div>

                <h2 class="person-name">
                    ${escapeHTML(person.name)}
                </h2>

                <div class="person-role">
                    Person
                </div>

            </div>

        </div>


        <div class="person-details">

            <div class="detail-row">

                <span class="detail-label">
                    Username
                </span>

                <span class="detail-value">
                    ${escapeHTML(person.username)}
                </span>

            </div>


            <div class="detail-row">

                <span class="detail-label">
                    Role
                </span>

                <span class="detail-value">
                    Person
                </span>

            </div>


            <div class="detail-row">

                <span class="detail-label">
                    Account
                </span>

                <span class="detail-value">

                    <span
                        class="account-status ${statusClass}"
                    >
                        ${statusText}
                    </span>

                </span>

            </div>

        </div>


        <div class="person-actions">

            <button
                type="button"
                class="person-action-btn edit-person"
                onclick="editPerson('${escapeAttribute(person.username)}')"
            >
                ✏️ Edit
            </button>


            <button
                type="button"
                class="person-action-btn toggle-person"
                onclick="togglePerson('${escapeAttribute(person.username)}')"
            >
                ${
                    person.active
                        ? "🔒 Disable"
                        : "🔓 Enable"
                }
            </button>

        </div>

    `;


    return card;

}


// ----------------------------------------
// ADD PERSON
// ----------------------------------------

function openAddPersonModal() {

    editingUsername = null;

    modalTitle.textContent =
        "Add Person";

    personForm.reset();

    personPassword.required = true;

    personModal.classList.add("show");

}


// ----------------------------------------
// EDIT PERSON
// ----------------------------------------

function editPerson(username) {

    const person =
        people.find(
            function (item) {

                return item.username === username;

            }
        );


    if (!person) {

        return;

    }


    editingUsername =
        username;


    modalTitle.textContent =
        "Edit Person";


    personName.value =
        person.name;


    personUsername.value =
        person.username;


    personPassword.value =
        "";


    personPassword.required = false;


    personModal.classList.add("show");

}


// ----------------------------------------
// CLOSE MODAL
// ----------------------------------------

function closePersonModal() {

    personModal.classList.remove(
        "show"
    );

    editingUsername = null;

    personForm.reset();

}


// ----------------------------------------
// SUBMIT FORM
// ----------------------------------------

personForm.addEventListener(
    "submit",
    function (event) {

        event.preventDefault();


        const name =
            personName.value.trim();


        const username =
            personUsername.value.trim();


        const password =
            personPassword.value;


        if (!name || !username) {

            alert(
                "Please enter name and username."
            );

            return;

        }


        // --------------------------------
        // ADD
        // --------------------------------

        if (!editingUsername) {

            const exists =
                people.some(
                    function (person) {

                        return (
                            person.username
                                .toLowerCase() ===
                            username.toLowerCase()
                        );

                    }
                );


            if (exists) {

                alert(
                    "This username already exists."
                );

                return;

            }


            if (!password) {

                alert(
                    "Please enter a password."
                );

                return;

            }


            people.push({

                name: name,

                username: username,

                password: password,

                role: "person",

                active: true

            });

        }


        // --------------------------------
        // EDIT
        // --------------------------------

        else {

            const person =
                people.find(
                    function (item) {

                        return (
                            item.username ===
                            editingUsername
                        );

                    }
                );


            if (!person) {

                alert(
                    "Person not found."
                );

                return;

            }


            // Prevent duplicate username

            const duplicate =
                people.some(
                    function (item) {

                        return (
                            item.username
                                .toLowerCase() ===
                            username.toLowerCase() &&
                            item.username !==
                            editingUsername
                        );

                    }
                );


            if (duplicate) {

                alert(
                    "This username is already used."
                );

                return;

            }


            person.name =
                name;


            person.username =
                username;


            if (password) {

                person.password =
                    password;

            }

        }


        savePeople();


        closePersonModal();


        renderPeople();


        alert(
            editingUsername
                ? "Person updated successfully."
                : "Person added successfully."
        );

    }
);


// ----------------------------------------
// ENABLE / DISABLE
// ----------------------------------------

function togglePerson(username) {

    const person =
        people.find(
            function (item) {

                return item.username === username;

            }
        );


    if (!person) {

        return;

    }


    const action =
        person.active
            ? "disable"
            : "enable";


    const confirmed =
        confirm(
            `Are you sure you want to ${action} ${person.name}'s account?`
        );


    if (!confirmed) {

        return;

    }


    person.active =
        !person.active;


    savePeople();


    renderPeople();

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
// ESCAPE ATTRIBUTE
// ----------------------------------------

function escapeAttribute(value) {

    return String(value)
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'");
}


// ----------------------------------------
// CLOSE MODAL WHEN CLICKING OUTSIDE
// ----------------------------------------

personModal.addEventListener(
    "click",
    function (event) {

        if (
            event.target ===
            personModal
        ) {

            closePersonModal();

        }

    }
);


// ----------------------------------------
// INITIAL LOAD
// ----------------------------------------

renderPeople();