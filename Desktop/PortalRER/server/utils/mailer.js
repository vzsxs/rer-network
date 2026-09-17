const SibApiV3Sdk = require("@getbrevo/brevo");

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
apiInstance.setApiKey(
    SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey,
    process.env.BREVO_API_KEY
);

// Debe ser el mismo correo que verificaste como "remitente" en Brevo
// (Settings → Senders & IP → Senders)
const REMITENTE_EMAIL = process.env.EMAIL_USER; // ej: rerpages@gmail.com
const REMITENTE_NOMBRE = "Portal RER";

async function enviarCorreoVerificacion(destinatario, nombre, token) {

    const link = `${process.env.APP_URL}/verify.html?token=${token}`;

    const email = new SibApiV3Sdk.SendSmtpEmail();

    email.sender = { name: REMITENTE_NOMBRE, email: REMITENTE_EMAIL };
    email.to = [{ email: destinatario }];
    email.subject = "Verifica tu cuenta - Portal RER";
    email.htmlContent = `
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
    `;

    try {
        const data = await apiInstance.sendTransacEmail(email);
        console.log("Correo de verificación enviado, messageId:", data.body.messageId);
    } catch (error) {
        const detalle = error.response?.body || error.message;
        console.error("Error al enviar correo con Brevo:", detalle);
        throw new Error("No se pudo enviar el correo de verificación: " + JSON.stringify(detalle));
    }

}

module.exports = { enviarCorreoVerificacion };
