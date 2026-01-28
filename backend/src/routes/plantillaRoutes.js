import express from 'express';
import {
  obtenerPlantillas,
  obtenerPlantillaPorId,
  obtenerPlantillaBase,
  crearPlantilla,
  actualizarPlantilla,
  eliminarPlantilla,
  duplicarPlantilla,
  aplicarPlantilla,
  previewSemana,
  aplicarPlantillaASemana,
  añadirSesion,
  eliminarSesion,
  actualizarSesion
} from '../controllers/plantillaController.js';
import { proteger, esGerente } from '../middleware/authMiddleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(proteger);

// Rutas de consulta (accesibles para todos los usuarios autenticados)
router.get('/', obtenerPlantillas);
router.get('/base/:mes/:anio', obtenerPlantillaBase);
router.get('/:id', obtenerPlantillaPorId);

// Rutas de modificación (solo gerente)
router.post('/', esGerente, crearPlantilla);
router.put('/:id', esGerente, actualizarPlantilla);
router.delete('/:id', esGerente, eliminarPlantilla);

// Rutas especiales (solo gerente)
router.post('/:id/duplicar', esGerente, duplicarPlantilla);
router.post('/:id/aplicar', esGerente, aplicarPlantilla);
router.get('/:id/preview-semana', previewSemana);
router.post('/:id/aplicar-semana', esGerente, aplicarPlantillaASemana);

// Rutas para gestionar sesiones dentro de plantillas (solo gerente)
router.post('/:id/sesiones', esGerente, añadirSesion);
router.put('/:id/sesiones/:sesionId', esGerente, actualizarSesion);
router.delete('/:id/sesiones/:sesionId', esGerente, eliminarSesion);

export default router;
