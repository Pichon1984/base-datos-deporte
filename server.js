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

class Server {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;

    this.middlewares();
    this.routes();
  }

  middlewares() {
    const allowedOrigins = [
      "http://localhost:5173",
      process.env.FRONTEND_URL || "https://react-deporte.netlify.app",
    ];

    this.app.use(
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

    this.app.use(express.json());
    this.app.use(morgan("dev"));

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
    this.app.get("/api/test", (req, res) => {
      res.json({
        ok: true,
        mensaje: "MongoDB conectado y backend funcionando en Vercel 🚀",
      });
    });

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
      console.log(`🚀 Servidor corriendo en puerto ${this.port}`);
    });
  }
}

// 🔑 Conexión a MongoDB y arranque del servidor
mongoose
  .connect(process.env.MONGODB_CNN, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ Conectado a MongoDB Atlas");
    const server = new Server();
    server.listen();
  })
  .catch((err) => {
    console.error("❌ Error al conectar a MongoDB:", err);
    process.exit(1);
  });

// Exportar app para Vercel
module.exports = new Server().app;

