const Server = require('./models/server');
require('dotenv').config();
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.APi_KEY_CLOUDINARY,
    api_secret: process.env.API_SECRET_CLOUDINARY,
    secure: true
});



const server = new Server();

server.listen();