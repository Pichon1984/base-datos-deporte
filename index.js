// index.js
require("dotenv").config();
const mongoose = require("mongoose");
const Server = require("./server");
const cloudinary = require("cloudinary").v2;

// 🛠️ Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// 🔗 Conexión a MongoDB Atlas
mongoose.connect(process.env.MONGODB_CNN)
  .then(() => console.log("✅ Base de datos conectada"))
  .catch((err) => console.error("❌ Error al conectar a MongoDB:", err));

// 🚀 Inicializar servidor
const server = new Server();

// 📦 En producción (Vercel) se exporta la app para que el runtime la use
if (process.env.NODE_ENV === "production") {
  module.exports = server.app;
} else {
  // 📦 En desarrollo se levanta el servidor normalmente
  server.listen();
}
