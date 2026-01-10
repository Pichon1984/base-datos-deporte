const express = require("express");
const router = express.Router();
const Compra = require("../models/compra");
const fetch = require("node-fetch");

// Confirmar compra con envío
router.post("/compras/confirmar/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { origen, destino, peso } = req.body; // datos para Andreani

    if (!origen || !destino || !peso) {
      return res.status(400).json({ ok: false, error: "Datos de envío incompletos" });
    }

    const compra = await Compra.findById(id);
    if (!compra) {
      return res.status(404).json({ ok: false, error: "Compra no encontrada" });
    }

    // 👉 Cotizar con Andreani
    const url = `${process.env.ANDREANI_API_URL}/rates`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.ANDREANI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        originPostalCode: origen,
        destinationPostalCode: destino,
        weight: Number(peso),
        contract: process.env.ANDREANI_CONTRACT,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("❌ Error en Andreani:", errText);
      return res.status(response.status).json({ ok: false, error: errText });
    }

    const data = await response.json();
    console.log("📦 Respuesta Andreani:", data);

    const costoEnvio = data.total || data.price || 0; // ajustar según respuesta real

    // 👉 Guardar costo de envío en la compra
    compra.costoEnvio = costoEnvio;
    compra.totalFinal = compra.total + costoEnvio; // 👈 usar compra.total
    compra.estadoEnvio = "pendiente"; // inicial
    await compra.save();

    res.json({ ok: true, compra });
  } catch (error) {
    console.error("❌ Error confirmando compra:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

module.exports = router;
