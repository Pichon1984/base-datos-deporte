const { request, response } = require('express');
const Categoria = require('../models/categoria');
const { query } = require('express-validator');

const categoriasGet = async (req = request, res = response) => {
    //obtener todas las categorias de productos paginadas con el total
    const { desde = 0, limite = 5 } = req.query;
    const query = { estado: true };

    const [total, categorias] = await Promise.all([
        Categoria.countDocuments(query),
        Categoria.find(query)
            .limit(limite)
         .populate('usuario', 'correo')
    ])
    res.json({
        total,
        categorias,
        msg: 'categorias obtenidas'
    })
}
const categoriaGet = async (req = request, res = response) => {
    const { id } = req.params;
    const categoria = await Categoria.findById(id) .populate('usuario', 'nombre apellido correo') ;
    res.json({
        msg: 'categorias obtenidas segun pedido del usuario',
        categoria
    })
}

const categoriaPost = async (req = request, res = response) => {

    const nombre = req.body.nombre.toUpperCase();

    //verificar si la categoria ya existe
    const categoriaDB = await Categoria.findOne({ nombre });
    if (categoriaDB) {
        return res.status(400).json({
            msg: `la categoria ${categoriaDB.nombre} ya existe.`
        });
    }


    // generar la data que vamos a guardar en la BD

    const data = {
        nombre,
         usuario: req.usuario._id 
    }
    const categoria = new Categoria(data);

    //guardar en DB
    await categoria.save();
    res.status(201).json({
        msg: `categoria ${categoria.nombre} creada con exito`,
        categoria
    })
}

const categoriaPut = async (req = request, res = response) => {
    const { id } = req.params;
    const nombre = req.body.nombre.toUpperCase();
     const usuario = req.usuario_id; 

    const data = { nombre , usuario  };

    const categoria = await Categoria.findByIdAndUpdate(id, data, { new: true });
    res.status(208).json({
        categoria,
        msg: `categoria actualizada correctamente.`
    })

}
const categoriaDelete = async (req = request, res = response) => {
    const { id } = req.params;
    const categoriaInactiva = await Categoria.findByIdAndUpdate(id, { estado: false }, { new: true });

    res.json({
        categoriaInactiva,
        msg: 'la categoria fue eliminada correctamente | inactiva',
    })
}

module.exports = {
    categoriasGet,
    categoriaGet,
    categoriaPost,
    categoriaPut,
    categoriaDelete
}