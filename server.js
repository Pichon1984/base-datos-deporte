require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");

// Importar rutas
const authRoutes = require("./routes/auth");
const usuariosRoutes = require("./routes/usuarios");
const productosRoutes = require("./routes/productos");
const categoriasRoutes = require("./routes/categorias");
const ordenesRoutes = require("./routes/ordenes");
const carritoRoutes = require("./routes/carrito");
const consultasRoutes = require("./routes/consultas");
const cuotasRoutes = require("./routes/cuotas");
const enviosRoutes = require("./routes/envios");
const comprasRoutes = require("./routes/compras");
const pagosRoutes = require("./routes/pagos");

const app = express();

// Middlewares
const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL || "https://react-deporte.netlify.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn("❌ CORS bloqueado para:", origin);
        callback(new Error("No permitido por CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(morgan("dev"));

if (process.env.NODE_ENV !== "production") {
  const logDir = path.join(__dirname, "../logs");
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }
  const accessLogStream = fs.createWriteStream(path.join(logDir, "access.log"), {
    flags: "a",
  });
  app.use(morgan("combined", { stream: accessLogStream }));
}

app.use(express.static("public"));

// Rutas
app.get("/", (req, res) => {
  res.send("Servidor funcionando 🚀");
});

app.get("/api/test", (req, res) => {
  res.json({
    ok: true,
    mensaje: "MongoDB conectado y backend funcionando en Vercel 🚀",
  });
});

// 🔑 Ruta de diagnóstico para validar conexión y colecciones
app.get("/api/test-db", async (req, res) => {
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    const nombres = collections.map(c => c.name);

    res.json({
      ok: true,
      baseDeDatos: mongoose.connection.db.databaseName,
      colecciones: nombres
    });
  } catch (err) {
    console.error("❌ Error al listar colecciones:", err);
    res.status(500).json({ ok: false, error: "No se pudo listar colecciones" });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/productos", productosRoutes);
app.use("/api/categorias", categoriasRoutes);
app.use("/api/ordenes", ordenesRoutes);
app.use("/api/carrito", carritoRoutes);
app.use("/api/consultas", consultasRoutes);
app.use("/api/cuotas", cuotasRoutes);
app.use("/api/envios", enviosRoutes);
app.use("/api/compras", comprasRoutes);
app.use("/api/pagos", pagosRoutes);

// Conexión a MongoDB
mongoose
  .connect(process.env.MONGODB_CNN)
  .then(() => console.log("✅ Conectado a MongoDB Atlas"))
  .catch((err) => {
    console.error("❌ Error al conectar a MongoDB:", err);
    process.exit(1);
  });

// Exportar app (sin listen, Vercel maneja el servidor)
module.exports = app;
