import express from 'express';
import { obtenerCentro, actualizarCentro } from '../controllers/centroController.js';
import { proteger, esGerente } from '../middleware/authMiddleware.js';

const router = express.Router();

// Todas las rutas requieren autenticacion
router.use(proteger);

// Obtener datos del centro (cualquier usuario autenticado)
router.get('/', obtenerCentro);

// Actualizar datos del centro (solo gerente)
router.put('/', esGerente, actualizarCentro);

export default router;
