# Base de Datos Deporte - Backend Ecommerce

Este proyecto es el backend de una aplicación ecommerce especializada en productos deportivos. Proporciona una API REST completa para gestionar usuarios, productos, categorías, carrito de compras, órdenes, pagos y envíos.

## 🚀 Características Principales

- **Autenticación y Autorización**: Sistema de login/registro con JWT y roles de usuario
- **Gestión de Productos**: CRUD completo con talles, stock, imágenes y categorías
- **Carrito de Compras**: Funcionalidad completa de carrito con persistencia
- **Sistema de Pagos**: Integración con MercadoPago para procesar pagos
- **Envíos**: Integración con Andreani y otras opciones de envío
- **Cuotas**: Sistema de financiación para compras
- **Consultas**: Sistema de contacto y soporte al cliente
- **Logs**: Registro de actividades en desarrollo y producción
- **Frontend Integrado**: Sirve el frontend desde la carpeta `public`

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** - Entorno de ejecución
- **Express.js** - Framework web
- **MongoDB** - Base de datos NoSQL
- **Mongoose** - ODM para MongoDB

### Autenticación y Seguridad
- **JWT (JSON Web Tokens)** - Autenticación stateless
- **bcryptjs** - Hashing de contraseñas
- **express-validator** - Validación de datos

### Integraciones Externas
- **MercadoPago** - Procesamiento de pagos
- **Andreani** - Servicio de envíos
- **Cloudinary** - Almacenamiento de imágenes
- **EmailJS** - Envío de correos electrónicos

### Desarrollo
- **Nodemon** - Reinicio automático en desarrollo
- **Morgan** - Logging de requests HTTP
- **CORS** - Configuración de orígenes permitidos
- **Dotenv** - Gestión de variables de entorno

## 📁 Estructura del Proyecto

```
base-datos-deporte/
├── config/                 # Configuraciones específicas
├── controllers/            # Lógica de negocio
├── database/               # Configuración de base de datos
├── helpers/                # Funciones utilitarias
├── logs/                   # Archivos de logs
├── middlewares/            # Middlewares personalizados
├── models/                 # Modelos de datos MongoDB
├── public/                 # Archivos estáticos del frontend
├── routes/                 # Definición de rutas API
├── services/               # Servicios externos (Andreani, etc.)
├── tests/                  # Pruebas automatizadas
├── checkRequires.js        # Verificación de dependencias
├── index.js                # Punto de entrada producción
├── index.local.js          # Punto de entrada desarrollo
├── server.js               # Configuración del servidor
├── package.json            # Dependencias y scripts
└── vercel.json             # Configuración para despliegue
```

## 🔧 Instalación y Configuración

### Prerrequisitos
- Node.js versión 24.x
- MongoDB (local o en la nube)
- Cuenta en MercadoPago (para pagos)
- Cuenta en Andreani (para envíos)
- Cuenta en Cloudinary (para imágenes)

### Instalación

1. **Clona el repositorio:**
   ```bash
   git clone <url-del-repositorio>
   cd base-datos-deporte
   ```

2. **Instala las dependencias:**
   ```bash
   npm install
   ```

3. **Configura las variables de entorno:**
   
   Crea los archivos `.env.development` y `.env.production` en la raíz del proyecto con las siguientes variables:

   ```env
   # Base de datos
   MONGODB_CNN=mongodb://localhost:27017/deporte-db

   # JWT
   JWT_SECRET=tu_jwt_secret_muy_seguro
   JWT_EXPIRE=24h

   # CORS
   ALLOWED_ORIGINS=http://localhost:3000,https://tu-dominio.com

   # MercadoPago
   MP_ACCESS_TOKEN=tu_access_token_de_mercadopago
   MP_PUBLIC_KEY=tu_public_key_de_mercadopago

   # Andreani
   ANDREANI_API_KEY=tu_api_key_andreani
   ANDREANI_CLIENTE=tu_codigo_cliente

   # Cloudinary
   CLOUDINARY_CLOUD_NAME=tu_cloud_name
   CLOUDINARY_API_KEY=tu_api_key
   CLOUDINARY_API_SECRET=tu_api_secret

   # EmailJS
   EMAILJS_SERVICE_ID=tu_service_id
   EMAILJS_TEMPLATE_ID=tu_template_id
   EMAILJS_USER_ID=tu_user_id

   # Entorno
   NODE_ENV=development
   ```

4. **Verifica las dependencias:**
   ```bash
   node checkRequires.js
   ```

## 🚀 Ejecución

### Desarrollo
```bash
npm run dev
```
Inicia el servidor con nodemon y recarga automática en cambios.

### Producción
```bash
npm start
```
Inicia el servidor en modo producción.

El servidor estará disponible en `http://localhost:3000` por defecto.

## 📡 API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/forgot-password` - Recuperar contraseña
- `POST /api/auth/reset-password` - Restablecer contraseña

### Usuarios
- `GET /api/usuarios` - Listar usuarios (admin)
- `POST /api/usuarios` - Crear usuario
- `PUT /api/usuarios/:id` - Actualizar usuario
- `DELETE /api/usuarios/:id` - Eliminar usuario

### Productos
- `GET /api/productos` - Listar productos
- `GET /api/productos/:id` - Obtener producto específico
- `POST /api/productos` - Crear producto (admin)
- `PUT /api/productos/:id` - Actualizar producto (admin)
- `DELETE /api/productos/:id` - Eliminar producto (admin)

### Categorías
- `GET /api/categorias` - Listar categorías
- `POST /api/categorias` - Crear categoría (admin)
- `PUT /api/categorias/:id` - Actualizar categoría (admin)
- `DELETE /api/categorias/:id` - Eliminar categoría (admin)

### Carrito
- `GET /api/carrito` - Obtener carrito del usuario
- `POST /api/carrito` - Agregar producto al carrito
- `PUT /api/carrito/:id` - Actualizar cantidad en carrito
- `DELETE /api/carrito/:id` - Remover producto del carrito

### Órdenes
- `GET /api/ordenes` - Listar órdenes del usuario
- `GET /api/ordenes/:id` - Obtener orden específica
- `POST /api/ordenes` - Crear nueva orden
- `PUT /api/ordenes/:id` - Actualizar orden

### Compras
- `GET /api/compras` - Listar compras del usuario
- `POST /api/compras` - Realizar compra

### Pagos
- `POST /api/pagos/crear-preferencia` - Crear preferencia de pago MercadoPago
- `POST /api/pagos/webhook` - Webhook para notificaciones de pago

### Envíos
- `GET /api/envios/cotizar` - Cotizar envío
- `POST /api/envios/crear` - Crear envío con Andreani

### Consultas
- `GET /api/consultas` - Listar consultas
- `POST /api/consultas` - Crear consulta
- `PUT /api/consultas/:id` - Responder consulta (admin)

### Cuotas
- `GET /api/cuotas/:productoId` - Obtener cuotas disponibles para un producto

## 🗄️ Modelos de Datos

### Usuario
```javascript
{
  nombre: String,
  email: String,
  password: String,
  rol: { type: ObjectId, ref: 'Rol' },
  activo: Boolean,
  google: Boolean
}
```

### Producto
```javascript
{
  nombre: String,
  precio: Number,
  descripcion: String,
  imagenes: [String],
  stock: Number,
  tallesUnidades: [{
    talle: String,
    stock: Number
  }],
  categoria: { type: ObjectId, ref: 'Categoria' },
  usuario: { type: ObjectId, ref: 'Usuario' },
  envio: {
    costo: Number,
    tiempo: Number,
    metodos: [String]
  },
  cuotas: [{
    cantidad: Number,
    monto: Number
  }],
  activo: Boolean
}
```

### Orden/Carrito
```javascript
{
  usuario: { type: ObjectId, ref: 'Usuario' },
  productos: [{
    producto: { type: ObjectId, ref: 'Producto' },
    cantidad: Number,
    talle: String,
    precio: Number
  }],
  total: Number,
  estado: String
}
```

## 🧪 Pruebas

Ejecuta las pruebas automatizadas:
```bash
npm test
```

## 📧 Contacto

Para consultas sobre el proyecto, utiliza el sistema de consultas integrado en la aplicación.

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

Desarrollado con ❤️ para la comunidad deportiva
