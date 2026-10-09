
// ========================================
// PROFESSIONAL NOTIFICATION SYSTEM
// ========================================

// Track the currently open dialogs.
let activeAlertClose = null;
let activeConfirmClose = null;

// ========================================
// ALERT MODAL
// ========================================

function showAlert(message, type = "success", title = "") {
    return new Promise(function (resolve) {
        // Close an existing alert first.
        if (typeof activeAlertClose === "function") {
            activeAlertClose();
        }

        // Default titles.
        const titles = {
            success: "Success",
            error: "Error",
            warning: "Warning",
            info: "Information"
        };

        // Icons.
        const icons = {
            success: "✓",
            error: "!",
            warning: "⚠",
            info: "i"
        };

        const finalTitle = title || titles[type] || "Message";
        const icon = icons[type] || "i";

        const overlay = document.createElement("div");
        overlay.id = "appAlertOverlay";
        overlay.className = "app-alert-overlay";

        overlay.innerHTML = `
            <div
                class="app-alert-modal"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="appAlertTitle"
                aria-describedby="appAlertMessage"
            >
                <button
                    type="button"
                    class="app-alert-close"
                    id="appAlertClose"
                    aria-label="Close"
                >×</button>

                <div class="app-alert-icon ${escapeNotificationHTML(type)}">
                    ${icon}
                </div>

                <h3 id="appAlertTitle">
                    ${escapeNotificationHTML(finalTitle)}
                </h3>

                <p id="appAlertMessage">
                    ${escapeNotificationHTML(message)}
                </p>

                <button
                    type="button"
                    class="app-alert-button ${escapeNotificationHTML(type)}"
                    id="appAlertOk"
                >OK</button>
            </div>
        `;

        document.body.appendChild(overlay);

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        let finished = false;

        function closeAlert() {
            if (finished) return;

            finished = true;

            document.removeEventListener("keydown", escHandler);

            if (overlay.isConnected) {
                overlay.remove();
            }

            document.body.style.overflow = previousOverflow;

            if (activeAlertClose === closeAlert) {
                activeAlertClose = null;
            }

            resolve();
        }

        function escHandler(event) {
            if (event.key === "Escape") {
                closeAlert();
            }
        }

        activeAlertClose = closeAlert;

        overlay.querySelector("#appAlertOk")
            .addEventListener("click", closeAlert);

        overlay.querySelector("#appAlertClose")
            .addEventListener("click", closeAlert);

        overlay.addEventListener("click", function (event) {
            if (event.target === overlay) {
                closeAlert();
            }
        });

        document.addEventListener("keydown", escHandler);

        overlay.querySelector("#appAlertOk").focus();
    });
}

// ========================================
// CONFIRMATION MODAL
// ========================================

function showConfirm(
    message,
    title = "Confirm Action",
    confirmText = "Confirm",
    cancelText = "Cancel"
) {
    return new Promise(function (resolve) {
        // Close an existing confirmation first.
        if (typeof activeConfirmClose === "function") {
            activeConfirmClose(false);
        }

        const overlay = document.createElement("div");
        overlay.id = "appConfirmOverlay";
        overlay.className = "app-alert-overlay";

        overlay.innerHTML = `
            <div
                class="app-alert-modal"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="appConfirmTitle"
                aria-describedby="appConfirmMessage"
            >
                <button
                    type="button"
                    class="app-alert-close"
                    id="appConfirmClose"
                    aria-label="Cancel"
                >×</button>

                <div class="app-alert-icon warning">?</div>

                <h3 id="appConfirmTitle">
                    ${escapeNotificationHTML(title)}
                </h3>

                <p id="appConfirmMessage">
                    ${escapeNotificationHTML(message)}
                </p>

                <div class="app-confirm-buttons">
                    <button
                        type="button"
                        class="app-confirm-cancel"
                        id="appConfirmCancel"
                    >
                        ${escapeNotificationHTML(cancelText)}
                    </button>

                    <button
                        type="button"
                        class="app-confirm-ok"
                        id="appConfirmOk"
                    >
                        ${escapeNotificationHTML(confirmText)}
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        let finished = false;

        function finish(value) {
            if (finished) return;

            finished = true;

            document.removeEventListener("keydown", escHandler);

            if (overlay.isConnected) {
                overlay.remove();
            }

            document.body.style.overflow = previousOverflow;

            if (activeConfirmClose === finish) {
                activeConfirmClose = null;
            }

            resolve(value);
        }

        function escHandler(event) {
            if (event.key === "Escape") {
                finish(false);
            }
        }

        activeConfirmClose = finish;

        overlay.querySelector("#appConfirmOk")
            .addEventListener("click", function () {
                finish(true);
            });

        overlay.querySelector("#appConfirmCancel")
            .addEventListener("click", function () {
                finish(false);
            });

        overlay.querySelector("#appConfirmClose")
            .addEventListener("click", function () {
                finish(false);
            });

        overlay.addEventListener("click", function (event) {
            if (event.target === overlay) {
                finish(false);
            }
        });

        document.addEventListener("keydown", escHandler);

        overlay.querySelector("#appConfirmOk").focus();
    });
}

// ========================================
// HTML ESCAPE
// ========================================

function escapeNotificationHTML(value) {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
}

// ========================================
// GLOBAL ACCESS
// ========================================

// Keep these functions available to other JavaScript files.
window.showAlert = showAlert;
window.showConfirm = showConfirm;
window.escapeNotificationHTML = escapeNotificationHTML;
