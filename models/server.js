const express = require('express');
const cors = require('cors');
const { dbConnection } = require('../database/config');

class Server {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3000;
        this.usuariosPath = '/api/usuarios';
        this.authPath = '/api/auth';
        this.categoriaPath = '/api/categorias';
        this.productoPath = '/api/productos';



        //conectar con la base de datos
        this.connectarDb();
        //middleware
        this.middleware();
        //funcion rutas
        this.routes();


    }
    async connectarDb() {
        await dbConnection();

    }
    middleware() {
        //cors
        this.app.use(cors());
        //leer lo que el usuario envia por el cuerpo de la peticion
        this.app.use(express.json());
        //definir la carpeta publica
        this.app.use(express.static('public'));

    }
    routes() {
        this.app.use(this.authPath, require('../routes/auth'));
        this.app.use(this.usuariosPath, require('../routes/usuarios'));
        this.app.use(this.categoriaPath, require('../routes/categorias'));
        this.app.use(this.productoPath, require('../routes/productos'));
    }
    listen() {
        this.app.listen(this.port, () => {
            console.log('server online port:', this.port);
        })

    }

}
module.exports = Server;