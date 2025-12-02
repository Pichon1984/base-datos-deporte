
const { Schema, model } = require('mongoose');

const categoriaSchema = Schema({
  nombre: { type: String, required: [true, 'el nombre es obligatorio'], unique: true },
  descripcion: { type: String },
  estado: { type: Boolean, required: true, default: true },
  fechaRegistro: { type: Date, default: Date.now },
  usuario: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true }
})

module.exports = model('categoria', categoriaSchema);