const dotenv = require("dotenv");
// En producción (Vercel) basta con dotenv.config() y variables definidas en el dashboard
dotenv.config({ path: ".env.development" });

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

// --- Middlewares ---
const allowedOrigins = [
  "http://localhost:5173",              // frontend local (Vite)
  "https://react-deporte.netlify.app", // frontend en Netlify
  "https://base-datos-deporte.vercel.app" // frontend en Vercel
];

app.use(cors({
  origin: function (origin, callback) {
    // Permitir llamadas internas (sin origin) y tus frontends
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn("❌ Origen no permitido por CORS:", origin);
      callback(new Error("No permitido por CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-token"],
  credentials: true
}));

// Manejo explícito de preflight
app.options("*", cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json()); // 👈 importante para que req.body no sea undefined
app.use(morgan("dev"));

// Logs en desarrollo
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

// --- Rutas básicas ---
app.get("/", (req, res) => {
  res.send("Servidor funcionando 🚀");
});

app.get("/api/test", (req, res) => {
  res.json({
    ok: true,
    mensaje: "MongoDB conectado y backend funcionando 🚀",
  });
});

app.get("/api/test-db", async (req, res) => {
  try {
    if (!mongoose.connection.db) {
      return res.status(500).json({ ok: false, error: "No hay conexión activa a MongoDB" });
    }
    const collections = await mongoose.connection.db.listCollections().toArray();
    const nombres = collections.map((c) => c.name);
    res.json({
      ok: true,
      baseDeDatos: mongoose.connection.db.databaseName,
      colecciones: nombres,
    });
  } catch {
    res.status(500).json({ ok: false, error: "No se pudo listar colecciones" });
  }
});

// --- Rutas API ---
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

// --- Conexión a MongoDB ---
const mongoUri = process.env.MONGODB_CNN;
if (!mongoUri) {
  console.error("❌ No se encontró MONGODB_CNN en variables de entorno");
  process.exit(1);
}

mongoose
  .connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    if (process.env.NODE_ENV !== "production") {
      console.log("✅ Conectado a MongoDB");
    }
  })
  .catch((err) => {
    console.error("❌ Error al conectar a MongoDB:", err.message);
    process.exit(1);
  });

// Exportar app (sin listen, Vercel maneja el servidor)
module.exports = app;

// 👇 En local, levantar servidor automáticamente
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Servidor local en http://localhost:${PORT}`);
  });
}
