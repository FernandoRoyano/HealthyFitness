import express from 'express';
import {
  obtenerReservas,
  obtenerReservaPorId,
  crearReserva,
  actualizarReserva,
  eliminarReserva,
  cancelarReserva,
  obtenerSaldoSesiones
} from '../controllers/reservaController.js';
import { proteger } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(proteger);

router.route('/')
  .get(obtenerReservas)
  .post(crearReserva);

// Saldo de sesiones de un cliente
router.get('/saldo/:clienteId', obtenerSaldoSesiones);

router.route('/:id')
  .get(obtenerReservaPorId)
  .put(actualizarReserva)
  .delete(eliminarReserva);

// Cancelar reserva (devuelve sesión si es del centro)
router.put('/:id/cancelar', cancelarReserva);

export default router;
