const Compra = require("../models/Compra");
const mercadopago = require("mercadopago");

const iniciarPago = async (req, res) => {
  try {
    // Validar token de MP
    if (!process.env.MP_ACCESS_TOKEN) {
      return res.status(500).json({ error: "Falta MP_ACCESS_TOKEN en variables de entorno" });
    }

    // Configurar cliente MP
    const client = new mercadopago.MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN,
    });
    const preference = new mercadopago.Preference(client);

    // Buscar compra
    const compra = await Compra.findById(req.params.id);
    if (!compra) return res.status(404).json({ error: "Compra no encontrada" });

    if (compra.estado !== "pendiente") {
      return res.status(400).json({ error: "La compra no está pendiente de pago" });
    }

    // Construir preferencia
    const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
    const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

    const items = compra.productos.map((item) => ({
      title: item.nombre,
      unit_price: Number(item.precio) || 0,
      quantity: Number(item.cantidad) || 1,
      currency_id: "ARS",
    }));

    // Si tenés costo de envío en la compra, podés agregarlo como ítem aparte
    if (compra.costoEnvio && Number(compra.costoEnvio) > 0) {
      items.push({
        title: "Costo de envío",
        unit_price: Number(compra.costoEnvio),
        quantity: 1,
        currency_id: "ARS",
      });
    }

    const pref = {
      items,
      back_urls: {
        success: `${FRONTEND_URL}/checkout/success/${compra._id}`,
        failure: `${FRONTEND_URL}/checkout/failure/${compra._id}`,
        pending: `${FRONTEND_URL}/checkout/pending/${compra._id}`,
      },
      auto_return: "approved",
      external_reference: compra._id.toString(),
      notification_url: `${BASE_URL}/api/ordenes/webhook`, 
      payer: {
        email: compra.email || undefined, 
      },
    };

    const mpPref = await preference.create({ body: pref });

    // Responder con init_point
    return res.json({
      ok: true,
      preference_id: mpPref.id,
      init_point: mpPref.init_point,
      sandbox_init_point: mpPref.sandbox_init_point,
    });
  } catch (error) {
    console.error("Error iniciando pago:", error);
    return res.status(500).json({ error: "Error al iniciar pago" });
  }
};

module.exports = { iniciarPago };









