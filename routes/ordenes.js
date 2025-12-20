const express = require("express");
const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");
const Orden = require("../models/Orden");
const { validarJWT } = require("../middlewares/validar-jwt");
const { validarRol } = require("../middlewares/validarRol");

const router = express.Router();

// ⚙️ Configuración MercadoPago
const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN
});

// ✅ Crear preferencia de pago y orden
router.post("/checkout", validarJWT, async (req, res) => {
  try {
    const { envio, productos } = req.body;

    if (
      !envio ||
      !envio.nombre ||
      !envio.email ||
      !envio.direccion ||
      !envio.localidad ||
      !envio.provincia
    ) {
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
      estadoEnvio: "pendiente"
    });
    const ordenGuardada = await nuevaOrden.save();

    const preference = new Preference(mpClient);
    const response = await preference.create({
      body: {
        items: productos.map(p => ({
          title: `${p.nombre} (${p.envio || "sin envío"})`,
          unit_price: p.precio,
          quantity: p.cantidad
        })),
        payer: { name: envio.nombre, email: envio.email },
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

    ordenGuardada.external_reference = ordenGuardada._id.toString();
    ordenGuardada.mp_preference_id = response.id;
    ordenGuardada.mp_init_point = response.init_point;
    await ordenGuardada.save();

    res.json({
      ordenId: ordenGuardada._id,
      preferenceId: response.id,
      checkoutUrl: response.init_point,
      estado: ordenGuardada.estado,
      estadoEnvio: ordenGuardada.estadoEnvio,
      total: ordenGuardada.total,
      costoEnvio: ordenGuardada.costoEnvio
    });
  } catch (error) {
    console.error("Error en checkout:", error);
    res.status(500).json({ error: "Error al iniciar el checkout" });
  }
});

// ✅ Webhook de MercadoPago (POST)
router.post("/webhook", async (req, res) => {
  try {
    console.log("🔔 Webhook recibido:", req.body);

    const { type, data } = req.body;

    if (type === "payment" && data?.id) {
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

    res.sendStatus(200); // MercadoPago espera 200 siempre
  } catch (error) {
    console.error("Error en webhook:", error);
    res.sendStatus(500);
  }
});

// (Opcional) Webhook GET por validaciones de MP
router.get("/webhook", (req, res) => {
  res.sendStatus(200);
});

// ✅ Órdenes del usuario logueado
router.get("/mias", validarJWT, async (req, res) => {
  try {
    const ordenes = await Orden.find({ usuario: req.usuario._id })
      .populate("productos.productoId");
    res.json(ordenes);
  } catch (error) {
    console.error("Error al obtener órdenes del usuario:", error);
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
    console.error("Error al obtener todas las órdenes:", error);
    res.status(500).json({ error: "Error al obtener las órdenes" });
  }
});

// ✅ Actualizar estado de envío (solo admin)
router.put("/:id/envio", [validarJWT, validarRol(["ADMIN"])], async (req, res) => {
  try {
    const { id } = req.params;
    const { estadoEnvio } = req.body;

    const estadosValidos = ["pendiente", "preparando", "enviado", "entregado"];
    if (!estadosValidos.includes(estadoEnvio)) {
      return res.status(400).json({ error: "Estado de envío inválido" });
    }

    const orden = await Orden.findById(id);
    if (!orden) return res.status(404).json({ error: "Orden no encontrada" });

    orden.estadoEnvio = estadoEnvio;
    await orden.save();

    res.json({ ok: true, message: "Estado de envío actualizado", orden });
  } catch (error) {
    console.error("Error al actualizar estado de envío:", error);
    res.status(500).json({ error: "Error al actualizar estado de envío" });
  }
});

// ✅ Actualizar estado de pago (solo admin)
router.put("/:id/pago", [validarJWT, validarRol(["ADMIN"])], async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const estadosValidos = ["pendiente", "pagado", "cancelado"];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ error: "Estado de pago inválido" });
    }

    const orden = await Orden.findById(id);
    if (!orden) return res.status(404).json({ error: "Orden no encontrada" });

    orden.estado = estado;
    await orden.save();

    res.json({ ok: true, message: "Estado de pago actualizado", orden });
  } catch (error) {
    console.error("Error al actualizar estado de pago:", error);
    res.status(500).json({ error: "Error al actualizar estado de pago" });
  }
});

// ✅ Filtrar órdenes (solo admin)
router.get("/filtrar", [validarJWT, validarRol(["ADMIN"])], async (req, res) => {
  try {
    const { estado, desde, hasta } = req.query;
    const filtro = {};

    if (estado) filtro.estado = estado;
    if (desde || hasta) {
      filtro.fecha = {};
      if (desde) filtro.fecha.$gte = new Date(desde);
      if (hasta) filtro.fecha.$lte = new Date(hasta);
    }

    const ordenes = await Orden.find(filtro)
      .populate("productos.productoId")
      .populate("usuario");

    res.json(ordenes);
  } catch (error) {
    console.error("Error al filtrar órdenes:", error);
    res.status(500).json({ error: "Error al filtrar órdenes" });
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
    console.error("Error al cancelar orden:", error);
    res.status(500).json({ error: "Error al cancelar orden" });
  }
});

module.exports = router;

