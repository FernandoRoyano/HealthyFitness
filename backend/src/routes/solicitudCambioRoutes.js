import express from 'express';
import {
  crearSolicitudCambio,
  obtenerSolicitudes,
  obtenerSolicitudPorId,
  aprobarSolicitud,
  rechazarSolicitud,
  cancelarSolicitud,
  contarSolicitudesPendientes
} from '../controllers/solicitudCambioController.js';
import { proteger } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(proteger);

router.get('/', obtenerSolicitudes);
router.get('/pendientes/count', contarSolicitudesPendientes);
router.get('/:id', obtenerSolicitudPorId);
router.post('/', crearSolicitudCambio);
router.put('/:id/aprobar', aprobarSolicitud);
router.put('/:id/rechazar', rechazarSolicitud);
router.delete('/:id', cancelarSolicitud);

export default router;
