const express = require('express');
const cors = require('cors');
const { dbConnection } = require('../database/config');

class Server {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3000;

        // Definir paths de la API
        this.usuariosPath   = '/api/usuarios';
        this.authPath       = '/api/auth';
        this.categoriaPath  = '/api/categorias';
        this.productoPath   = '/api/productos';
        this.compraPath     = '/api/compra';
        this.carritoPath    = '/api/carrito';
        this.ordenesPath    = '/api/ordenes'; // 👈 nuevo path para órdenes

        // Conectar con la base de datos
        this.connectarDb();

        // Middlewares
        this.middleware();

        // Rutas de la aplicación
        this.routes();
    }

    async connectarDb() {
        await dbConnection();
    }

    middleware() {
        // CORS
        this.app.use(cors());

        // Leer JSON en el body
        this.app.use(express.json());

        // Carpeta pública
        this.app.use(express.static('public'));
    }

    routes() {
        this.app.use(this.authPath, require('../routes/auth'));
        this.app.use(this.usuariosPath, require('../routes/usuarios'));
        this.app.use(this.categoriaPath, require('../routes/categorias'));
        this.app.use(this.productoPath, require('../routes/productos'));
        this.app.use(this.compraPath, require('../routes/compra'));
        this.app.use(this.carritoPath, require('../routes/carritoRoutes'));
        this.app.use(this.ordenesPath, require('../routes/ordenes')); // 👈 integración órdenes
    }

    listen() {
        this.app.listen(this.port, () => {
            console.log('server online port:', this.port);
        });
    }
}

module.exports = Server;

