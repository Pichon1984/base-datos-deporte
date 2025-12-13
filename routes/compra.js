const express = require("express");
const Compra = require("../models/Compra");
const { validarJWT } = require("../middlewares/validar-jwt");

const router = express.Router();

// ✅ Crear una compra
router.post("/", validarJWT, async (req, res) => {
  try {
    const { productos, total } = req.body;

    // Siempre usamos el usuario autenticado como cliente
    const nuevaCompra = new Compra({
      cliente: req.usuario._id,   // 👈 ObjectId válido
      productos,
      total
    });

    const compraGuardada = await nuevaCompra.save();
    res.json(compraGuardada);
  } catch (error) {
    console.error("Error al crear compra:", error);
    res.status(500).json({ error: "Error al crear la compra" });
  }
});

// ✅ Obtener compras de un cliente autenticado
router.get("/mias", validarJWT, async (req, res) => {
  try {
    const compras = await Compra.find({ cliente: req.usuario._id })
      .populate("productos.productoId");
    res.json(compras);
  } catch (error) {
    console.error("Error al obtener compras:", error);
    res.status(500).json({ error: "Error al obtener las compras" });
  }
});

// ✅ Obtener todas las compras (solo admin)
router.get("/", validarJWT, async (req, res) => {
  try {
    if (req.usuario.rol !== "ADMIN") {
      return res.status(403).json({ error: "Acceso denegado" });
    }
    const compras = await Compra.find()
      .populate("productos.productoId")
      .populate("cliente");
    res.json(compras);
  } catch (error) {
    console.error("Error al obtener todas las compras:", error);
    res.status(500).json({ error: "Error al obtener todas las compras" });
  }
});

module.exports = router;


