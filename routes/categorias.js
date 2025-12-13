const { Router } = require('express');
const Categoria = require('../models/categoria');
const { validarJWT } = require('../middlewares/validar-jwt');

const router = Router();

// ✅ Listar todas las categorías
router.get('/', async (req, res) => {
  try {
    const categorias = await Categoria.find({ estado: true });
    res.json({ categorias });
  } catch (error) {
    console.error("❌ Error al obtener categorías:", error.message);
    res.status(500).json({ msg: "Error interno al obtener categorías" });
  }
});

// ✅ Obtener categoría por ID
router.get('/:id', async (req, res) => {
  try {
    const categoria = await Categoria.findById(req.params.id);
    if (!categoria) {
      return res.status(404).json({ msg: "Categoría no encontrada" });
    }
    res.json(categoria);
  } catch (error) {
    console.error("❌ Error al obtener categoría:", error.message);
    res.status(500).json({ msg: "Error interno al obtener categoría" });
  }
});

// ✅ Crear categoría (requiere token válido)
router.post('/', validarJWT, async (req, res) => {
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
      usuario: req.usuario._id
    });

    await categoria.save();

    res.status(201).json({
      msg: "Categoría creada correctamente",
      categoria
    });
  } catch (error) {
    console.error("❌ Error al crear categoría:", error.message);
    res.status(500).json({ msg: "Error interno al crear categoría" });
  }
});

// ✅ Actualizar categoría
router.put('/:id', validarJWT, async (req, res) => {
  try {
    const { nombre } = req.body;
    const categoria = await Categoria.findByIdAndUpdate(
      req.params.id,
      { nombre: nombre.toLowerCase() },
      { new: true }
    );

    if (!categoria) {
      return res.status(404).json({ msg: "Categoría no encontrada" });
    }

    res.json({
      msg: "Categoría actualizada correctamente",
      categoria
    });
  } catch (error) {
    console.error("❌ Error al actualizar categoría:", error.message);
    res.status(500).json({ msg: "Error interno al actualizar categoría" });
  }
});

// ✅ Eliminar categoría
router.delete('/:id', validarJWT, async (req, res) => {
  try {
    const categoria = await Categoria.findByIdAndDelete(req.params.id);
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



