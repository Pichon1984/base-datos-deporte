const { Router } = require("express");
const mongoose = require("mongoose");
const Categoria = require("../models/categoria");
const Producto = require("../models/producto");
const { validarJWT } = require("../middlewares/validar-jwt");

const router = Router();

//  Listar todas las categorías
router.get("/", async (req, res) => {
  try {
    const categorias = await Categoria.find({ estado: true }).select("nombre _id");
    res.json({ categorias });
  } catch (error) {
    console.error("❌ Error al obtener categorías:", error.message);
    res.status(500).json({ msg: "Error interno al obtener categorías" });
  }
});

//  Obtener categoría por ID (ObjectId)
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: "ID de categoría inválido" });
    }

    const categoria = await Categoria.findById(id).select("nombre _id");
    if (!categoria) {
      return res.status(404).json({ msg: "Categoría no encontrada" });
    }
    res.json(categoria);
  } catch (error) {
    console.error("❌ Error al obtener categoría:", error.message);
    res.status(500).json({ msg: "Error interno al obtener categoría" });
  }
});

//  Obtener productos de una categoría por ID (ObjectId)
router.get("/:id/productos", async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 12 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: "ID de categoría inválido" });
    }

    const categoria = await Categoria.findById(id).select("nombre _id");
    if (!categoria) {
      return res.status(404).json({ msg: "Categoría no encontrada" });
    }

    //  Consulta directa usando ObjectId
    const query = { categoria: id, activo: true };

    const productos = await Producto.find(query)
      .populate("categoria", "nombre _id")
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Producto.countDocuments(query);

    res.json({
      productos,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("❌ Error al obtener productos de categoría:", error.message);
    res.status(500).json({ msg: "Error interno al obtener productos de categoría" });
  }
});

//  Crear categoría
router.post("/", validarJWT, async (req, res) => {
  try {
    const { nombre } = req.body;
    if (!nombre) {
      return res.status(400).json({ msg: "El nombre es obligatorio" });
    }

    const existe = await Categoria.findOne({ nombre: nombre.toLowerCase() });
    if (existe) {
      return res.status(400).json({ msg: "La categoría ya existe" });
    }

    const categoria = new Categoria({
      nombre: nombre.toLowerCase(),
      usuario: req.usuario._id,
    });

    await categoria.save();

    res.status(201).json({
      msg: "Categoría creada correctamente",
      categoria,
    });
  } catch (error) {
    console.error("❌ Error al crear categoría:", error.message);
    res.status(500).json({ msg: "Error interno al crear categoría" });
  }
});

//  Actualizar categoría
router.put("/:id", validarJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: "ID de categoría inválido" });
    }

    const categoria = await Categoria.findByIdAndUpdate(
      id,
      { nombre: nombre.toLowerCase() },
      { new: true }
    ).select("nombre _id");

    if (!categoria) {
      return res.status(404).json({ msg: "Categoría no encontrada" });
    }

    res.json({
      msg: "Categoría actualizada correctamente",
      categoria,
    });
  } catch (error) {
    console.error("❌ Error al actualizar categoría:", error.message);
    res.status(500).json({ msg: "Error interno al actualizar categoría" });
  }
});

//  Eliminar categoría
router.delete("/:id", validarJWT, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: "ID de categoría inválido" });
    }

    const categoria = await Categoria.findByIdAndDelete(id).select("nombre _id");
    if (!categoria) {
      return res.status(404).json({ msg: "Categoría no encontrada" });
    }
    res.json({ msg: "Categoría eliminada", categoria });
  } catch (error) {
    console.error("❌ Error al eliminar categoría:", error.message);
    res.status(500).json({ msg: "Error interno al eliminar categoría" });
  }
});

module.exports = router;

