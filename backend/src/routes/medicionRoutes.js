import express from 'express';
import {
  obtenerMedicionesPorCliente,
  crearMedicion,
  actualizarMedicion,
  eliminarMedicion,
  obtenerUltimaMedicion
} from '../controllers/medicionController.js';
import { proteger } from '../middleware/authMiddleware.js';

const router = express.Router();

// Todas las rutas requieren autenticacion
router.use(proteger);

// Rutas de mediciones por cliente
router.get('/cliente/:clienteId', obtenerMedicionesPorCliente);
router.get('/cliente/:clienteId/ultima', obtenerUltimaMedicion);
router.post('/cliente/:clienteId', crearMedicion);

// Rutas de mediciones individuales
router.put('/:id', actualizarMedicion);
router.delete('/:id', eliminarMedicion);

export default router;
