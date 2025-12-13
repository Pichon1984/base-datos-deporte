const Producto = require('../models/producto');
const Categoria = require('../models/categoria');

// ✅ Obtener todos los productos o filtrados por categoría
const productosGet = async (req, res) => {
  try {
    const { categoria } = req.query;
    let query = {};

    if (categoria) {
      const cat = await Categoria.findOne({ nombre: categoria.toLowerCase() });
      if (!cat) {
        return res.status(404).json({ error: 'Categoría no encontrada' });
      }
      query.categoria = cat._id;
    }

    const productos = await Producto.find(query)
      .populate('usuario', 'nombre correo')
      .populate('categoria', 'nombre');

    res.json({ productos });
  } catch (error) {
    console.error('Error al obtener productos:', error.message);
    res.status(500).json({ error: 'Error interno del servidor', detalle: error.message });
  }
};

// ✅ Obtener producto por ID
const productoGet = async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id)
      .populate('usuario', 'nombre correo')
      .populate('categoria', 'nombre');

    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json(producto);
  } catch (error) {
    console.error('Error al obtener producto:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ✅ Crear producto
const productoPost = async (req, res) => {
  try {
    const { nombre, precio, descripcion, imagenes, stock, categoria } = req.body;

    if (!nombre || !precio || !categoria) {
      return res.status(400).json({ error: 'Nombre, precio y categoría son obligatorios' });
    }
    if (isNaN(Number(precio)) || Number(precio) <= 0) {
      return res.status(400).json({ error: 'El precio debe ser un número válido mayor a 0' });
    }

    const existeCategoria = await Categoria.findById(categoria);
    if (!existeCategoria) {
      return res.status(400).json({ error: 'Categoría no válida' });
    }

    const producto = new Producto({
      nombre,
      precio: Number(precio),
      descripcion,
      imagenes,
      stock,
      categoria,
      usuario: req.usuario._id
    });

    await producto.save();

    res.status(201).json({
      msg: 'Producto creado correctamente',
      producto
    });

  } catch (error) {
    console.error('Error al crear producto:', error.message);
    res.status(500).json({ error: 'Error interno del servidor', detalle: error.message });
  }
};

// ✅ Actualizar producto
const productoPut = async (req, res) => {
  try {
    const producto = await Producto.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('usuario', 'nombre correo')
      .populate('categoria', 'nombre');

    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json(producto);
  } catch (error) {
    console.error('Error al actualizar producto:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ✅ Eliminar producto
const productoDelete = async (req, res) => {
  try {
    const producto = await Producto.findByIdAndDelete(req.params.id);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json({ msg: 'Producto eliminado', producto });
  } catch (error) {
    console.error('Error al eliminar producto:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  productosGet,
  productoGet,
  productoPost,
  productoPut,
  productoDelete
};

