const express = require("express");
const router = express.Router();
const { MercadoPagoConfig, Preference } = require("mercadopago");

// Configuración MercadoPago con token privado
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN
});

// 📦 Crear preferencia de pago
router.post("/crear", async (req, res) => {
  try {
    const { titulo, precio, cantidad } = req.body;

    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [
          {
            title: titulo,
            unit_price: Number(precio),
            quantity: Number(cantidad)
          }
        ],
        back_urls: {
          success: process.env.MERCADOPAGO_SUCCESS_URL,
          failure: process.env.MERCADOPAGO_FAILURE_URL,
          pending: process.env.MERCADOPAGO_PENDING_URL
        },
        auto_return: "approved",
        notification_url: process.env.MERCADOPAGO_WEBHOOK_URL
      }
    });

    res.json({ id: result.id, init_point: result.init_point });
  } catch (error) {
    console.error("❌ Error creando preferencia:", error);
    res.status(500).json({ error: error.message });
  }
});

// 📦 Webhook para notificaciones de pago
router.post("/webhook", async (req, res) => {
  try {
    console.log("🔔 Webhook recibido:", req.body);
    // Guardar estado de pago en DB según req.body
    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Error en webhook:", error);
    res.sendStatus(500);
  }
});

module.exports = router;

