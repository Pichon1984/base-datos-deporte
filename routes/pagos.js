const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");
const Compra = require("../models/compra");
const Producto = require("../models/producto");

// ⚠️ Usar siempre el Access Token de prueba en desarrollo
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN, // TEST-xxxxxxxxxxxx o APP_USR en producción
});

/**
 * 📌 Crear preferencia de pago desde una compra (para Brick)
 * ✅ Sin back_urls ni auto_return para evitar el error de MP
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
      unit_price: Number(Number(p.precio).toFixed(2)),
      quantity: Number(p.cantidad),
      currency_id: "ARS",
    }));

    if (compra.costoEnvio > 0) {
      items.push({
        title: "Costo de envío",
        unit_price: Number(Number(compra.costoEnvio).toFixed(2)),
        quantity: 1,
        currency_id: "ARS",
      });
    }

    const result = await preference.create({
      body: {
        items,
        external_reference: compraId,
        // ❌ Sin back_urls ni auto_return
      },
    });

    res.json({
      ok: true,
      preferenceId: result.id,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point,
      amount: Number(Number(compra.totalFinal).toFixed(2)),
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

    if (!cardFormData?.token) {
      return res.status(400).json({ ok: false, error: "Token de tarjeta no generado" });
    }

    const compra = await Compra.findById(compraId);
    if (!compra) {
      return res.status(404).json({ ok: false, error: "Compra no encontrada" });
    }

    const paymentClient = new Payment(client);

    const monto = Number(amount) > 0
      ? Number(Number(amount).toFixed(2))
      : Number(Number(compra.totalFinal).toFixed(2));

    const payment = await paymentClient.create({
      body: {
        transaction_amount: monto,
        token: cardFormData.token,
        installments: Number(cardFormData.installments),
        payment_method_id: cardFormData.paymentMethodId,
        issuer_id: cardFormData.issuerId,
        payer: {
          email: cardFormData.payer.email,
          identification: {
            type: cardFormData.payer.identification.type,
            number: cardFormData.payer.identification.number,
          },
        },
        external_reference: compraId,
      },
    });

    const estado = payment.status;

    compra.estado =
      estado === "approved" ? "pagada" :
      estado === "rejected" ? "fallida" : "pendiente";

    compra.paymentId = payment.id;
    compra.paymentStatus = estado;
    compra.pagoEventos = Array.isArray(compra.pagoEventos) ? compra.pagoEventos : [];
    compra.pagoEventos.push({
      status: estado,
      fecha: new Date(),
      paymentId: payment.id,
    });

    await compra.save();

    res.json({ ok: true, compraId: compra._id, estado });
  } catch (error) {
    console.error("❌ Error procesando pago:", error);
    res.status(500).json({ ok: false, error: error.message || "Error interno del servidor" });
  }
});

/**
 * 📦 Webhook para notificaciones de pago con transacción MongoDB
 */
router.post("/webhook", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    console.log("🔔 Webhook recibido:", req.body);

    const { type, data } = req.body;
    if (type !== "payment") {
      await session.abortTransaction();
      session.endSession();
      return res.sendStatus(200);
    }

    const paymentClient = new Payment(client);
    const payment = await paymentClient.get({ id: data.id });

    const estado = payment.status;
    const compraId = payment.external_reference;

    const compra = await Compra.findById(compraId).session(session);
    if (!compra) {
      console.warn("⚠️ Compra no encontrada:", compraId);
      await session.abortTransaction();
      session.endSession();
      return res.sendStatus(200);
    }

    if (estado === "approved" && compra.estado === "pendiente") {
      for (const item of compra.productos) {
        const producto = await Producto.findById(item.productoId).session(session);
        if (!producto) {
          throw new Error(`Producto no encontrado: ${item.productoId}`);
        }

        // ✅ Validar y descontar stock por talle si corresponde
        if (item.talle) {
          const talleObj = Array.isArray(producto.tallesUnidades)
            ? producto.tallesUnidades.find(t => t.talle === item.talle)
            : null;

          if (!talleObj || talleObj.stock < item.cantidad) {
            throw new Error(`Stock insuficiente para talle ${item.talle} en ${producto.nombre}`);
          }
          talleObj.stock -= item.cantidad;
        } else {
          if (producto.stock < item.cantidad) {
            throw new Error(`Stock insuficiente para ${producto.nombre}`);
          }
          producto.stock -= item.cantidad;
        }

        // Recalcular stock total desde talles si existen
        producto.stock = Array.isArray(producto.tallesUnidades) && producto.tallesUnidades.length > 0
          ? producto.tallesUnidades.reduce((acc, t) => acc + (t.stock || 0), 0)
          : producto.stock;

        await producto.save({ session });
      }
      compra.estado = "pagada";
    } else if (estado === "rejected") {
      compra.estado = "fallida";
    } else if (estado === "refunded") {
      compra.estado = "reembolsada";
    } else {
      compra.estado = "pendiente";
    }

    compra.paymentId = payment.id;
    compra.paymentStatus = estado;
    compra.pagoEventos = Array.isArray(compra.pagoEventos) ? compra.pagoEventos : [];
    compra.pagoEventos.push({
      status: estado,
      fecha: new Date(),
      paymentId: payment.id,
    });

    await compra.save({ session });

    await session.commitTransaction();
    session.endSession();

    console.log("✅ Webhook MercadoPago procesado con éxito:", compraId, estado);
    res.sendStatus(200);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("❌ Error en webhook MercadoPago:", error);
    res.sendStatus(500);
  }
});

module.exports = router;

