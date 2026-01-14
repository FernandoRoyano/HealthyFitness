import express from 'express';
import * as notificacionController from '../controllers/notificacionController.js';
import { autenticar } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(autenticar);

// Obtener notificaciones del usuario
router.get('/', notificacionController.obtenerNotificaciones);

// Contar notificaciones no leídas
router.get('/no-leidas/count', notificacionController.contarNoLeidas);

// Marcar todas como leídas
router.put('/marcar-todas-leidas', notificacionController.marcarTodasComoLeidas);

// Marcar notificación como leída
router.put('/:id/leida', notificacionController.marcarComoLeida);

// Eliminar notificación
router.delete('/:id', notificacionController.eliminarNotificacion);

export default router;
