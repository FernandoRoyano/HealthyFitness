import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './src/config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import authRoutes from './src/routes/authRoutes.js';
import clienteRoutes from './src/routes/clienteRoutes.js';
import reservaRoutes from './src/routes/reservaRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import solicitudCambioRoutes from './src/routes/solicitudCambioRoutes.js';
import notificacionRoutes from './src/routes/notificacionRoutes.js';
import plantillaRoutes from './src/routes/plantillaRoutes.js';
import productoRoutes from './src/routes/productoRoutes.js';
import vacacionRoutes from './src/routes/vacacionRoutes.js';
import facturacionRoutes from './src/routes/facturacionRoutes.js';
import clientePotencialRoutes from './src/routes/clientePotencialRoutes.js';
import dashboardRoutes from './src/routes/dashboardRoutes.js';
import medicionRoutes from './src/routes/medicionRoutes.js';
import centroRoutes from './src/routes/centroRoutes.js';
import clienteAuthRoutes from './src/routes/clienteAuthRoutes.js';
import clientePortalRoutes from './src/routes/clientePortalRoutes.js';

dotenv.config();

const app = express();

connectDB();

// Configurar CORS
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir todas las peticiones en producción si FRONTEND_URL es '*'
    if (process.env.NODE_ENV === 'production' && process.env.FRONTEND_URL === '*') {
      callback(null, true);
    }
    // Permitir URLs específicas en producción
    else if (process.env.NODE_ENV === 'production' && process.env.FRONTEND_URL) {
      const allowedOrigins = process.env.FRONTEND_URL.split(',').map(url => url.trim());
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
    // Desarrollo: permitir localhost
    else {
      const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:3000'];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // En desarrollo, permitir todo
      }
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos desde la carpeta uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.json({ mensaje: 'API Centro de Entrenamiento Personal' });
});

app.use('/api/auth', authRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/reservas', reservaRoutes);
app.use('/api/users', userRoutes);
app.use('/api/solicitudes-cambio', solicitudCambioRoutes);
app.use('/api/notificaciones', notificacionRoutes);
app.use('/api/plantillas', plantillaRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/vacaciones', vacacionRoutes);
app.use('/api/facturacion', facturacionRoutes);
app.use('/api/clientes-potenciales', clientePotencialRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/mediciones', medicionRoutes);
app.use('/api/centro', centroRoutes);
app.use('/api/cliente-auth', clienteAuthRoutes);
app.use('/api/cliente-portal', clientePortalRoutes);

app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    mensaje: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en puerto ${PORT}`);
  console.log('Rutas de clientes cargadas: /api/clientes');
  console.log('Rutas de usuarios cargadas: /api/users');
});
