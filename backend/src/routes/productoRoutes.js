import express from 'express';
import {
  obtenerProductos,
  obtenerProductoPorId,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  obtenerTarifasProducto,
  guardarTarifa,
  guardarTodasTarifas,
  eliminarTarifa,
  obtenerPrecio,
  obtenerTablaPreciosCompleta,
  inicializarProductos
} from '../controllers/productoController.js';
import { proteger, esGerente } from '../middleware/authMiddleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(proteger);

// ==================== CONSULTAS (todos los usuarios) ====================

// Obtener precio unitario (consulta principal para facturación)
// GET /api/productos/precio?producto_id=xxx&dias_semana=2
// GET /api/productos/precio?tipo=individual&dias_semana=3
router.get('/precio', obtenerPrecio);

// Obtener tabla de precios completa
router.get('/tabla-precios', obtenerTablaPreciosCompleta);

// Listar productos
router.get('/', obtenerProductos);

// Obtener producto con tarifas
router.get('/:id', obtenerProductoPorId);

// Obtener tarifas de un producto
router.get('/:id/tarifas', obtenerTarifasProducto);

// ==================== MODIFICACIONES (solo gerente) ====================

// Crear producto
router.post('/', esGerente, crearProducto);

// Actualizar producto
router.put('/:id', esGerente, actualizarProducto);

// Eliminar producto
router.delete('/:id', esGerente, eliminarProducto);

// Guardar una tarifa
router.post('/:id/tarifas', esGerente, guardarTarifa);

// Guardar todas las tarifas de un producto
router.put('/:id/tarifas', esGerente, guardarTodasTarifas);

// Eliminar tarifa específica
router.delete('/:id/tarifas/:tarifaId', esGerente, eliminarTarifa);

// Inicializar datos por defecto (solo gerente, usar una vez)
router.post('/inicializar', esGerente, inicializarProductos);

export default router;
