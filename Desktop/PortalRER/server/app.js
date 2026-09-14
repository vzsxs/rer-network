require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const supabase = require("./config/supabase");

// ===========================
// RUTAS
// ===========================

const authRoutes = require("./routes/auth");
const groupsRoutes = require("./routes/groups");
const requestsRoutes = require("./routes/requests");
const adminRoutes = require("./routes/admin");
const robloxRoutes = require("./routes/roblox");

const app = express();

/* ===========================
   MIDDLEWARES
=========================== */

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));

app.use(express.static(
    path.join(__dirname, "../client")
));

/* ===========================
   PAGINA PRINCIPAL
=========================== */

app.get("/", (req, res) => {

    res.sendFile(
        path.join(__dirname, "../client/index.html")
    );

});

/* ===========================
   TEST SUPABASE
=========================== */

app.get("/test-db", async (req, res) => {

    try {

        const { data, error } = await supabase
            .from("users")
            .select("*");

        if (error) {

            return res.status(500).json({
                error: error.message
            });

        }

        res.json(data);

    } catch (error) {

        res.status(500).json({
            error: error.message
        });

    }

});

/* ===========================
   API ROUTES
=========================== */

app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/groups",
    groupsRoutes
);

app.use(
    "/api/requests",
    requestsRoutes
);

app.use(
    "/api/admin",
    adminRoutes
);

app.use(
    "/api/roblox",
    robloxRoutes
);

/* ===========================
   ERROR 404
=========================== */

app.use((req, res) => {

    if (req.originalUrl.startsWith("/api/")) {

        return res.status(404).json({
            error: "Ruta API no encontrada"
        });

    }

    res.status(404).sendFile(

        path.join(
            __dirname,
            "../client/index.html"
        )

    );

});

/* ===========================
   SERVIDOR
=========================== */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log("--------------------------------");

    console.log("🚀 Portal RER iniciado");

    console.log(`🌐 Puerto: ${PORT}`);

    console.log("--------------------------------");

});