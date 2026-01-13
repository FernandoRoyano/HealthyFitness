import express from 'express';
import {
  obtenerReservas,
  obtenerReservaPorId,
  crearReserva,
  actualizarReserva,
  eliminarReserva
} from '../controllers/reservaController.js';
import { proteger } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(proteger);

router.route('/')
  .get(obtenerReservas)
  .post(crearReserva);

router.route('/:id')
  .get(obtenerReservaPorId)
  .put(actualizarReserva)
  .delete(eliminarReserva);

export default router;
