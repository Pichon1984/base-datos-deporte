const Usuario = require('../models/usuario');
const Categoria = require('../models/categoria');
const Producto = require('../models/producto');

// Validar email único
const emailExiste = async (correo = '') => {
  const existeEmail = await Usuario.findOne({ correo });
  if (existeEmail) {
    throw new Error(`El correo ${correo} ya se encuentra en la base de datos`);
  }
};

// Validar si el usuario existe en la DB con el id
const usuarioExiste = async (id = '') => {
  const existeUsuario = await Usuario.findById(id);
  if (!existeUsuario) {
    throw new Error(`El id ${id} no corresponde a ningún usuario registrado`);
  }
};

// Validar si la categoría existe en la DB
const categoriaExiste = async (id = '') => {
  const existeCategoria = await Categoria.findById(id);
  if (!existeCategoria) {
    throw new Error(`El id ${id} no corresponde a ninguna categoría registrada`);
  }
};

// Validar si el producto existe en la DB
const productoExiste = async (id = '') => {
  const existeProducto = await Producto.findById(id);
  if (!existeProducto) {
    throw new Error(`El id ${id} no corresponde a ningún producto registrado`);
  }
};

module.exports = {
  emailExiste,
  usuarioExiste,
  categoriaExiste,
  productoExiste,

};
