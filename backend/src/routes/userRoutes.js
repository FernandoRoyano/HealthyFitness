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
import { proteger } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(proteger);

router.get('/', obtenerUsuarios);
router.get('/entrenadores', obtenerEntrenadores);
router.post('/entrenadores', crearEntrenador);

// Rutas sin :id primero
router.post('/entrenadores/reasignar-clientes', reasignarClientes);

// Rutas con :id/subruta antes de rutas con solo :id
router.put('/entrenadores/:id/resetear-password', resetearPasswordEntrenador);
router.get('/entrenadores/:id/clientes', obtenerClientesPorEntrenador);

// Rutas de foto
router.route('/entrenadores/:id/foto')
  .post(userImageUploadMiddleware, subirFotoEntrenador)
  .delete(eliminarFotoEntrenador);

// Rutas genéricas con :id al final
router.put('/entrenadores/:id', actualizarEntrenador);

export default router;
