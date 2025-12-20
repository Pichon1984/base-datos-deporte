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
const carritoRoutes = require("../routes/carrito"); // 👈 confirmar nombre real
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
    this.app.use(
      cors({
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        credentials: true,
      })
    );

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



