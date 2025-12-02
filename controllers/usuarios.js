const { request, response } = require('express');
const bcrypt = require('bcryptjs');
const Usuario = require('../models/usuario');

const usuariosGet = async (req = request, res = response) => {
    const { desde = 0, limite = 5 } = req.query;
    const query = { estado: true };

    const [total, usuarios] = await Promise.all([
        Usuario.countDocuments(query),
        Usuario.find(query).skip(Number(desde)).limit(Number(limite))
    ]);

    res.json({
        mensaje: 'usuarios obtenidos',
        total,
        usuarios
    });
};

const usuariosGetId = async (req = request, res = response) => {
    const { id } = req.params;

    const usuario = await Usuario.findById(id);

    res.json({
        mensaje: 'usuario obtenido',
        usuario
    });
};

const usuariosPost = async (req = request, res = response) => {
    //recibir el cuerpo de la peticion
    req.body.rol = req.body.rol.toUpperCase();

    const datos = req.body;

    const { nombre, apellido, correo, password, rol } = datos;
    const usuario = new Usuario({ nombre, apellido, correo, password, rol });

    //encriptar la contraseña
const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync(password, salt);
usuario.password = hash;

//guardar los datos de la bd
    await usuario.save();

    res.json({
        mensaje: 'usuario cargado correctamente',
        usuario
    });
};
const usuarioPut = async(req=request, res=response)=>{
const {id} =req.params;
    //obtener datospara actualizar
const{password, correo, ...resto} = req.body;

    //si actualiza el password, debo encriptarlo
if(password){
    const salt = bcrypt.genSaltSync(10);
    resto.password = bcrypt.hashSync(password, salt);
}
    //modificacion de datos
resto.correo = correo;

// buscar el usuario y actualizar
const usuario = await Usuario.findByIdAndUpdate(id, resto, {new:true});

    res.json({
        mensaje: 'usuario actualzado correctamente',
        usuario
    })
}
const usuarioDelete = async (req = request, res = response) => {
    const { id } = req.params;
    //eliminacion del registro fisico

   /*  const usuarioBorrado = await Usuario.findByIdAndDelete(id) */

    //eliminacion logica o cambio de estado a false
const usuario = await Usuario.findById(id);

if (!usuario.estado){
    return res.json({
        mensaje: 'usuario no existe'
    })
}
const usuarioInhabilitado = await Usuario.findByIdAndUpdate(id, {estado: false}, {new:true});


    res.json({
        /* mensaje: 'usuario eliminado exitosamente',
        usuarioBorrado */
        mensaje: 'usuario inhabilitado exitosamente',
        usuarioInhabilitado
    })
}
module.exports = {
    usuariosGet,
    usuariosGetId,
    usuariosPost,
    usuarioPut,
    usuarioDelete,

};

