import express from 'express';
import {
  // Suscripciones
  obtenerSuscripciones,
  obtenerSuscripcionPorCliente,
  guardarSuscripcion,
  cambiarEstadoSuscripcion,
  actualizarSesionesAcumuladas,
  obtenerClientesSinSuscripcion,

  // Asistencias
  registrarAsistencia,
  obtenerAsistenciasMes,
  marcarRecuperacion,
  obtenerInasistenciasPendientes,

  // Facturas
  generarFactura,
  generarFacturasMasivas,
  crearFacturaManual,
  obtenerFacturas,
  obtenerFacturaPorId,
  actualizarFactura,
  registrarPago,
  emitirFactura,
  anularFactura,
  obtenerResumenMes,
  previewFactura,

  // PDF y Email
  descargarPDFFactura,
  enviarFacturaEmail,
  verificarEmail
} from '../controllers/facturacionController.js';
import { proteger, esGerente } from '../middleware/authMiddleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(proteger);

// ==================== SUSCRIPCIONES ====================

// GET /api/facturacion/suscripciones
router.get('/suscripciones', obtenerSuscripciones);

// GET /api/facturacion/suscripciones/clientes-sin-suscripcion
router.get('/suscripciones/clientes-sin-suscripcion', obtenerClientesSinSuscripcion);

// GET /api/facturacion/suscripciones/cliente/:clienteId
router.get('/suscripciones/cliente/:clienteId', obtenerSuscripcionPorCliente);

// POST /api/facturacion/suscripciones/cliente/:clienteId
router.post('/suscripciones/cliente/:clienteId', guardarSuscripcion);

// PUT /api/facturacion/suscripciones/cliente/:clienteId
router.put('/suscripciones/cliente/:clienteId', guardarSuscripcion);

// PUT /api/facturacion/suscripciones/cliente/:clienteId/estado
router.put('/suscripciones/cliente/:clienteId/estado', esGerente, cambiarEstadoSuscripcion);

// PUT /api/facturacion/suscripciones/cliente/:clienteId/sesiones-acumuladas
router.put('/suscripciones/cliente/:clienteId/sesiones-acumuladas', esGerente, actualizarSesionesAcumuladas);

// ==================== ASISTENCIAS ====================

// POST /api/facturacion/asistencias
router.post('/asistencias', registrarAsistencia);

// GET /api/facturacion/asistencias/cliente/:clienteId/mes/:mes/anio/:anio
router.get('/asistencias/cliente/:clienteId/mes/:mes/anio/:anio', obtenerAsistenciasMes);

// PUT /api/facturacion/asistencias/:asistenciaId/recuperacion
router.put('/asistencias/:asistenciaId/recuperacion', marcarRecuperacion);

// GET /api/facturacion/asistencias/cliente/:clienteId/pendientes
router.get('/asistencias/cliente/:clienteId/pendientes', obtenerInasistenciasPendientes);

// ==================== FACTURAS ====================

// GET /api/facturacion/facturas/preview
router.get('/facturas/preview', previewFactura);

// GET /api/facturacion/facturas/resumen/:mes/:anio
router.get('/facturas/resumen/:mes/:anio', obtenerResumenMes);

// GET /api/facturacion/facturas
router.get('/facturas', obtenerFacturas);

// POST /api/facturacion/facturas
router.post('/facturas', esGerente, generarFactura);

// POST /api/facturacion/facturas/manual - Crear factura manual sin suscripción
router.post('/facturas/manual', esGerente, crearFacturaManual);

// POST /api/facturacion/facturas/masivas
router.post('/facturas/masivas', esGerente, generarFacturasMasivas);

// GET /api/facturacion/facturas/:id
router.get('/facturas/:id', obtenerFacturaPorId);

// PUT /api/facturacion/facturas/:id
router.put('/facturas/:id', esGerente, actualizarFactura);

// POST /api/facturacion/facturas/:id/pago
router.post('/facturas/:id/pago', esGerente, registrarPago);

// PUT /api/facturacion/facturas/:id/emitir
router.put('/facturas/:id/emitir', esGerente, emitirFactura);

// PUT /api/facturacion/facturas/:id/anular
router.put('/facturas/:id/anular', esGerente, anularFactura);

// ==================== PDF Y EMAIL ====================

// GET /api/facturacion/facturas/:id/pdf - Descargar PDF
router.get('/facturas/:id/pdf', descargarPDFFactura);

// POST /api/facturacion/facturas/:id/enviar-email - Enviar por email
router.post('/facturas/:id/enviar-email', esGerente, enviarFacturaEmail);

// GET /api/facturacion/email/verificar - Verificar configuracion SMTP
router.get('/email/verificar', esGerente, verificarEmail);

export default router;
