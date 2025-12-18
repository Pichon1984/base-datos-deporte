const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");

router.get("/", async (req, res) => {
  try {
    const { amount, payment_method_id } = req.query;

    if (!amount || !payment_method_id) {
      return res.status(400).json({ error: "Faltan parámetros: amount y payment_method_id" });
    }

    // 1. Obtener emisores para la tarjeta
    const issuersRes = await fetch(
      `https://api.mercadopago.com/v1/payment_methods/card_issuers?payment_method_id=${payment_method_id}`,
      { headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` } }
    );
    const issuers = await issuersRes.json();

    if (!issuers.length) {
      return res.status(400).json({ error: "No se encontraron emisores para este método de pago" });
    }

    // Tomamos el primer emisor como ejemplo
    const issuerId = issuers[0].id;

    // 2. Obtener cuotas reales
    const url = `https://api.mercadopago.com/v1/payment_methods/installments?amount=${amount}&payment_method_id=${payment_method_id}&issuer.id=${issuerId}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` }
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Error en respuesta de MercadoPago:", errText);
      return res.status(response.status).json({ error: errText });
    }

    const data = await response.json();

    const resultado = (data || []).map(item => ({
      issuer: item.issuer?.name || payment_method_id,
      payer_costs: item.payer_costs.map(pc => ({
        recommended_message: pc.recommended_message,
        installments: pc.installments,
        installment_amount: pc.installment_amount,
        total_amount: pc.total_amount
      }))
    }));

    res.json(resultado);
  } catch (error) {
    console.error("Error obteniendo cuotas:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;






