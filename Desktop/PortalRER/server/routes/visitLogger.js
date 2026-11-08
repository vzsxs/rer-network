const supabase = require("../config/supabase");

// Una misma IP se registra como "visita" una sola vez cada 30 minutos,
// así una persona que navega por varias páginas no llena la tabla,
// y un bot que dispara miles de peticiones tampoco.

const VENTANA_MS = 30 * 60 * 1000;

// Cuántos días se conservan los registros antes de borrarse solos

const DIAS_A_CONSERVAR = 30;

const ultimaVisita = new Map();


async function registrar({ ip, tipo, ruta, userAgent, userId }) {

    try {

        const { error } = await supabase
            .from("visit_logs")
            .insert([{

                ip: ip || "desconocida",
                tipo: tipo || "visita",
                ruta: ruta ? String(ruta).slice(0, 200) : null,
                user_agent: userAgent ? String(userAgent).slice(0, 300) : null,
                user_id: userId || null

            }]);

        if (error) {
            console.error("❌ No se pudo guardar la visita:", error.message);
        }

    } catch (error) {

        console.error("❌ Error guardando la visita:", error.message);

    }

}


// Middleware: registra cuando alguien abre una PÁGINA (no archivos sueltos ni la API)

function registrarVisita(req, res, next) {

    if (req.method !== "GET") return next();

    const esPagina = req.path === "/" || req.path.endsWith(".html");

    if (!esPagina) return next();

    const ip = req.ip;
    const ahora = Date.now();
    const ultima = ultimaVisita.get(ip);

    if (!ultima || ahora - ultima > VENTANA_MS) {

        // Tope de seguridad por si llega un ataque con miles de IPs distintas

        if (ultimaVisita.size > 50000) {
            ultimaVisita.clear();
        }

        ultimaVisita.set(ip, ahora);

        // No hacemos "await": el registro no debe retrasar la página

        registrar({
            ip,
            tipo: "visita",
            ruta: req.path,
            userAgent: req.get("user-agent")
        });

    }

    next();

}


// Limpieza: borra registros más viejos que DIAS_A_CONSERVAR

async function borrarViejos() {

    try {

        const limite = new Date(
            Date.now() - DIAS_A_CONSERVAR * 24 * 60 * 60 * 1000
        ).toISOString();

        const { error } = await supabase
            .from("visit_logs")
            .delete()
            .lt("created_at", limite);

        if (error) {
            console.error("❌ No se pudo limpiar el registro de visitas:", error.message);
        }

    } catch (error) {

        console.error("❌ Error limpiando visitas:", error.message);

    }

}

setTimeout(borrarViejos, 60 * 1000).unref();
setInterval(borrarViejos, 24 * 60 * 60 * 1000).unref();


// Limpia del mapa las IPs que ya pasaron su ventana

setInterval(() => {

    const ahora = Date.now();

    for (const [ip, tiempo] of ultimaVisita) {
        if (ahora - tiempo > VENTANA_MS) {
            ultimaVisita.delete(ip);
        }
    }

}, 10 * 60 * 1000).unref();


module.exports = { registrar, registrarVisita };
