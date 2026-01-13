const Producto = require("../models/producto");
const Categoria = require("../models/categoria");

// 📌 Obtener productos (con búsqueda, categoría y paginación)
const productosGet = async (req, res) => {
  try {
    const { categoria, search, page = 1, limit = 12 } = req.query;
    let query = {};

    // Filtrar por categoría (acepta nombre o _id)
    if (categoria) {
      if (/^[0-9a-fA-F]{24}$/.test(categoria)) {
        query.categoria = categoria;
      } else {
        const cat = await Categoria.findOne({ nombre: new RegExp(`^${categoria}$`, "i") });
        if (!cat) {
          return res.json({
            ok: true,
            productos: [],
            total: 0,
            page: parseInt(page),
            totalPages: 0,
          });
        }
        query.categoria = cat._id;
      }
    }

    // Filtrar por nombre (search)
    if (search) {
      query.nombre = { $regex: search, $options: "i" };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [productos, total] = await Promise.all([
      Producto.find(query)
        .populate("usuario", "nombre email")
        .populate("categoria", "nombre")
        .skip(skip)
        .limit(parseInt(limit)),
      Producto.countDocuments(query),
    ]);

    res.json({
      ok: true,
      productos,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error("Error al obtener productos:", error.message);
    res.status(500).json({ ok: false, error: "Error interno del servidor" });
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
      categoria, 
      cuotas,
      tallesUnidades,
    } = req.body;

    if (!nombre || !precio || !categoria) {
      return res.status(400).json({ error: "Nombre, precio y categoría son obligatorios" });
    }

    let categoriaId = categoria;
    if (!/^[0-9a-fA-F]{24}$/.test(categoria)) {
      const existeCategoria = await Categoria.findOne({ nombre: new RegExp(`^${categoria}$`, "i") });
      if (!existeCategoria) {
        return res.status(400).json({ error: "Categoría no válida" });
      }
      categoriaId = existeCategoria._id;
    }

    const producto = new Producto({
      nombre,
      precio: Number(parseFloat(precio).toFixed(2)),
      descripcion,
      imagenes,
      categoria: categoriaId,
      usuario: req.usuario._id,
      envio: {
        costo: envio?.costo || 0,
        tiempo: envio?.tiempo || 3,
        metodos: envio?.metodos || [],
      },
      cuotas: cuotas || [],
      tallesUnidades: (tallesUnidades || []).map(tu => ({
        talle: (tu.talle || "").trim(),
        stock: Number(tu.stock) || 0,
      })),
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
    const { envio, cuotas, tallesUnidades, categoria, ...resto } = req.body;

    let categoriaId = null;
    if (categoria) {
      if (/^[0-9a-fA-F]{24}$/.test(categoria)) {
        categoriaId = categoria;
      } else {
        const existeCategoria = await Categoria.findOne({ nombre: new RegExp(`^${categoria}$`, "i") });
        if (!existeCategoria) {
          return res.status(400).json({ error: "Categoría no válida" });
        }
        categoriaId = existeCategoria._id;
      }
    }

    // Normalizar precio
    if (resto.precio) {
      resto.precio = Number(parseFloat(resto.precio).toFixed(2));
    }

    // Normalizar tallesUnidades
    let tallesUnidadesNormalizadas = null;
    if (tallesUnidades && Array.isArray(tallesUnidades)) {
      tallesUnidadesNormalizadas = tallesUnidades.map(tu => ({
        talle: (tu.talle || "").trim(),
        stock: Number(tu.stock) || 0,
      }));
    }

    const producto = await Producto.findByIdAndUpdate(
      req.params.id,
      {
        ...resto,
        ...(envio && { envio }),
        ...(cuotas && { cuotas }),
        ...(tallesUnidadesNormalizadas && { tallesUnidades: tallesUnidadesNormalizadas }),
        ...(categoriaId && { categoria: categoriaId }),
      },
      { new: true, runValidators: true }
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
  productoDelete,
};
