// ========================================
// PROFESSIONAL NOTIFICATION SYSTEM
// ========================================

function showAlert(message, type = "success", title = "") {

    return new Promise(function (resolve) {

        // Remove existing modal
        const existing =
            document.getElementById("appAlertOverlay");

        if (existing) {
            existing.remove();
        }


        // Default titles
        const titles = {
            success: "Success",
            error: "Error",
            warning: "Warning",
            info: "Information"
        };


        // Icons
        const icons = {
            success: "✓",
            error: "!",
            warning: "⚠",
            info: "i"
        };


        const finalTitle =
            title || titles[type] || "Message";

        const icon =
            icons[type] || "i";


        // Create modal
        const overlay =
            document.createElement("div");

        overlay.id =
            "appAlertOverlay";

        overlay.className =
            "app-alert-overlay";


        overlay.innerHTML = `

            <div
                class="app-alert-modal"
                role="dialog"
                aria-modal="true"
            >

                <button
                    type="button"
                    class="app-alert-close"
                    id="appAlertClose"
                    aria-label="Close"
                >
                    ×
                </button>


                <div
                    class="app-alert-icon ${type}"
                >
                    ${icon}
                </div>


                <h3>
                    ${escapeNotificationHTML(
                        finalTitle
                    )}
                </h3>


                <p>
                    ${escapeNotificationHTML(
                        message
                    )}
                </p>


                <button
                    type="button"
                    class="app-alert-button ${type}"
                    id="appAlertOk"
                >
                    OK
                </button>

            </div>

        `;


        document.body.appendChild(
            overlay
        );


        // Prevent background scrolling
        document.body.style.overflow =
            "hidden";


        const closeAlert =
            function () {

                overlay.remove();

                document.body.style.overflow =
                    "";

                resolve();

            };


        document
            .getElementById("appAlertOk")
            .addEventListener(
                "click",
                closeAlert
            );


        document
            .getElementById("appAlertClose")
            .addEventListener(
                "click",
                closeAlert
            );


        // Click outside
        overlay.addEventListener(
            "click",
            function (event) {

                if (
                    event.target === overlay
                ) {

                    closeAlert();

                }

            }
        );


        // ESC key
        document.addEventListener(
            "keydown",
            function escHandler(event) {

                if (event.key === "Escape") {

                    document.removeEventListener(
                        "keydown",
                        escHandler
                    );

                    closeAlert();

                }

            }
        );


        // Focus OK button
        setTimeout(function () {

            const okButton =
                document.getElementById(
                    "appAlertOk"
                );

            if (okButton) {
                okButton.focus();
            }

        }, 50);

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

        const existing =
            document.getElementById(
                "appConfirmOverlay"
            );

        if (existing) {
            existing.remove();
        }


        const overlay =
            document.createElement("div");

        overlay.id =
            "appConfirmOverlay";

        overlay.className =
            "app-alert-overlay";


        overlay.innerHTML = `

            <div
                class="app-alert-modal"
                role="dialog"
                aria-modal="true"
            >

                <button
                    type="button"
                    class="app-alert-close"
                    id="appConfirmClose"
                >
                    ×
                </button>


                <div class="app-alert-icon warning">
                    ?
                </div>


                <h3>
                    ${escapeNotificationHTML(
                        title
                    )}
                </h3>


                <p>
                    ${escapeNotificationHTML(
                        message
                    )}
                </p>


                <div class="app-confirm-buttons">

                    <button
                        type="button"
                        class="app-confirm-cancel"
                        id="appConfirmCancel"
                    >
                        ${escapeNotificationHTML(
                            cancelText
                        )}
                    </button>


                    <button
                        type="button"
                        class="app-confirm-ok"
                        id="appConfirmOk"
                    >
                        ${escapeNotificationHTML(
                            confirmText
                        )}
                    </button>

                </div>

            </div>

        `;


        document.body.appendChild(
            overlay
        );


        document.body.style.overflow =
            "hidden";


        function finish(value) {

            overlay.remove();

            document.body.style.overflow =
                "";

            resolve(value);

        }


        document
            .getElementById(
                "appConfirmOk"
            )
            .addEventListener(
                "click",
                function () {

                    finish(true);

                }
            );


        document
            .getElementById(
                "appConfirmCancel"
            )
            .addEventListener(
                "click",
                function () {

                    finish(false);

                }
            );


        document
            .getElementById(
                "appConfirmClose"
            )
            .addEventListener(
                "click",
                function () {

                    finish(false);

                }
            );


        overlay.addEventListener(
            "click",
            function (event) {

                if (
                    event.target === overlay
                ) {

                    finish(false);

                }

            }
        );

    });
}


// ========================================
// HTML ESCAPE
// ========================================

function escapeNotificationHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value ?? "";

    return div.innerHTML;
}