const { Schema, model } = require("mongoose");

const ProductoSchema = new Schema(
  {
    nombre: { type: String, required: true, trim: true },
    precio: { type: Number, required: true, min: 0 },
    descripcion: { type: String, trim: true },
    imagenes: [{ type: String }],

    stock: { type: Number, default: 0, min: 0 },
    talles: [{ type: String }], // ej: ["38","39","40"]

    // 🔗 Relación con categoría
    categoria: { type: Schema.Types.ObjectId, ref: "Categoria", required: true },

    // 🔗 Relación con usuario (admin que lo creó)
    usuario: { type: Schema.Types.ObjectId, ref: "Usuario", required: true },

    // 📦 Envío
    envio: {
      costo: { type: Number, default: 0, min: 0 },
      tiempo: { type: Number, default: 3, min: 0 }, // días
      metodos: [{ type: String, enum: ["Correo Argentino", "Andreani", "Retiro en tienda", "Otro"] }]
    },

    // 💳 Cuotas
    cuotas: [
      {
        cantidad: { type: Number, min: 1 },
        monto: { type: Number, min: 0 }
      }
    ],

    activo: { type: Boolean, default: true } // 👈 para habilitar/deshabilitar producto sin borrarlo
  },
  { timestamps: true }
);

module.exports = model("Producto", ProductoSchema);

