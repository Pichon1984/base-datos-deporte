const { request, response } = require('express');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/usuario');

const validarJWT = async (req = request, res = response, next) => {
    const token = req.header('x-token');


    //preguntar si no enviaron el token
    if (!token) {
        return res.status(401).json({
            msg: "no hay token en la peticion"
        })
    }
    //si enviaron el token, hacer:
    try {
        // verificar el token y obtener el uid
        const { uid } = jwt.verify(token, process.env.SECRETORPRIVATEKEY);

        //obtener los datos del usuario autenticado (uid)
        const usuario = await Usuario.findById(uid);

        //vlidar si el usuario existe
        if (!usuario) {
            return res.status(401).json({
                msg: 'token no valido - usuario no existe'
            })
        }
        //validar que el usuario este activo
        if (!usuario.estado) {
            return res.status(401).json({
                msg: "token no valido - usuario inativo"
            })
        }

        req.usuario = usuario;

        next();

    } catch (error) {
        console.log(error);
        res.status(401).json({
            msg: "token no valido"
        })
    }
}

module.exports = {
    validarJWT
}