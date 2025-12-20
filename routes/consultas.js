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

// Obtener consultas por producto
router.get("/producto/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const consultas = await Consulta.find({ productoId: id })
      .populate("usuarioId", "nombre email")
      .sort({ fecha: -1 });
    res.json(consultas);
  } catch (error) {
    console.error("Error obteniendo consultas:", error);
    res.status(500).json({ ok: false, error: "Error interno" });
  }
});

// Obtener todas las consultas (admin/vendedor)
router.get("/todas", validarJWT, async (req, res) => {
  try {
    if (req.usuario.rol !== "VENDEDOR" && req.usuario.rol !== "ADMIN") {
      return res.status(403).json({ ok: false, error: "No autorizado" });
    }

    const consultas = await Consulta.find()
      .populate("productoId", "nombre")
      .populate("usuarioId", "email")
      .sort({ fecha: -1 });

    res.json(consultas);
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



