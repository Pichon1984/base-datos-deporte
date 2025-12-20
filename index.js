require("dotenv").config();
const mongoose = require("mongoose");
const Server = require("./models/server");
const cloudinary = require("cloudinary").v2;

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.API_KEY_CLOUDINARY,
  api_secret: process.env.API_SECRET_CLOUDINARY,
  secure: true,
});

// Conexión a MongoDB Atlas
mongoose.connect(process.env.MONGODB_CNN)
  .then(() => console.log("✅ Base de datos conectada"))
  .catch(err => console.error("❌ Error al conectar a MongoDB:", err));

// 🚀 Exportar la app para Vercel
const server = new Server();
module.exports = server.app;





