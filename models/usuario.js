const { Schema, model } = require("mongoose");
const bcrypt = require("bcryptjs");

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

  telefono: { type: String },
  direccion: { type: String },
  provincia: { type: String },
  localidad: { type: String },
  codigoPostal: { type: String },
  dni: { type: String },

  rol: { type: String, enum: ["ADMIN", "CLIENTE"], default: "CLIENTE" },
  estado: { type: Boolean, default: true },

  carrito: [
    {
      _id: false,
      productoId: { type: Schema.Types.ObjectId, ref: "Producto", required: true },
      talle: { type: String },
      cantidad: { type: Number, default: 1, min: 1 }
    }
  ],

  ubicacion: {
    ciudad: { type: String },
    provincia: { type: String },
    pais: { type: String },
    lat: { type: Number },
    lon: { type: Number },
    lastUpdate: { type: Date }
  },

  resetToken: { type: String, default: null },
  resetTokenExpire: { type: Date, default: null }

}, { timestamps: true });

// 👉 Middleware para hashear automáticamente la contraseña
UsuarioSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Ocultar campos sensibles en las respuestas
UsuarioSchema.methods.toJSON = function () {
  const { __v, password, resetToken, resetTokenExpire, ...usuario } = this.toObject();
  return usuario;
};

module.exports = model("Usuario", UsuarioSchema);
