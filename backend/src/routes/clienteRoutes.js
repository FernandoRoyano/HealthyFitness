import express from 'express';
import {
  obtenerClientes,
  obtenerClientePorId,
  crearCliente,
  actualizarCliente,
  eliminarCliente,
  importarClientes,
  uploadMiddleware,
  imageUploadMiddleware,
  subirFotoCliente,
  eliminarFotoCliente
} from '../controllers/clienteController.js';
import { proteger } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(proteger);

router.route('/')
  .get(obtenerClientes)
  .post(crearCliente);

router.post('/importar', uploadMiddleware, importarClientes);

// Rutas de foto - deben ir ANTES de /:id
router.route('/:id/foto')
  .post(imageUploadMiddleware, subirFotoCliente)
  .delete(eliminarFotoCliente);

router.route('/:id')
  .get(obtenerClientePorId)
  .put(actualizarCliente)
  .delete(eliminarCliente);

export default router;
