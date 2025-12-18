const Producto = require("../models/producto");
const Categoria = require("../models/categoria");

// 📌 Obtener productos (con búsqueda y categoría)
const productosGet = async (req, res) => {
  try {
    const { categoria, search } = req.query;
    let query = {};

    if (categoria) {
      const cat = await Categoria.findOne({ nombre: categoria.toLowerCase() });
      if (!cat) return res.json([]);
      query.categoria = cat._id;
    }

    if (search) {
      query.nombre = { $regex: search, $options: "i" };
    }

    const productos = await Producto.find(query)
      .populate("usuario", "nombre email")
      .populate("categoria", "nombre");

    res.json(Array.isArray(productos) ? productos : []);
  } catch (error) {
    console.error("Error al obtener productos:", error.message);
    res.json([]);
  }
};

// 📌 Obtener producto por ID
const productoGet = async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id)
      .populate("usuario", "nombre email")
      .populate("categoria", "nombre");

    if (!producto) return res.status(404).json({ error: "Producto no encontrado" });

    res.json(producto);
  } catch (error) {
    console.error("Error al obtener producto:", error.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// 📌 Crear producto
const productoPost = async (req, res) => {
  try {
    const {
      nombre,
      precio,
      descripcion,
      imagenes,
      stock,
      categoria,
      envio,
      cuotas,
      talles
    } = req.body;

    if (!nombre || !precio || !categoria) {
      return res.status(400).json({ error: "Nombre, precio y categoría son obligatorios" });
    }

    const existeCategoria = await Categoria.findById(categoria);
    if (!existeCategoria) {
      return res.status(400).json({ error: "Categoría no válida" });
    }

    const producto = new Producto({
      nombre,
      precio,
      descripcion,
      imagenes,
      stock,
      categoria,
      usuario: req.usuario._id,
      envio: {
        costo: envio?.costo || 0,
        tiempo: envio?.tiempo || 3,
        metodos: envio?.metodos || []
      },
      cuotas: cuotas || [],
      talles: talles || [] // 👈 guardamos talles
    });

    await producto.save();
    res.status(201).json({ msg: "Producto creado correctamente", producto });
  } catch (error) {
    console.error("Error al crear producto:", error.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// 📌 Actualizar producto
const productoPut = async (req, res) => {
  try {
    const { envio, cuotas, talles, ...resto } = req.body;

    const producto = await Producto.findByIdAndUpdate(
      req.params.id,
      {
        ...resto,
        ...(envio && { envio }),
        ...(cuotas && { cuotas }),
        ...(talles && { talles })
      },
      { new: true }
    )
      .populate("usuario", "nombre email")
      .populate("categoria", "nombre");

    if (!producto) return res.status(404).json({ error: "Producto no encontrado" });

    res.json(producto);
  } catch (error) {
    console.error("Error al actualizar producto:", error.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// 📌 Eliminar producto
const productoDelete = async (req, res) => {
  try {
    const producto = await Producto.findByIdAndDelete(req.params.id);
    if (!producto) return res.status(404).json({ error: "Producto no encontrado" });
    res.json({ msg: "Producto eliminado", producto });
  } catch (error) {
    console.error("Error al eliminar producto:", error.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

module.exports = {
  productosGet,
  productoGet,
  productoPost,
  productoPut,
  productoDelete
};

