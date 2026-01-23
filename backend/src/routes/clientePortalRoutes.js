import express from 'express';
import {
  obtenerMisReservas,
  obtenerMiCalendario,
  obtenerMisSesiones,
  obtenerMisMediciones,
  obtenerMiSuscripcion,
  obtenerMisFacturas,
  obtenerDashboard
} from '../controllers/clientePortalController.js';
import { protegerCliente } from '../middleware/clienteAuthMiddleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación de cliente
router.use(protegerCliente);

// Dashboard
router.get('/dashboard', obtenerDashboard);

// Reservas y calendario
router.get('/mis-reservas', obtenerMisReservas);
router.get('/mi-calendario', obtenerMiCalendario);
router.get('/mis-sesiones', obtenerMisSesiones);

// Seguimiento
router.get('/mis-mediciones', obtenerMisMediciones);

// Facturación
router.get('/mi-suscripcion', obtenerMiSuscripcion);
router.get('/mis-facturas', obtenerMisFacturas);

export default router;
