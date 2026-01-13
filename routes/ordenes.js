const express = require("express");
const { MercadoPagoConfig, Preference } = require("mercadopago");
const Orden = require("../models/orden");
const Compra = require("../models/compra"); 
const { validarJWT } = require("../middlewares/validar-jwt");

const router = express.Router();

//  Configuración MercadoPago
const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

//  URLs dinámicas según entorno
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

//  Crear preferencia de pago y orden
router.post("/checkout", validarJWT, async (req, res) => {
  try {
    const { envio, productos } = req.body;

    if (!envio || !envio.nombre || !envio.email) {
      return res.status(400).json({ error: "Datos de envío incompletos" });
    }

    //  Subtotal
    const subtotal = productos.reduce((acc, p) => acc + p.precio * p.cantidad, 0);

    //  Cálculo envío
    const ENVIO_BASE = 30000;
    const LIMITE_ENVIO_GRATIS = 200000;
    let costoEnvio = 0;
    if (subtotal < LIMITE_ENVIO_GRATIS) {
      const descuento = (subtotal / LIMITE_ENVIO_GRATIS) * ENVIO_BASE;
      costoEnvio = Math.max(ENVIO_BASE - descuento, 0);
    }

    const totalFinal = subtotal + costoEnvio;

    //  Crear orden
    const nuevaOrden = new Orden({
      usuario: req.usuario._id,
      productos,
      envio,
      costoEnvio,
      total: subtotal,
      totalFinal,
      estado: "pendiente",
      estadoEnvio: "pendiente",
      mercadoPago: {}
    });

    const ordenGuardada = await nuevaOrden.save();

    //  Crear preferencia MercadoPago
    const preference = new Preference(mpClient);
    const response = await preference.create({
      body: {
        items: productos.map((p) => ({
          title: p.nombre,
          unit_price: p.precio,
          quantity: p.cantidad,
        })),
        payer: { name: envio.nombre, email: envio.email },
        back_urls: {
          success: `${FRONTEND_URL}/checkout/success`,
          failure: `${FRONTEND_URL}/checkout/failure`,
          pending: `${FRONTEND_URL}/checkout/pending`,
        },
        external_reference: ordenGuardada._id.toString(),
        notification_url: `${BASE_URL}/api/ordenes/webhook`,
      },
    });

    ordenGuardada.external_reference = ordenGuardada._id.toString();
    ordenGuardada.mercadoPago.preference_id = response.id;
    ordenGuardada.mercadoPago.init_point = response.init_point;
    await ordenGuardada.save();

    res.json({
      ok: true,
      ordenId: ordenGuardada._id,
      preferenceId: response.id,
      checkoutUrl: response.init_point,
      estado: ordenGuardada.estado,
      estadoEnvio: ordenGuardada.estadoEnvio,
      total: ordenGuardada.total,
      costoEnvio: ordenGuardada.costoEnvio,
      totalFinal: ordenGuardada.totalFinal,
    });
  } catch (error) {
    console.error("❌ Error en checkout:", error);
    res.status(500).json({ error: "Error al iniciar el checkout" });
  }
});

//  Webhook de MercadoPago
router.post("/webhook", async (req, res) => {
  try {
    const { type, data } = req.body;

    if (type === "payment" && data && data.id) {
      const paymentId = data.id;
      const paymentClient = new Payment(mpClient);
      const payment = await paymentClient.get(paymentId);
      const info = payment.body;

      console.log("🔔 Webhook recibido:", info);

      const orden = await Orden.findById(info.external_reference);
      if (!orden) {
        console.warn("⚠️ Orden no encontrada:", info.external_reference);
        return res.sendStatus(404);
      }

      orden.mercadoPago.paymentId = paymentId;
      orden.mercadoPago.status = info.status;

      if (info.status === "approved") {
        orden.estado = "pagada";
        await Compra.findOneAndUpdate({ ordenId: orden._id }, { estado: "pagada" });
      } else if (info.status === "rejected") {
        orden.estado = "cancelada";
        await Compra.findOneAndUpdate({ ordenId: orden._id }, { estado: "cancelada" });
      }

      await orden.save();
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Error en webhook:", error);
    res.sendStatus(500);
  }
});


//  Cancelar orden
router.delete("/:id", validarJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const orden = await Orden.findById(id);

    if (!orden) {
      return res.status(404).json({ ok: false, error: "Orden no encontrada" });
    }

    if (
      orden.usuario.toString() !== req.usuario._id.toString() &&
      req.usuario.rol !== "ADMIN"
    ) {
      return res.status(403).json({ ok: false, error: "No autorizado para cancelar esta orden" });
    }

    orden.estado = "cancelada";
    await orden.save();

    res.json({ ok: true, message: "Orden cancelada correctamente", orden });
  } catch (error) {
    console.error("❌ Error al cancelar orden:", error);
    res.status(500).json({ ok: false, error: "Error al cancelar orden" });
  }
});

//  Filtrar órdenes con paginación
router.get("/filtrar", validarJWT, async (req, res) => {
  try {
    const { estado, usuarioId, desde, hasta } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const filtro = {};
    if (estado) filtro.estado = estado;
    if (usuarioId) filtro.usuario = usuarioId;

    if (desde || hasta) {
      const rango = {};
      if (desde) rango.$gte = new Date(`${desde}T00:00:00.000Z`);
      if (hasta) rango.$lte = new Date(`${hasta}T23:59:59.999Z`);
      filtro.createdAt = rango;
    }

    const [ordenes, total] = await Promise.all([
      Orden.find(filtro)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Orden.countDocuments(filtro),
    ]);

    res.json({
      ok: true,
      ordenes,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("❌ Error en filtrar ordenes:", error);
    res.status(500).json({ ok: false, error: "Error al filtrar ordenes" });
  }
});

//  Obtener una orden por ID
router.get("/:id", validarJWT, async (req, res) => {
  try {
    const { id } = req.params;

    const orden = await Orden.findById(id)
      .populate("usuario", "nombre apellido correo")
      .populate("productos.productoId", "nombre precio");

    if (!orden) {
      return res.status(404).json({ ok: false, error: "Orden no encontrada" });
    }

    if (
      orden.usuario.toString() !== req.usuario._id.toString() &&
      req.usuario.rol !== "ADMIN"
    ) {
      return res.status(403).json({ ok: false, error: "No autorizado para ver esta orden" });
    }

    res.json({ ok: true, orden });
  } catch (error) {
    console.error("❌ Error al obtener orden:", error);
    res.status(500).json({ ok: false, error: "Error al obtener orden" });
  }
});

module.exports = router;
