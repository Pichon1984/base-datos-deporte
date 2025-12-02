const { Schema, model } = require('mongoose');

const rolSchema = new Schema({
  rol: { type: String, required: [true, 'el rol es obligatorio'] }
}, { collection: 'rols' });

module.exports = model('Rol', rolSchema);

