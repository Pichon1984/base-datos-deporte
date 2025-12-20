const { Schema, model } = require("mongoose");

const UsuarioSchema = new Schema({
  nombre: { type: String, required: true, trim: true },
  apellido: { type: String, required: true, trim: true },
  correo: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, "Correo inválido"]
  },
  password: { type: String, required: true },

  // Campos adicionales del formulario
  telefono: { type: String },
  direccion: { type: String },
  provincia: { type: String },
  localidad: { type: String },
  codigoPostal: { type: String },
  dni: { type: String },

  // Rol y estado
  rol: { type: String, enum: ["ADMIN", "CLIENTE"], default: "CLIENTE" },
  estado: { type: Boolean, default: true },

  // Carrito de compras
  carrito: [
    {
      _id: false,
      productoId: { type: Schema.Types.ObjectId, ref: "Producto", required: true },
      talle: { type: String },
      cantidad: { type: Number, default: 1, min: 1 }
    }
  ],

  // Ubicación opcional
  ubicacion: {
    ciudad: { type: String },
    provincia: { type: String },
    pais: { type: String },
    lat: { type: Number },
    lon: { type: Number },
    updatedAt: { type: Date }
  }
}, { timestamps: true });

// Ocultar campos sensibles en las respuestas
UsuarioSchema.methods.toJSON = function () {
  const { __v, password, ...usuario } = this.toObject();
  return usuario;
};

module.exports = model("Usuario", UsuarioSchema);









