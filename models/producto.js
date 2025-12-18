const { Schema, model } = require("mongoose");

const ProductoSchema = new Schema({
  nombre: { type: String, required: true },
  precio: { type: Number, required: true },
  descripcion: String,
  imagenes: [String],
  stock: { type: Number, default: 0 },
  talles: [String],

  // 🔗 Relación con categoría
  categoria: { type: Schema.Types.ObjectId, ref: "Categoria", required: true },

  // 🔗 Relación con usuario (admin que lo creó)
  usuario: { type: Schema.Types.ObjectId, ref: "Usuario", required: true },

  // 📦 Envío
  envio: {
    costo: { type: Number, default: 0 },
    tiempo: { type: Number, default: 3 }, // días
    metodos: [{ type: String }]
  },

  // 💳 Cuotas
  cuotas: [
    {
      cantidad: { type: Number },
      monto: { type: Number }
    }
  ]
}, { timestamps: true });

module.exports = model("Producto", ProductoSchema);
