import express from 'express';
import {
  obtenerClientes,
  obtenerClientePorId,
  crearCliente,
  actualizarCliente,
  eliminarCliente,
  importarClientes,
  uploadMiddleware
} from '../controllers/clienteController.js';
import { proteger } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(proteger);

router.route('/')
  .get(obtenerClientes)
  .post(crearCliente);

router.post('/importar', uploadMiddleware, importarClientes);

router.route('/:id')
  .get(obtenerClientePorId)
  .put(actualizarCliente)
  .delete(eliminarCliente);

export default router;
