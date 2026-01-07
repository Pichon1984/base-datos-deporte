const express = require("express");
const router = express.Router();
const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");
const Compra = require("../models/Compra");
const Producto = require("../models/producto");

// Configuración MercadoPago con token privado
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN, // 👈 unificado
});

/**
 * 📌 Crear preferencia de pago desde una compra (para Brick)
 */
router.post("/crear/:compraId", async (req, res) => {
  try {
    const { compraId } = req.params;
    const compra = await Compra.findById(compraId);

    if (!compra) {
      return res.status(404).json({ ok: false, error: "Compra no encontrada" });
    }

    if (compra.estado !== "pendiente") {
      return res.status(400).json({ ok: false, error: "La compra ya fue procesada o pagada" });
    }

    const preference = new Preference(client);

    const items = compra.productos.map(p => ({
      title: p.nombre,
      unit_price: Number(p.precio), // 👈 en pesos
      quantity: Number(p.cantidad),
      currency_id: "ARS",
    }));

    if (compra.costoEnvio > 0) {
      items.push({
        title: "Costo de envío",
        unit_price: Number(compra.costoEnvio), // 👈 en pesos
        quantity: 1,
        currency_id: "ARS",
      });
    }

    const result = await preference.create({
      body: {
        items,
        external_reference: compraId, // vínculo con la compra
      },
    });

    // 👉 devolvemos lo que necesita el Brick
    res.json({
      ok: true,
      id: result.id,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point,
      amount: compra.totalFinal,
    });
  } catch (error) {
    console.error("❌ Error creando preferencia:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * 📌 Procesar pago desde el Brick de MercadoPago
 */
router.post("/procesar", async (req, res) => {
  try {
    const { compraId, amount, cardFormData } = req.body;

    const paymentClient = new Payment(client);

    const payment = await paymentClient.create({
      body: {
        transaction_amount: Number(amount), // 👈 en pesos
        token: cardFormData.token,
        installments: cardFormData.installments,
        payment_method_id: cardFormData.paymentMethodId,
        issuer_id: cardFormData.issuerId,
        payer: {
          email: cardFormData.payer.email,
          identification: {
            type: cardFormData.payer.identification.type,
            number: cardFormData.payer.identification.number,
          },
        },
        external_reference: compraId, // vínculo con la compra
      },
    });

    const compra = await Compra.findById(compraId);
    if (!compra) {
      return res.status(404).json({ ok: false, error: "Compra no encontrada" });
    }

    const estado = payment.status;

    if (estado === "approved") {
      compra.estado = "pagada";
    } else if (estado === "rejected") {
      compra.estado = "fallida";
    } else {
      compra.estado = "pendiente";
    }

    compra.paymentId = payment.id;
    compra.paymentStatus = estado;
    compra.pagoEventos = compra.pagoEventos || [];
    compra.pagoEventos.push({
      status: estado,
      fecha: new Date(),
      paymentId: payment.id,
    });

    await compra.save();

    res.json({ ok: true, compraId: compra._id });
  } catch (error) {
    console.error("❌ Error procesando pago:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

/**
 * 📌 Webhook para notificaciones de pago
 */
router.post("/webhook", async (req, res) => {
  try {
    console.log("🔔 Webhook recibido:", req.body);

    const { type, data } = req.body;
    if (type !== "payment") {
      return res.sendStatus(200);
    }

    const paymentClient = new Payment(client);
    const payment = await paymentClient.get({ id: data.id });

    const estado = payment.status;
    const compraId = payment.external_reference;

    const compra = await Compra.findById(compraId);
    if (!compra) {
      console.warn("⚠️ Compra no encontrada:", compraId);
      return res.sendStatus(200);
    }

    if (estado === "approved" && compra.estado === "pendiente") {
      for (const item of compra.productos) {
        const producto = await Producto.findById(item.productoId);
        if (producto && producto.stock >= item.cantidad) {
          producto.stock -= item.cantidad;
          await producto.save();
        }
      }
      compra.estado = "pagada";
    } else if (estado === "rejected") {
      compra.estado = "fallida";
    } else if (estado === "refunded") {
      compra.estado = "reembolsada";
    }

    compra.paymentId = payment.id;
    compra.paymentStatus = estado;
    compra.pagoEventos = compra.pagoEventos || [];
    compra.pagoEventos.push({
      status: estado,
      fecha: new Date(),
      paymentId: payment.id,
    });

    await compra.save();

    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Error en webhook MercadoPago:", error);
    res.sendStatus(200); // siempre responder 200
  }
});

module.exports = router;
