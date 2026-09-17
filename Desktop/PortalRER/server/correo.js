const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

// Mientras no verifiques tu propio dominio en Resend, usa este remitente de pruebas.
// Una vez verifiques tu dominio, cámbialo por algo como: `Portal RER <noreply@tudominio.com>`
const REMITENTE = "Portal RER <onboarding@resend.dev>";

async function enviarCorreoVerificacion(destinatario, nombre, token) {

    const link = `${process.env.APP_URL}/verify.html?token=${token}`;

    const { data, error } = await resend.emails.send({

        from: REMITENTE,

        to: destinatario,

        subject: "Verifica tu cuenta - Portal RER",

        html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">

                <h2>Bienvenido a Portal RER, ${nombre}</h2>

                <p>Confirma tu correo para activar tu cuenta:</p>

                <p style="margin: 24px 0;">
                    <a href="${link}"
                       style="background:#3a3b40; color:#fff; padding:12px 24px; border-radius:6px; text-decoration:none; display:inline-block;">
                        Verificar mi cuenta
                    </a>
                </p>

                <p style="color:#888; font-size:13px;">
                    Si el botón no funciona, copia y pega este link en tu navegador:<br>
                    ${link}
                </p>

                <p style="color:#888; font-size:13px;">
                    Este link expira en 24 horas.
                </p>

            </div>
        `

    });

    if (error) {
        console.error("Error al enviar correo con Resend:", error);
        throw new Error("No se pudo enviar el correo de verificación: " + error.message);
    }

    console.log("Correo de verificación enviado, id:", data.id);

}

module.exports = { enviarCorreoVerificacion };
