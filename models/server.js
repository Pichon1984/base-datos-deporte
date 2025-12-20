const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");

// Importar todas las rutas
const authRoutes = require("../routes/auth");
const usuariosRoutes = require("../routes/usuarios");
const productosRoutes = require("../routes/productos");
const categoriasRoutes = require("../routes/categorias");
const ordenesRoutes = require("../routes/ordenes");
const carritoRoutes = require("../routes/carrito");
const consultasRoutes = require("../routes/consultas");
const cuotasRoutes = require("../routes/cuotas");
const enviosRoutes = require("../routes/envios");
const comprasRoutes = require("../routes/compras");
const pagosRoutes = require("../routes/pagos");

class Server {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;

    // Middlewares
    this.middlewares();

    // Rutas
    this.routes();
  }

  middlewares() {
    const allowedOrigins = [
      "http://localhost:5173",
      process.env.FRONTEND_URL || "https://react-deporte.netlify.app"
    ];

    const corsOptions = {
      origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
    };

    // ✅ CORS
    this.app.use(cors(corsOptions));

    // ✅ Manejo explícito de preflight OPTIONS
    this.app.use((req, res, next) => {
      res.header("Access-Control-Allow-Origin", process.env.FRONTEND_URL || "https://react-deporte.netlify.app");
      res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
      res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
      if (req.method === "OPTIONS") {
        return res.sendStatus(200);
      }
      next();
    });

    this.app.use(express.json());
    this.app.use(morgan("dev"));

    // Logs locales (no se usan en Vercel)
    if (process.env.NODE_ENV !== "production") {
      const logDir = path.join(__dirname, "../logs");
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir);
      }
      const accessLogStream = fs.createWriteStream(
        path.join(logDir, "access.log"),
        { flags: "a" }
      );
      this.app.use(morgan("combined", { stream: accessLogStream }));
    }

    this.app.use(express.static("public"));
  }

  routes() {
    this.app.use("/api/auth", authRoutes);
    this.app.use("/api/usuarios", usuariosRoutes);
    this.app.use("/api/productos", productosRoutes);
    this.app.use("/api/categorias", categoriasRoutes);
    this.app.use("/api/ordenes", ordenesRoutes);
    this.app.use("/api/carrito", carritoRoutes);
    this.app.use("/api/consultas", consultasRoutes);
    this.app.use("/api/cuotas", cuotasRoutes);
    this.app.use("/api/envios", enviosRoutes);
    this.app.use("/api/compras", comprasRoutes);
    this.app.use("/api/pagos", pagosRoutes);
  }

  listen() {
    this.app.listen(this.port, () => {
      console.log("🚀 Servidor corriendo en puerto", this.port);
    });
  }
}

module.exports = Server;

