const fetch = require('node-fetch');
const ANDREANI = require('../config/Andreani');

// 📦 Ejemplo: pedir tarifa con Basic Auth
async function getTarifa({ contrato, payload }) {
  const basicAuth = Buffer.from(`${ANDREANI.user}:${ANDREANI.pass}`).toString('base64');

  const res = await fetch(`${ANDREANI.baseUrl}/v1/tarifa`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${basicAuth}`   // 👈 cambio clave
    },
    body: JSON.stringify({
      cliente: ANDREANI.clientCode,
      contrato,
      ...payload
    })
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Error tarifa Andreani: ${res.status} ${res.statusText} :: ${text}`);
  }

  return res.json();
}

module.exports = { getTarifa };



