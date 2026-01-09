const express = require("express");
const mongoose = require("mongoose");
const Compra = require("../models/compra");
const Producto = require("../models/producto");
const Orden = require("../models/orden"); 
const { validarJWT } = require("../middlewares/validar-jwt");
const { calcularCostoEnvio } = require("../helpers/envio");

const router = express.Router();

/**
 * 📌 Crear una compra con envío proporcional
 */
router.post("/", validarJWT, async (req, res) => {
  try {
    const { ordenId, productos } = req.body;

    if (!ordenId || !mongoose.Types.ObjectId.isValid(ordenId)) {
      return res.status(400).json({ ok: false, error: "ordenId inválido o faltante" });
    }

    const orden = await Orden.findById(ordenId);
    if (!orden) {
      return res.status(404).json({ ok: false, error: "Orden no encontrada" });
    }

    if (!Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({ ok: false, error: "Debe incluir al menos un producto" });
    }

    let subtotal = 0;
    const productosProcesados = [];

    for (const item of productos) {
      if (!mongoose.Types.ObjectId.isValid(item.productoId)) {
        return res.status(400).json({ ok: false, error: `ID inválido: ${item.productoId}` });
      }

      const producto = await Producto.findById(item.productoId);
      if (!producto) {
        return res.status(404).json({ ok: false, error: `Producto no encontrado: ${item.productoId}` });
      }

      // ✅ Validar stock por talle si corresponde
      if (item.talle) {
        const talleObj = producto.tallesUnidades.find(t => t.talle === item.talle);
        if (!talleObj || talleObj.stock < item.cantidad) {
          return res.status(400).json({ ok: false, error: `Stock insuficiente para talle ${item.talle} en ${producto.nombre}` });
        }
      } else if (producto.stock < item.cantidad) {
        return res.status(400).json({ ok: false, error: `Stock insuficiente para ${producto.nombre}` });
      }

      const subtotalItem = item.cantidad * producto.precio;
      subtotal += subtotalItem;

      productosProcesados.push({
        productoId: producto._id,
        nombre: producto.nombre,
        precio: producto.precio,
        cantidad: item.cantidad,
        talle: item.talle || null,
        subtotal: subtotalItem
      });
    }

    const costoEnvio = calcularCostoEnvio(subtotal);
    const totalFinal = subtotal + costoEnvio;

    const nuevaCompra = new Compra({
      usuario: req.usuario._id,
      ordenId,
      productos: productosProcesados,
      total: subtotal,
      costoEnvio,
      totalFinal,
      estado: "pendiente",
      estadoEnvio: "pendiente"
    });

    const compraGuardada = await nuevaCompra.save();
    res.status(201).json({ ok: true, compra: compraGuardada });
  } catch (error) {
    console.error("Error al crear compra:", error);
    res.status(500).json({ ok: false, error: "Error al crear la compra" });
  }
});

/**
 * 📌 Obtener compras del cliente autenticado con filtros y paginación
 */
router.get("/mias", validarJWT, async (req, res) => {
  try {
    const { estado, desde, hasta, page = 1, limit = 10 } = req.query;
    const query = { usuario: req.usuario._id };

    if (estado) query.estado = estado;
    if (desde || hasta) {
      query.createdAt = {};
      if (desde) query.createdAt.$gte = new Date(desde);
      if (hasta) query.createdAt.$lte = new Date(hasta);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [compras, total] = await Promise.all([
      Compra.find(query)
        .populate("productos.productoId", "nombre precio")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Compra.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({ ok: true, compras, page: parseInt(page), totalPages });
  } catch (error) {
    console.error("Error al obtener compras:", error);
    res.status(500).json({ ok: false, error: "Error al obtener las compras" });
  }
});
/**
 * 📌 Obtener todas las compras (solo ADMIN) con filtros y paginación
 */
router.get("/", validarJWT, async (req, res) => {
  try {
    if (req.usuario.rol.toUpperCase() !== "ADMIN") {
      return res.status(403).json({ ok: false, error: "Acceso denegado" });
    }

    const { estado, desde, hasta, page = 1, limit = 10 } = req.query;
    const query = {};

    if (estado) query.estado = estado;
    if (desde || hasta) {
      query.createdAt = {};
      if (desde) query.createdAt.$gte = new Date(desde);
      if (hasta) query.createdAt.$lte = new Date(hasta);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [compras, total] = await Promise.all([
      Compra.find(query)
        .populate("productos.productoId", "nombre precio")
        .populate("usuario", "nombre correo")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Compra.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({ ok: true, compras, page: parseInt(page), totalPages });
  } catch (error) {
    console.error("Error al obtener todas las compras:", error);
    res.status(500).json({ ok: false, error: "Error al obtener todas las compras" });
  }
});

/**
 * 📌 Consultar estado de envío de una compra
 */
router.get("/:id/envio", validarJWT, async (req, res) => {
  try {
    const compra = await Compra.findById(req.params.id).populate("usuario", "nombre correo");

    if (!compra) {
      return res.status(404).json({ ok: false, error: "Compra no encontrada" });
    }

    const compraUsuarioId = compra.usuario._id ? compra.usuario._id.toString() : compra.usuario.toString();

    if (req.usuario.rol.toUpperCase() !== "ADMIN" && compraUsuarioId !== req.usuario._id.toString()) {
      return res.status(403).json({ ok: false, error: "Acceso denegado" });
    }

    res.json({
      ok: true,
      compraId: compra._id,
      estadoEnvio: compra.estadoEnvio,
      estado: compra.estado,
      trackingNumber: compra.trackingNumber,
      courier: compra.courier,
      usuario: compra.usuario,
    });
  } catch (error) {
    console.error("Error al consultar estado de envío:", error);
    res.status(500).json({ ok: false, error: "Error al consultar estado de envío" });
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
      return res.status(404).json({ ok: false, error: "Compra no encontrada" });
    }

    const compraUsuarioId = compra.usuario._id ? compra.usuario._id.toString() : compra.usuario.toString();

    if (req.usuario.rol.toUpperCase() !== "ADMIN" && compraUsuarioId !== req.usuario._id.toString()) {
      return res.status(403).json({ ok: false, error: "Acceso denegado" });
    }

    res.json({ ok: true, compra });
  } catch (error) {
    console.error("Error al obtener compra por ID:", error);
    res.status(500).json({ ok: false, error: "Error al obtener la compra" });
  }
});
/**
 * 📌 Actualizar estado de envío y tracking (solo ADMIN, con Andreani)
 */
router.put("/:id/envio", validarJWT, async (req, res) => {
  try {
    if (req.usuario.rol.toUpperCase() !== "ADMIN") {
      return res.status(403).json({ ok: false, error: "Acceso denegado" });
    }

    const { estadoEnvio, trackingNumber, courier } = req.body;
    if (estadoEnvio && !["pendiente", "enviado", "entregado"].includes(estadoEnvio)) {
      return res.status(400).json({ ok: false, error: "Estado de envío inválido" });
    }

    const compra = await Compra.findById(req.params.id).populate("usuario", "nombre correo codigoPostal");
    if (!compra) {
      return res.status(404).json({ ok: false, error: "Compra no encontrada" });
    }

    // 🚚 Integración con Andreani si se marca como enviado
    if (estadoEnvio === "enviado") {
      try {
        const contrato = compra.courier === "SUCURSAL"
          ? process.env.ANDREANI_CONTRACT_SUC
          : process.env.ANDREANI_CONTRACT_DOM;

        const envioData = {
          contrato,
          origen: { codigoPostal: process.env.VITE_ORIGEN_CP },
          destino: { codigoPostal: compra.usuario.codigoPostal },
          bultos: [
            {
              peso: compra.productos.reduce((acc, p) => acc + (p.peso || 1), 0)
            }
          ]
        };

        const authString = `${process.env.ANDREANI_USER}:${process.env.ANDREANI_PASS}`;
        const authBase64 = Buffer.from(authString).toString("base64");

        const response = await fetch(`${process.env.ANDREANI_API_URL}/ordenes-de-envio`, {
          method: "POST",
          headers: {
            Authorization: `Basic ${authBase64}`,
            "Content-Type": "application/json",
            "x-ibm-client-id": process.env.ANDREANI_CLIENT_CODE
          },
          body: JSON.stringify(envioData),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error("❌ Error en despacho Andreani:", errText);
          return res.status(response.status).json({ ok: false, error: errText });
        }

        const data = await response.json();
        compra.trackingNumber = data.trackingNumber || data.id;
        compra.courier = "Andreani";
        compra.fechaEnvio = new Date();
      } catch (err) {
        console.error("❌ Error integrando Andreani:", err);
        return res.status(500).json({ ok: false, error: "Error integrando Andreani" });
      }
    }

    if (estadoEnvio) compra.estadoEnvio = estadoEnvio;
    if (trackingNumber !== undefined) compra.trackingNumber = trackingNumber || compra.trackingNumber || null;
    if (courier !== undefined) compra.courier = courier || compra.courier || null;

    if (estadoEnvio === "entregado" && !compra.fechaEntrega) compra.fechaEntrega = new Date();

    // 📌 Registrar evento en historial
    if (estadoEnvio) {
      compra.envioEventos.push({
        status: estadoEnvio.toUpperCase(),
        fecha: new Date(),
        origen: process.env.VITE_ORIGEN_CP,
        destino: compra.usuario.codigoPostal,
      });
    }

    await compra.save();

    const compraPopulada = await Compra.findById(compra._id)
      .populate("productos.productoId", "nombre precio")
      .populate("usuario", "nombre correo");

    res.json({ ok: true, msg: "Estado de envío actualizado", compra: compraPopulada });
  } catch (error) {
    console.error("Error al actualizar estado de envío:", error);
    res.status(500).json({ ok: false, error: "Error al actualizar estado de envío" });
  }
});

/**
 * 📦 Webhook de Andreani para actualizar estado de envío
 */
router.post("/andreani/webhook", async (req, res) => {
  try {
    const { trackingNumber, status } = req.body;

    if (!trackingNumber || !status) {
      return res.status(400).json({ ok: false, error: "Faltan parámetros en webhook" });
    }

    const compra = await Compra.findOne({ trackingNumber });
    if (!compra) {
      console.warn("⚠️ Compra no encontrada para tracking:", trackingNumber);
      return res.sendStatus(404);
    }

    if (status === "ENTREGADO") {
      compra.estadoEnvio = "entregado";
      compra.fechaEntrega = new Date();
    } else if (status === "EN_CAMINO") {
      compra.estadoEnvio = "enviado";
      if (!compra.fechaEnvio) compra.fechaEnvio = new Date();
    }

    // 📌 Registrar evento en historial
    compra.envioEventos.push({
      status,
      fecha: new Date(),
      destino: compra.usuario?.codigoPostal || null,
    });

    await compra.save();

    console.log("✅ Webhook Andreani procesado:", trackingNumber, status);
    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Error en webhook Andreani:", error);
    res.sendStatus(500);
  }
});

module.exports = router;

