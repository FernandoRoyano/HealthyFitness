import express from 'express';
import { obtenerEstadisticas } from '../controllers/dashboardController.js';
import { proteger } from '../middleware/authMiddleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(proteger);

// GET /api/dashboard/stats - Obtener estadísticas del dashboard
router.get('/stats', obtenerEstadisticas);

export default router;
