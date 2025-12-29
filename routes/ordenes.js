const express = require("express");
const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");
const Orden = require("../models/Orden");
const { validarJWT } = require("../middlewares/validar-jwt");

const router = express.Router();

// ⚙️ Configuración MercadoPago
const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

// ✅ Crear preferencia de pago y orden
router.post("/checkout", validarJWT, async (req, res) => {
  try {
    const { envio, productos } = req.body;

    if (!envio || !envio.nombre || !envio.email) {
      return res.status(400).json({ error: "Datos de envío incompletos" });
    }

    const subtotal = productos.reduce((acc, p) => acc + p.precio * p.cantidad, 0);
    const costoEnvioTotal = productos.reduce((acc, p) => acc + (p.costoEnvio || 0), 0);
    const total = subtotal + costoEnvioTotal;

    const nuevaOrden = new Orden({
      envio,
      productos,
      costoEnvio: costoEnvioTotal,
      total,
      usuario: req.usuario._id,
      estado: "pendiente",
      estadoEnvio: "pendiente",
    });
    const ordenGuardada = await nuevaOrden.save();

    const preference = new Preference(mpClient);
    const response = await preference.create({
      body: {
        items: productos.map(p => ({
          title: p.nombre,
          unit_price: p.precio,
          quantity: p.cantidad,
        })),
        payer: { name: envio.nombre, email: envio.email },
        back_urls: {
          success: `${process.env.FRONTEND_URL}/checkout/success/${ordenGuardada._id}`,
          failure: `${process.env.FRONTEND_URL}/checkout/failure/${ordenGuardada._id}`,
          pending: `${process.env.FRONTEND_URL}/checkout/pending/${ordenGuardada._id}`,
        },
        auto_return: "approved",
        external_reference: ordenGuardada._id.toString(),
        notification_url: `${process.env.BASE_URL}/api/ordenes/webhook`,
      },
    });

    ordenGuardada.external_reference = ordenGuardada._id.toString();
    ordenGuardada.mp_preference_id = response.id;
    ordenGuardada.mp_init_point = response.init_point;
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
    });
  } catch (error) {
    console.error("❌ Error en checkout:", error);
    res.status(500).json({ error: "Error al iniciar el checkout" });
  }
});

// ✅ Webhook de MercadoPago
router.post("/webhook", async (req, res) => {
  try {
    const { type, data } = req.body;

    if (type === "payment" && data?.id) {
      const paymentClient = new Payment(mpClient);
      const payment = await paymentClient.get({ id: data.id });

      const ordenId = payment.external_reference;
      const status = payment.status;

      const orden = await Orden.findById(ordenId);
      if (orden) {
        orden.mp_payment_id = String(payment.id);
        orden.mp_status = payment.status;
        orden.mp_status_detail = payment.status_detail;
        orden.estado =
          status === "approved"
            ? "pagado"
            : status === "rejected"
            ? "cancelado"
            : "pendiente";
        await orden.save();
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Error en webhook:", error);
    res.sendStatus(500);
  }
});

// ✅ Cancelar orden (Admin o Cliente dueño)
router.delete("/:id", validarJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const orden = await Orden.findById(id);

    if (!orden) {
      return res.status(404).json({ error: "Orden no encontrada" });
    }

    if (
      orden.usuario.toString() !== req.usuario._id.toString() &&
      req.usuario.rol !== "ADMIN"
    ) {
      return res.status(403).json({ error: "No autorizado para cancelar esta orden" });
    }

    orden.estado = "cancelado";
    await orden.save();

    res.json({ ok: true, message: "Orden cancelada correctamente", orden });
  } catch (error) {
    console.error("❌ Error al cancelar orden:", error);
    res.status(500).json({ error: "Error al cancelar orden" });
  }
});

// ✅ Filtrar órdenes con paginación
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
    res.status(500).json({ error: "Error al filtrar ordenes" });
  }
});

module.exports = router;
