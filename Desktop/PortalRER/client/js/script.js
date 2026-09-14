document.addEventListener("DOMContentLoaded", () => {

    const loginBtn = document.getElementById("loginBtn");
    const registerBtn = document.getElementById("registerBtn");

    if (loginBtn) {

        loginBtn.addEventListener("click", () => {
            window.location.href = "login.html";
        });

    }

    if (registerBtn) {

        registerBtn.addEventListener("click", () => {
            window.location.href = "register.html";
        });

    }

});