import express from 'express';
import {
  obtenerEntrenadores,
  obtenerUsuarios,
  crearEntrenador,
  actualizarEntrenador,
  obtenerClientesPorEntrenador,
  reasignarClientes,
  resetearPasswordEntrenador
} from '../controllers/userController.js';
import { proteger } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(proteger);

router.get('/entrenadores', obtenerEntrenadores);
router.post('/entrenadores', crearEntrenador);
router.get('/', obtenerUsuarios);
router.put('/entrenadores/:id', actualizarEntrenador);
router.put('/entrenadores/:id/resetear-password', resetearPasswordEntrenador);
router.get('/entrenadores/:id/clientes', obtenerClientesPorEntrenador);
router.post('/entrenadores/reasignar-clientes', reasignarClientes);

export default router;
