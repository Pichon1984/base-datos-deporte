const fetch = require("node-fetch");

async function cotizarEnvio(origen, destino, peso) {
  try {
    const response = await fetch(
      `${process.env.ANDREANI_API_URL}/tarifas?origen=${origen}&destino=${destino}&peso=${peso}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${process.env.ANDREANI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Error Andreani: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ Error en cotizarEnvio:", error.message);
    throw error;
  }
}

module.exports = { cotizarEnvio };




