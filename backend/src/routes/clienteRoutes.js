import express from 'express';
import {
  obtenerClientes,
  obtenerClientePorId,
  crearCliente,
  actualizarCliente,
  eliminarCliente
} from '../controllers/clienteController.js';
import { proteger } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(proteger);

router.route('/')
  .get(obtenerClientes)
  .post(crearCliente);

router.route('/:id')
  .get(obtenerClientePorId)
  .put(actualizarCliente)
  .delete(eliminarCliente);

export default router;
