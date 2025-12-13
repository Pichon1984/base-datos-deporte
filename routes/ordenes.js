const express = require("express");
const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");
const Orden = require("../models/Orden");
const { validarJWT } = require("../middlewares/validar-jwt");

const router = express.Router();

// Configuración MercadoPago con tu Access Token
const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN
});

// ✅ Crear preferencia de pago y orden
router.post("/checkout", validarJWT, async (req, res) => {
  try {
    const { cliente, productos, total } = req.body;

    // Creamos la orden en estado pendiente
    const nuevaOrden = new Orden({
      cliente,
      productos,
      total,
      usuario: req.usuario._id
    });
    const ordenGuardada = await nuevaOrden.save();

    // Creamos preferencia de pago en MercadoPago
    const preference = new Preference(mpClient);

    const response = await preference.create({
      body: {
        items: productos.map(p => ({
          title: p.nombre,
          unit_price: p.precio,
          quantity: p.cantidad
        })),
        payer: {
          name: cliente.nombre,
          email: cliente.email
        },
        back_urls: {
          success: `http://localhost:3000/checkout/success/${ordenGuardada._id}`,
          failure: `http://localhost:3000/checkout/failure/${ordenGuardada._id}`
        },
        auto_return: "approved",
        external_reference: ordenGuardada._id.toString()
      }
    });

    res.json({ checkoutUrl: response.init_point });
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
      const status = payment.status; // approved, pending, rejected

      if (status === "approved") {
        await Orden.findByIdAndUpdate(ordenId, { estado: "pagado" });
      } else if (status === "rejected") {
        await Orden.findByIdAndUpdate(ordenId, { estado: "cancelado" });
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Error en webhook:", error);
    res.sendStatus(500);
  }
});

// ✅ Obtener órdenes del usuario logueado
router.get("/mias", validarJWT, async (req, res) => {
  try {
    const ordenes = await Orden.find({ usuario: req.usuario._id })
      .populate("productos.productoId");
    res.json(ordenes);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener tus órdenes" });
  }
});

// ✅ Obtener todas las órdenes (solo admin)
router.get("/", validarJWT, async (req, res) => {
  try {
    if (req.usuario.rol !== "ADMIN") {
      return res.status(403).json({ error: "Acceso denegado" });
    }
    const ordenes = await Orden.find()
      .populate("productos.productoId")
      .populate("usuario");
    res.json(ordenes);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener las órdenes" });
  }
});

module.exports = router;







