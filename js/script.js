
const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", function (event) {

    event.preventDefault();

    const username =
        document.getElementById("username").value.trim();

    const password =
        document.getElementById("password").value.trim();

    const message =
        document.getElementById("loginMessage");


    // Demo user accounts

    const users = {

        admin: {
            password: "admin123",
            role: "admin"
        },

        vetri: {
            password: "1234",
            role: "person",
            name: "Vetrivel"
        },

        nitheen: {
            password: "1234",
            role: "person",
            name: "Nitheen"
        },

        yash: {
            password: "1234",
            role: "person",
            name: "Yaswanth"
        },

        dharshu: {
            password: "1234",
            role: "person",
            name: "Dharshini"
        },

        mano: {
            password: "1234",
            role: "person",
            name: "ManojKumar"
        }

    };


    // Check username

    const user = users[username];


    if (!user) {

        message.textContent =
            "Username not found.";

        message.style.color = "red";

        return;
    }


    // Check password

    if (user.password !== password) {

        message.textContent =
            "Incorrect password.";

        message.style.color = "red";

        return;
    }


    // Store logged-in user

    localStorage.setItem("loggedInUser", username);
    localStorage.setItem("userRole", user.role);


    // Automatically detect role

    if (user.role === "admin") {

        window.location.href =
            "pages/admin-dashboard.html";

    } else {

        localStorage.setItem(
            "personName",
            user.name
        );

        window.location.href =
            "pages/person-dashboard.html";
    }

});