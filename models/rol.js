const { Schema, model } = require('mongoose');

const rolSchema = new Schema({
  rol: { type: String, required: [true, 'el rol es obligatorio'] }
}, { collection: 'rols' }); // 👈 esto fuerza el nombre correcto

module.exports = model('Rol', rolSchema);

