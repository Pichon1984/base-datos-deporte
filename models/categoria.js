const { Schema, model } = require("mongoose");

const CategoriaSchema = new Schema({
  nombre: {
    type: String,
    required: [true, "El nombre es obligatorio"],
    unique: true,
    lowercase: true, 
    trim: true      
  },
  descripcion: { type: String, trim: true },
  estado: { type: Boolean, default: true }, 
  usuario: { type: Schema.Types.ObjectId, ref: "Usuario", required: true } 
}, { timestamps: true }); 

module.exports = model("Categoria", CategoriaSchema);


