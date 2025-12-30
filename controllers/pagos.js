const Compra = require("../models/Compra");
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
        success: `https://react-deporte.netlify.app/checkout/success/${compra._id}`,
        failure: `https://react-deporte.netlify.app/checkout/failure/${compra._id}`,
        pending: `https://react-deporte.netlify.app/checkout/pending/${compra._id}`
      },
      auto_return: "approved",
      external_reference: compra._id.toString(),
      notification_url: `${process.env.BASE_URL}/api/ordenes/webhook`
    };

    const response = await preference.create({ body: pref });
    res.json({ init_point: response.init_point });
  } catch (error) {
    console.error("Error iniciando pago:", error);
    res.status(500).json({ error: "Error al iniciar pago" });
  }
};

module.exports = { iniciarPago };









