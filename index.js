require('dotenv').config();
const mongoose = require('mongoose');
const Server = require('./models/server');
const cloudinary = require('cloudinary').v2;

// ✅ Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.API_KEY_CLOUDINARY,
  api_secret: process.env.API_SECRET_CLOUDINARY,
  secure: true
});

// ✅ Función principal
const startServer = async () => {
  try {
    // 🔗 Conexión a MongoDB
    await mongoose.connect(process.env.MONGODB_CNN, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Base de datos conectada');

    // 🚀 Levantar servidor solo si la DB está lista
    const server = new Server();
    server.listen();

  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error);
    process.exit(1); // Detener proceso si falla la conexión
  }
};

startServer();

