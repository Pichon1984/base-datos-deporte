const { Schema, model } = require("mongoose");

const OrdenSchema = new Schema({
  usuario: { type: Schema.Types.ObjectId, ref: "Usuario", required: true },
  productos: [
    {
      productoId: { type: Schema.Types.ObjectId, ref: "Producto", required: true },
      nombre: String,
      precio: Number,
      cantidad: Number,
      talle: String,
      envio: String // 🔹 método de envío elegido (ej: "Correo Argentino")
    }
  ],
  envio: {
    nombre: String,
    email: String,
    direccion: String,
    localidad: String,
    provincia: String,
    codigoPostal: String,
    telefono: String
  },
  costoEnvio: { type: Number, default: 0 }, // 🔹 costo total de envío
  total: { type: Number, required: true },
  estado: { type: String, default: "pendiente" },
  mp_preference_id: String,
  mp_init_point: String,
  mp_payment_id: String,
  mp_status: String,
  mp_status_detail: String,
  external_reference: String,
  fecha: { type: Date, default: Date.now }
});

module.exports = model("Orden", OrdenSchema);







