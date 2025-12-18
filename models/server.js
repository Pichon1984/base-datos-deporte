const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");

// Importar rutas
const enviosRoutes = require("../routes/envios");
const comprasRoutes = require("../routes/compras"); 
const pagosRouter = require("../routes/pagos"); // 👈 corregido

class Server {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;

    // Rutas base
    this.paths = {
      auth: "/api/auth",
      usuarios: "/api/usuarios",
      productos: "/api/productos",
      categorias: "/api/categorias",
      ordenes: "/api/ordenes",
      carrito: "/api/carrito",
      consultas: "/api/consultas",
      cuotas: "/api/cuotas",
      envios: "/api/envios",
      compras: "/api/compras",
      pagos: "/api/pagos" // 👈 agregamos pagos en paths
    };

    // Middlewares
    this.middlewares();

    // Rutas
    this.routes();
  }

  middlewares() {
    this.app.use(
      cors({
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        credentials: true
      })
    );

    this.app.use(express.json());
    this.app.use(morgan("dev"));

    const logDir = path.join(__dirname, "../logs");
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir);
    }

    const accessLogStream = fs.createWriteStream(
      path.join(logDir, "access.log"),
      { flags: "a" }
    );
    this.app.use(morgan("combined", { stream: accessLogStream }));

    this.app.use(express.static("public"));
  }

  routes() {
    this.app.use(this.paths.auth, require("../routes/auth"));
    this.app.use(this.paths.usuarios, require("../routes/usuarios"));
    this.app.use(this.paths.productos, require("../routes/productos"));
    this.app.use(this.paths.categorias, require("../routes/categorias"));
    this.app.use(this.paths.ordenes, require("../routes/ordenes"));
    this.app.use(this.paths.carrito, require("../routes/carritoRoutes"));
    this.app.use(this.paths.consultas, require("../routes/consultas"));
    this.app.use(this.paths.cuotas, require("../routes/cuotas"));
    this.app.use(this.paths.envios, enviosRoutes);
    this.app.use(this.paths.compras, comprasRoutes);
    this.app.use(this.paths.pagos, pagosRouter); // 👈 corregido
  }

  listen() {
    this.app.listen(this.port, () => {
      console.log("Servidor corriendo en puerto", this.port);
    });
  }
}

module.exports = Server;
