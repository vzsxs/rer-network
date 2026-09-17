document
.getElementById("loginForm")
.addEventListener("submit", async (e) => {

    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const mensaje = document.getElementById("mensaje");

    try {

        const respuesta = await fetch("/api/auth/login", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({ email, password })

        });

        const data = await respuesta.json();

        if (data.error) {

            mensaje.innerHTML = "";
            mensaje.textContent = data.error;

            // Si el error es por no verificar el correo, ofrecemos reenviarlo

            if (data.sinVerificar) {

                const reenviarBtn = document.createElement("button");

                reenviarBtn.type = "button";
                reenviarBtn.className = "btn-reenviar";
                reenviarBtn.textContent = "Reenviar correo de verificación";

                reenviarBtn.addEventListener("click", async () => {

                    reenviarBtn.disabled = true;
                    reenviarBtn.textContent = "Enviando...";

                    try {

                        const r = await fetch("/api/auth/resend-verification", {

                            method: "POST",

                            headers: { "Content-Type": "application/json" },

                            body: JSON.stringify({ email })

                        });

                        const d = await r.json();

                        mensaje.textContent = d.message || d.error;

                    } catch (err) {

                        mensaje.textContent = "Error reenviando el correo.";

                    } finally {

                        reenviarBtn.disabled = false;
                        reenviarBtn.textContent = "Reenviar correo de verificación";

                    }

                });

                mensaje.appendChild(document.createElement("br"));
                mensaje.appendChild(reenviarBtn);

            }

            return;

        }

        localStorage.setItem("token", data.token);
        localStorage.setItem("usuarioID", data.usuario.id);
        localStorage.setItem("usuarioNombre", data.usuario.nombre);
        localStorage.setItem("usuarioEmail", data.usuario.email);
        localStorage.setItem("usuarioRol", data.usuario.rol);

        mensaje.textContent = "Inicio de sesión correcto ✅";

        setTimeout(() => {
            window.location.href = "/dashboard.html";
        }, 1000);

    } catch (error) {

        console.error("Error login:", error);
        mensaje.textContent = "Error conectando con el servidor";

    }

});
