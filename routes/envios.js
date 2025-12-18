const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");

// 📦 Cotización con Andreani
router.get("/andreani", async (req, res) => {
  try {
    const { origen, destino, peso } = req.query;

    if (!origen || !destino || !peso) {
      return res.status(400).json({ error: "Faltan parámetros: origen, destino y peso" });
    }

    const url = "https://apis.andreani.com/v1/rates";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.ANDREANI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        originPostalCode: origen,
        destinationPostalCode: destino,
        weight: Number(peso),
        contract: process.env.ANDREANI_CONTRACT
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Error en respuesta de Andreani:", errText);
      return res.status(response.status).json({ error: errText });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error obteniendo cotización Andreani:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

