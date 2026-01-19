import express from 'express';
import {
  crearSolicitudVacaciones,
  obtenerVacaciones,
  obtenerVacacionPorId,
  obtenerResumen,
  cancelarSolicitud,
  aprobarSolicitud,
  rechazarSolicitud,
  obtenerResumenGlobal,
  contarPendientes
} from '../controllers/vacacionController.js';
import { proteger, esGerente } from '../middleware/authMiddleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(proteger);

// Rutas especiales (deben ir antes de /:id para evitar conflictos)
router.get('/pendientes/count', contarPendientes);
router.get('/mi-resumen', obtenerResumen);
router.get('/resumen-global', esGerente, obtenerResumenGlobal);
router.get('/resumen/:entrenadorId', obtenerResumen);

// Rutas CRUD básicas
router.get('/', obtenerVacaciones);
router.post('/', crearSolicitudVacaciones);
router.get('/:id', obtenerVacacionPorId);
router.delete('/:id', cancelarSolicitud);

// Rutas de gestión (solo gerente)
router.put('/:id/aprobar', esGerente, aprobarSolicitud);
router.put('/:id/rechazar', esGerente, rechazarSolicitud);

export default router;
