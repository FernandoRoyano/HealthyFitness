import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './src/config/database.js';
import authRoutes from './src/routes/authRoutes.js';
import clienteRoutes from './src/routes/clienteRoutes.js';
import reservaRoutes from './src/routes/reservaRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import solicitudCambioRoutes from './src/routes/solicitudCambioRoutes.js';

dotenv.config();

const app = express();

connectDB();

// Configurar CORS
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL || '*'
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({ mensaje: 'API Centro de Entrenamiento Personal' });
});

app.use('/api/auth', authRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/reservas', reservaRoutes);
app.use('/api/users', userRoutes);
app.use('/api/solicitudes-cambio', solicitudCambioRoutes);

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
});
