const Usuario = require('../models/usuario');
const Rol = require('../models/rol');
const Categoria = require('../models/categoria');
const Producto = require('../models/producto');

// validar email
const emailExiste = async (correo = '') => {
    const existeEmail = await Usuario.findOne({ correo });
    if (existeEmail) {
        throw new Error(`El correo ${correo} ya se encuentra en la base de datos`);
    }
};

// validar rol
const esRolValido = async (rol = '') => {
  const existeRol = await Rol.findOne({ rol: rol.toUpperCase() });
  if (!existeRol) {
    throw new Error(`El rol ${rol} no existe en la base de datos!`);
  }
};



// validar si el usuario existe en la DB con el id
const usuarioExiste = async (id = '') => {
    const existeUsuario = await Usuario.findById(id);
    if (!existeUsuario) {
        throw new Error(`El id ${id} no corresponde a ningún usuario registrado`);
    }
};

// validar si la categoria existe en la DB
const categoriaExiste = async (id = '') => {
    const existeCategoria = await Categoria.findById(id);
    if (!existeCategoria) {
        throw new Error(`El id ${id} no corresponde a ninguna categoría registrada!`);
    }
};

// validar si el producto existe
const productoExiste = async (id = '') => {
    const existeProducto = await Producto.findById(id);
    if (!existeProducto) {
        throw new Error(`El id ${id} no corresponde a ningún producto registrado`);
    }
};

module.exports = {
    emailExiste,
    esRolValido,
    usuarioExiste,
    categoriaExiste,
    productoExiste,
};

