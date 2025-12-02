const { request, response } = require('express');

const esAdminRole = (req, res = response, next) => {
    if (!req.usuario) {
        return res.status(500).json({
            msg: "Token debe validarse antes de verificar rol"
        });
    }

    const { rol, nombre, apellido } = req.usuario;

    if (rol !== 'admin') {
        return res.status(401).json({
            msg: `${nombre} ${apellido} no es Administrador del sistema`
        });
    }

    next();
};

module.exports = {
    esAdminRole,
};

