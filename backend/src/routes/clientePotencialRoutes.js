import express from 'express';
import {
  obtenerTodos,
  obtenerPorId,
  crear,
  actualizar,
  cambiarEstado,
  eliminar,
  convertirACliente,
  obtenerEstadisticas
} from '../controllers/clientePotencialController.js';
import { proteger } from '../middleware/authMiddleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(proteger);

// GET /api/clientes-potenciales/stats - Estadísticas (debe ir antes de /:id)
router.get('/stats', obtenerEstadisticas);

// GET /api/clientes-potenciales - Listar todos
router.get('/', obtenerTodos);

// GET /api/clientes-potenciales/:id - Obtener uno
router.get('/:id', obtenerPorId);

// POST /api/clientes-potenciales - Crear nuevo
router.post('/', crear);

// PUT /api/clientes-potenciales/:id - Actualizar
router.put('/:id', actualizar);

// PUT /api/clientes-potenciales/:id/estado - Cambiar solo estado
router.put('/:id/estado', cambiarEstado);

// POST /api/clientes-potenciales/:id/convertir - Convertir a cliente
router.post('/:id/convertir', convertirACliente);

// DELETE /api/clientes-potenciales/:id - Eliminar
router.delete('/:id', eliminar);

export default router;
