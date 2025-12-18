const express = require("express");
const mongoose = require("mongoose");
const Compra = require("../models/Compra");
const Producto = require("../models/producto");
const { validarJWT } = require("../middlewares/validar-jwt");

const router = express.Router();

/**
 * 📌 Crear una compra
 */
router.post("/", validarJWT, async (req, res) => {
  try {
    const { productos } = req.body;

    if (!Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({ error: "Debe incluir al menos un producto" });
    }

    let total = 0;
    const productosProcesados = [];

    for (const item of productos) {
      if (!mongoose.Types.ObjectId.isValid(item.productoId)) {
        return res.status(400).json({ error: `ID inválido: ${item.productoId}` });
      }

      const producto = await Producto.findById(item.productoId);
      if (!producto) {
        return res.status(404).json({ error: `Producto no encontrado: ${item.productoId}` });
      }

      if (producto.stock < item.cantidad) {
        return res.status(400).json({ error: `Stock insuficiente para ${producto.nombre}` });
      }

      // Actualizar stock
      producto.stock -= item.cantidad;
      await producto.save();

      const subtotal = item.cantidad * producto.precio;
      total += subtotal;

      productosProcesados.push({
        productoId: producto._id,
        nombre: producto.nombre,
        precio: producto.precio,
        cantidad: item.cantidad,
        talle: item.talle || null
      });
    }

    const nuevaCompra = new Compra({
      usuario: req.usuario._id,
      productos: productosProcesados,
      total,
      estado: "pendiente"
    });

    const compraGuardada = await nuevaCompra.save();
    res.status(201).json({ msg: "Compra realizada con éxito", compra: compraGuardada });
  } catch (error) {
    console.error("Error al crear compra:", error);
    res.status(500).json({ error: "Error al crear la compra" });
  }
});

/**
 * 📌 Obtener compras del cliente autenticado
 */
router.get("/mias", validarJWT, async (req, res) => {
  try {
    const compras = await Compra.find({ usuario: req.usuario._id })
      .populate("productos.productoId", "nombre precio")
      .sort({ fecha: -1 });

    res.json(compras);
  } catch (error) {
    console.error("Error al obtener compras:", error);
    res.status(500).json({ error: "Error al obtener las compras" });
  }
});

/**
 * 📌 Obtener todas las compras (solo ADMIN)
 */
router.get("/", validarJWT, async (req, res) => {
  try {
    if (req.usuario.rol !== "ADMIN") {
      return res.status(403).json({ error: "Acceso denegado" });
    }

    const compras = await Compra.find()
      .populate("productos.productoId", "nombre precio")
      .populate("usuario", "nombre correo")
      .sort({ fecha: -1 });

    res.json(compras);
  } catch (error) {
    console.error("Error al obtener todas las compras:", error);
    res.status(500).json({ error: "Error al obtener todas las compras" });
  }
});

/**
 * 📌 Obtener una compra específica por ID
 */
router.get("/:id", validarJWT, async (req, res) => {
  try {
    const compra = await Compra.findById(req.params.id)
      .populate("productos.productoId", "nombre precio")
      .populate("usuario", "nombre correo");

    if (!compra) {
      return res.status(404).json({ error: "Compra no encontrada" });
    }

    const compraUsuarioId = compra.usuario._id
      ? compra.usuario._id.toString()
      : compra.usuario.toString();

    if (
      req.usuario.rol !== "ADMIN" &&
      compraUsuarioId !== req.usuario._id.toString()
    ) {
      return res.status(403).json({ error: "Acceso denegado" });
    }

    res.json(compra);
  } catch (error) {
    console.error("Error al obtener compra por ID:", error);
    res.status(500).json({ error: "Error al obtener la compra" });
  }
});

/**
 * 📌 Actualizar estado de una compra (solo ADMIN)
 */
router.put("/:id/estado", validarJWT, async (req, res) => {
  try {
    if (req.usuario.rol !== "ADMIN") {
      return res.status(403).json({ error: "Acceso denegado" });
    }

    const { estado } = req.body;
    if (!["pendiente", "pagada", "cancelada"].includes(estado)) {
      return res.status(400).json({ error: "Estado inválido" });
    }

    const compra = await Compra.findByIdAndUpdate(
      req.params.id,
      { estado },
      { new: true }
    )
      .populate("productos.productoId", "nombre precio")
      .populate("usuario", "nombre correo");

    if (!compra) {
      return res.status(404).json({ error: "Compra no encontrada" });
    }

    res.json({ msg: "Estado actualizado", compra });
  } catch (error) {
    console.error("Error al actualizar estado de compra:", error);
    res.status(500).json({ error: "Error al actualizar estado de compra" });
  }
});

module.exports = router;


