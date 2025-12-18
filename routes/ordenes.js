const express = require("express");
const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");
const Orden = require("../models/Orden");
const { validarJWT } = require("../middlewares/validar-jwt");
const { validarRol } = require("../middlewares/validarRol");

const router = express.Router();

// Configuración MercadoPago
const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN
});

// ✅ Crear preferencia de pago y orden
router.post("/checkout", validarJWT, async (req, res) => {
  try {
    const { envio, productos } = req.body;

    // Validación rápida de envío
    if (!envio || !envio.direccion || !envio.localidad || !envio.provincia) {
      return res.status(400).json({ error: "Datos de envío incompletos" });
    }

    // Recalcular total en backend (precio × cantidad + costo de envío)
    const subtotal = productos.reduce(
      (acc, p) => acc + p.precio * p.cantidad,
      0
    );
    const costoEnvioTotal = productos.reduce(
      (acc, p) => acc + (p.costoEnvio || 0),
      0
    );
    const total = subtotal + costoEnvioTotal;

    // Crear orden pendiente
    const nuevaOrden = new Orden({
      envio,
      productos,
      costoEnvio: costoEnvioTotal,
      total,
      usuario: req.usuario._id,
      estado: "pendiente"
    });
    const ordenGuardada = await nuevaOrden.save();

    // Crear preferencia en MercadoPago
    const preference = new Preference(mpClient);
    const response = await preference.create({
      body: {
        items: productos.map(p => ({
          title: `${p.nombre} (${p.envio || "sin envío"})`,
          unit_price: p.precio,
          quantity: p.cantidad
        })),
        payer: {
          name: envio.nombre,
          email: envio.email
        },
        back_urls: {
          success: `${process.env.FRONTEND_URL}/checkout/success/${ordenGuardada._id}`,
          failure: `${process.env.FRONTEND_URL}/checkout/failure/${ordenGuardada._id}`,
          pending: `${process.env.FRONTEND_URL}/checkout/pending/${ordenGuardada._id}`
        },
        auto_return: "approved",
        external_reference: ordenGuardada._id.toString(),
        notification_url: `${process.env.BASE_URL}/api/ordenes/webhook`
      }
    });

    // Actualizar orden con datos de preferencia
    ordenGuardada.external_reference = ordenGuardada._id.toString();
    ordenGuardada.mp_preference_id = response.id;
    ordenGuardada.mp_init_point = response.init_point;
    await ordenGuardada.save();

    res.json({
      ordenId: ordenGuardada._id,
      preferenceId: response.id,
      checkoutUrl: response.init_point,
      estado: ordenGuardada.estado,
      total: ordenGuardada.total,
      costoEnvio: ordenGuardada.costoEnvio
    });
  } catch (error) {
    console.error("Error en checkout:", error);
    res.status(500).json({ error: "Error al iniciar el checkout" });
  }
});

// ✅ Webhook de MercadoPago
router.post("/webhook", async (req, res) => {
  try {
    const { type, data } = req.body;

    if (type === "payment") {
      const paymentClient = new Payment(mpClient);
      const payment = await paymentClient.get({ id: data.id });

      const ordenId = payment.external_reference;
      const status = payment.status;

      const orden = await Orden.findById(ordenId);
      if (orden && orden.mp_payment_id !== String(payment.id)) {
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
    console.error("Error en webhook:", error);
    res.sendStatus(500);
  }
});

// ✅ Órdenes del usuario logueado
router.get("/mias", validarJWT, async (req, res) => {
  try {
    const ordenes = await Orden.find({ usuario: req.usuario._id }).populate(
      "productos.productoId"
    );
    res.json(ordenes);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener tus órdenes" });
  }
});

// ✅ Todas las órdenes (solo admin)
router.get("/", [validarJWT, validarRol(["ADMIN"])], async (req, res) => {
  try {
    const ordenes = await Orden.find()
      .populate("productos.productoId")
      .populate("usuario");
    res.json(ordenes);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener las órdenes" });
  }
});

module.exports = router;
