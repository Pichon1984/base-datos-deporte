const { Schema, model } = require("mongoose");

const CategoriaSchema = new Schema({
  nombre: {
    type: String,
    required: [true, "El nombre es obligatorio"],
    unique: true,
    lowercase: true, // siempre guarda en minúsculas
    trim: true       // elimina espacios extra
  },
  descripcion: { type: String, trim: true },
  estado: { type: Boolean, required: true, default: true }, // activo/inactivo
  fechaRegistro: { type: Date, default: Date.now },
  usuario: { type: Schema.Types.ObjectId, ref: "Usuario", required: true } // quién creó la categoría
});

module.exports = model("Categoria", CategoriaSchema);




