const Compra = require("../models/compra");
const mercadopago = require("mercadopago");

const client = new mercadopago.MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN
});

const preference = new mercadopago.Preference(client);

const iniciarPago = async (req, res) => {
  try {
    const compra = await Compra.findById(req.params.id);
    if (!compra) return res.status(404).json({ error: "Compra no encontrada" });
    if (compra.estado !== "pendiente") {
      return res.status(400).json({ error: "La compra no está pendiente de pago" });
    }

    const pref = {
      items: compra.productos.map((item) => ({
        title: item.nombre,
        unit_price: item.precio,
        quantity: item.cantidad
      })),
      back_urls: {
        success: "http://localhost:5173/pago-exitoso",
        failure: "http://localhost:5173/pago-fallido",
        pending: "http://localhost:5173/pago-pendiente"
      },
      auto_return: "approved",
      external_reference: compra._id.toString()
    };

    const response = await preference.create({ body: pref });

    res.json({ init_point: response.init_point });
  } catch (error) {
    console.error("Error iniciando pago:", error);
    res.status(500).json({ error: "Error al iniciar pago" });
  }
};

module.exports = { iniciarPago };



