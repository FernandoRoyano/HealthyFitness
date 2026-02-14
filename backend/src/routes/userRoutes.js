import express from 'express';
import {
  obtenerEntrenadores,
  obtenerUsuarios,
  crearEntrenador,
  actualizarEntrenador,
  obtenerClientesPorEntrenador,
  reasignarClientes,
  resetearPasswordEntrenador,
  userImageUploadMiddleware,
  subirFotoEntrenador,
  eliminarFotoEntrenador
} from '../controllers/userController.js';
import { proteger, esGerente } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(proteger);

// Rutas de lectura (accesibles por cualquier usuario autenticado)
router.get('/entrenadores', obtenerEntrenadores);
router.get('/entrenadores/:id/clientes', obtenerClientesPorEntrenador);

// Rutas de gestión (solo gerente)
router.get('/', esGerente, obtenerUsuarios);
router.post('/entrenadores', esGerente, crearEntrenador);
router.post('/entrenadores/reasignar-clientes', esGerente, reasignarClientes);
router.put('/entrenadores/:id/resetear-password', esGerente, resetearPasswordEntrenador);
router.put('/entrenadores/:id', esGerente, actualizarEntrenador);

// Rutas de foto (solo gerente)
router.route('/entrenadores/:id/foto')
  .post(esGerente, userImageUploadMiddleware, subirFotoEntrenador)
  .delete(esGerente, eliminarFotoEntrenador);

export default router;
