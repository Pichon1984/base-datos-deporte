const { Schema, model } = require("mongoose");

const OrdenSchema = new Schema(
  {
    usuario: { type: Schema.Types.ObjectId, ref: "Usuario", required: true },

    productos: [
      {
        productoId: { type: Schema.Types.ObjectId, ref: "Producto", required: true },
        nombre: { type: String, required: true },
        precio: { type: Number, required: true },
        cantidad: { type: Number, required: true },
        talle: { type: String },
        envio: { type: String } // método de envío elegido (ej: "Correo Argentino")
      }
    ],

    envio: {
      nombre: { type: String },
      email: { type: String },
      direccion: { type: String, required: true },
      localidad: { type: String, required: true },
      provincia: { type: String, required: true },
      codigoPostal: { type: String },
      telefono: { type: String },
      pais: { type: String }
    },

    costoEnvio: { type: Number, default: 0 }, // costo total de envío
    total: { type: Number, required: true },

    // Estado de la orden (pago)
    estado: {
      type: String,
      enum: ["pendiente", "pagado", "cancelado"],
      default: "pendiente"
    },

    // Estado del envío (gestión logística)
    estadoEnvio: {
      type: String,
      enum: ["pendiente", "preparando", "enviado", "entregado"],
      default: "pendiente"
    },

    // Datos de MercadoPago
    mp_preference_id: { type: String },
    mp_init_point: { type: String },
    mp_payment_id: { type: String },
    mp_status: { type: String },
    mp_status_detail: { type: String },
    external_reference: { type: String },

    fecha: { type: Date, default: Date.now }
  },
  {
    timestamps: true, // agrega createdAt y updatedAt automáticamente
    strict: true      // evita guardar campos no definidos en el schema
  }
);

module.exports = model("Orden", OrdenSchema);








