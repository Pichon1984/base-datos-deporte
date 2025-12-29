const { Router } = require("express");
const Consulta = require("../models/consulta");
const { validarJWT } = require("../middlewares/validar-jwt");

const router = Router();

// Crear consulta
router.post("/", validarJWT, async (req, res) => {
  try {
    const { productoId, mensaje } = req.body;
    const consulta = new Consulta({
      productoId,
      usuarioId: req.usuario._id,
      mensaje,
      fecha: new Date(),
      respondida: false
    });
    await consulta.save();
    res.json({ ok: true, consulta });
  } catch (error) {
    console.error("Error creando consulta:", error);
    res.status(500).json({ ok: false, error: "Error interno" });
  }
});

// Obtener consultas por producto con paginación
router.get("/producto/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const [consultas, total] = await Promise.all([
      Consulta.find({ productoId: id })
        .populate("usuarioId", "nombre email")
        .sort({ fecha: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Consulta.countDocuments({ productoId: id })
    ]);

    res.json({
      ok: true,
      consultas,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("Error obteniendo consultas:", error);
    res.status(500).json({ ok: false, error: "Error interno" });
  }
});

// Obtener todas las consultas con paginación (admin/vendedor)
router.get("/todas", validarJWT, async (req, res) => {
  try {
    if (req.usuario.rol !== "VENDEDOR" && req.usuario.rol !== "ADMIN") {
      return res.status(403).json({ ok: false, error: "No autorizado" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const [consultas, total] = await Promise.all([
      Consulta.find()
        .populate("productoId", "nombre")
        .populate("usuarioId", "email")
        .sort({ fecha: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Consulta.countDocuments()
    ]);

    res.json({
      ok: true,
      consultas,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("Error obteniendo todas las consultas:", error);
    res.status(500).json({ ok: false, error: "Error interno" });
  }
});

// Responder consulta
router.put("/:id/responder", validarJWT, async (req, res) => {
  try {
    if (req.usuario.rol !== "VENDEDOR" && req.usuario.rol !== "ADMIN") {
      return res.status(403).json({ ok: false, error: "No autorizado" });
    }

    const { respuesta } = req.body;
    const consulta = await Consulta.findById(req.params.id);

    if (!consulta) {
      return res.status(404).json({ ok: false, error: "Consulta no encontrada" });
    }

    consulta.respuesta = respuesta;
    consulta.respondida = true;
    await consulta.save();

    res.json({ ok: true, consulta });
  } catch (error) {
    console.error("Error respondiendo consulta:", error);
    res.status(500).json({ ok: false, error: "Error interno" });
  }
});

module.exports = router;
