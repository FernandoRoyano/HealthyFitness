import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authAPI = {
  login: (credenciales) => api.post('/auth/login', credenciales),
  registro: (datos) => api.post('/auth/registro', datos),
  obtenerPerfil: () => api.get('/auth/perfil')
};

export const clientesAPI = {
  obtenerTodos: () => api.get('/clientes'),
  obtenerPorId: (id) => api.get(`/clientes/${id}`),
  crear: (datos) => api.post('/clientes', datos),
  actualizar: (id, datos) => api.put(`/clientes/${id}`, datos),
  eliminar: (id) => api.delete(`/clientes/${id}`),
  importar: (formData) => {
    return api.post('/clientes/importar', formData);
  },
  subirFoto: (id, formData) => {
    return api.post(`/clientes/${id}/foto`, formData);
  },
  eliminarFoto: (id) => api.delete(`/clientes/${id}/foto`)
};

export const reservasAPI = {
  obtenerTodas: (params) => api.get('/reservas', { params }),
  obtenerPorId: (id) => api.get(`/reservas/${id}`),
  crear: (datos) => api.post('/reservas', datos),
  actualizar: (id, datos) => api.put(`/reservas/${id}`, datos),
  eliminar: (id) => api.delete(`/reservas/${id}`)
};

export default api;

export const usersAPI = {
  obtenerTodos: () => api.get('/users'),
  obtenerEntrenadores: () => api.get('/users/entrenadores'),
  crearEntrenador: (datos) => api.post('/users/entrenadores', datos),
  actualizarEntrenador: (id, datos) => api.put(`/users/entrenadores/${id}`, datos),
  resetearPasswordEntrenador: (id, nuevaPassword) => api.put(`/users/entrenadores/${id}/resetear-password`, { nuevaPassword }),
  obtenerClientesPorEntrenador: (id) => api.get(`/users/entrenadores/${id}/clientes`),
  reasignarClientes: (entrenadorOrigenId, entrenadorDestinoId) =>
    api.post('/users/entrenadores/reasignar-clientes', { entrenadorOrigenId, entrenadorDestinoId }),
  subirFoto: (id, formData) => {
    return api.post(`/users/entrenadores/${id}/foto`, formData);
  },
  eliminarFoto: (id) => api.delete(`/users/entrenadores/${id}/foto`)
};

export const solicitudesCambioAPI = {
  obtenerTodas: (params) => api.get('/solicitudes-cambio', { params }),
  obtenerPorId: (id) => api.get(`/solicitudes-cambio/${id}`),
  crear: (datos) => api.post('/solicitudes-cambio', datos),
  aprobar: (id) => api.put(`/solicitudes-cambio/${id}/aprobar`),
  rechazar: (id, motivoRechazo) => api.put(`/solicitudes-cambio/${id}/rechazar`, { motivoRechazo }),
  cancelar: (id) => api.delete(`/solicitudes-cambio/${id}`),
  contarPendientes: () => api.get('/solicitudes-cambio/pendientes/count')
};

export const notificacionesAPI = {
  obtenerTodas: (params) => api.get('/notificaciones', { params }),
  contarNoLeidas: () => api.get('/notificaciones/no-leidas/count'),
  marcarComoLeida: (id) => api.put(`/notificaciones/${id}/leida`),
  marcarTodasComoLeidas: () => api.put('/notificaciones/marcar-todas-leidas'),
  eliminar: (id) => api.delete(`/notificaciones/${id}`)
};

export const plantillasAPI = {
  obtenerTodas: (params) => api.get('/plantillas', { params }),
  obtenerPorId: (id) => api.get(`/plantillas/${id}`),
  obtenerPlantillaBase: (mes, año) => api.get(`/plantillas/base/${mes}/${año}`),
  crear: (datos) => api.post('/plantillas', datos),
  actualizar: (id, datos) => api.put(`/plantillas/${id}`, datos),
  eliminar: (id) => api.delete(`/plantillas/${id}`),
  duplicar: (id, datos) => api.post(`/plantillas/${id}/duplicar`, datos),
  aplicar: (id) => api.post(`/plantillas/${id}/aplicar`),
  añadirSesion: (id, datos) => api.post(`/plantillas/${id}/sesiones`, datos),
  actualizarSesion: (id, sesionId, datos) => api.put(`/plantillas/${id}/sesiones/${sesionId}`, datos),
  eliminarSesion: (id, sesionId) => api.delete(`/plantillas/${id}/sesiones/${sesionId}`)
};

export const productosAPI = {
  // Consultas
  obtenerTodos: (params) => api.get('/productos', { params }),
  obtenerPorId: (id) => api.get(`/productos/${id}`),
  obtenerTarifas: (id) => api.get(`/productos/${id}/tarifas`),
  obtenerPrecio: (params) => api.get('/productos/precio', { params }),
  obtenerTablaPrecios: (soloActivos = true) => api.get('/productos/tabla-precios', { params: { soloActivos } }),

  // Modificaciones (solo gerente)
  crear: (datos) => api.post('/productos', datos),
  actualizar: (id, datos) => api.put(`/productos/${id}`, datos),
  eliminar: (id) => api.delete(`/productos/${id}`),
  guardarTarifa: (id, datos) => api.post(`/productos/${id}/tarifas`, datos),
  guardarTodasTarifas: (id, tarifas) => api.put(`/productos/${id}/tarifas`, { tarifas }),
  eliminarTarifa: (id, tarifaId) => api.delete(`/productos/${id}/tarifas/${tarifaId}`),

  // Inicialización
  inicializar: () => api.post('/productos/inicializar')
};

export const vacacionesAPI = {
  // Consultas
  obtenerTodas: (params) => api.get('/vacaciones', { params }),
  obtenerPorId: (id) => api.get(`/vacaciones/${id}`),
  obtenerMiResumen: (año) => api.get('/vacaciones/mi-resumen', { params: { año } }),
  obtenerResumenEntrenador: (entrenadorId, año) =>
    api.get(`/vacaciones/resumen/${entrenadorId}`, { params: { año } }),
  obtenerResumenGlobal: (año) => api.get('/vacaciones/resumen-global', { params: { año } }),
  contarPendientes: () => api.get('/vacaciones/pendientes/count'),

  // Acciones
  crear: (datos) => api.post('/vacaciones', datos),
  aprobar: (id) => api.put(`/vacaciones/${id}/aprobar`),
  rechazar: (id, motivoRechazo) => api.put(`/vacaciones/${id}/rechazar`, { motivoRechazo }),
  cancelar: (id) => api.delete(`/vacaciones/${id}`)
};

export const facturacionAPI = {
  // ==================== SUSCRIPCIONES ====================
  obtenerSuscripciones: (params) => api.get('/facturacion/suscripciones', { params }),
  obtenerSuscripcionCliente: (clienteId) => api.get(`/facturacion/suscripciones/cliente/${clienteId}`),
  guardarSuscripcion: (clienteId, datos) => api.post(`/facturacion/suscripciones/cliente/${clienteId}`, datos),
  cambiarEstadoSuscripcion: (clienteId, estado) =>
    api.put(`/facturacion/suscripciones/cliente/${clienteId}/estado`, { estado }),
  obtenerClientesSinSuscripcion: () => api.get('/facturacion/suscripciones/clientes-sin-suscripcion'),

  // ==================== ASISTENCIAS ====================
  registrarAsistencia: (datos) => api.post('/facturacion/asistencias', datos),
  obtenerAsistenciasMes: (clienteId, mes, anio) =>
    api.get(`/facturacion/asistencias/cliente/${clienteId}/mes/${mes}/anio/${anio}`),
  marcarRecuperacion: (asistenciaId, datos) =>
    api.put(`/facturacion/asistencias/${asistenciaId}/recuperacion`, datos),
  obtenerInasistenciasPendientes: (clienteId, params) =>
    api.get(`/facturacion/asistencias/cliente/${clienteId}/pendientes`, { params }),

  // ==================== FACTURAS ====================
  obtenerFacturas: (params) => api.get('/facturacion/facturas', { params }),
  obtenerFacturaPorId: (id) => api.get(`/facturacion/facturas/${id}`),
  previewFactura: (clienteId, mes, anio) =>
    api.get('/facturacion/facturas/preview', { params: { clienteId, mes, anio } }),
  generarFactura: (datos) => api.post('/facturacion/facturas', datos),
  crearFacturaManual: (datos) => api.post('/facturacion/facturas/manual', datos),
  generarFacturasMasivas: (mes, anio) => api.post('/facturacion/facturas/masivas', { mes, anio }),
  actualizarFactura: (id, datos) => api.put(`/facturacion/facturas/${id}`, datos),
  registrarPago: (id, datos) => api.post(`/facturacion/facturas/${id}/pago`, datos),
  emitirFactura: (id) => api.put(`/facturacion/facturas/${id}/emitir`),
  anularFactura: (id, motivo) => api.put(`/facturacion/facturas/${id}/anular`, { motivo }),
  obtenerResumenMes: (mes, anio) => api.get(`/facturacion/facturas/resumen/${mes}/${anio}`),

  // ==================== PDF Y EMAIL ====================
  descargarPDF: (id) => api.get(`/facturacion/facturas/${id}/pdf`, { responseType: 'blob' }),
  enviarEmail: (id) => api.post(`/facturacion/facturas/${id}/enviar-email`),
  verificarEmail: () => api.get('/facturacion/email/verificar')
};

export const clientesPotencialesAPI = {
  obtenerTodos: (params) => api.get('/clientes-potenciales', { params }),
  obtenerPorId: (id) => api.get(`/clientes-potenciales/${id}`),
  crear: (datos) => api.post('/clientes-potenciales', datos),
  actualizar: (id, datos) => api.put(`/clientes-potenciales/${id}`, datos),
  cambiarEstado: (id, estado) => api.put(`/clientes-potenciales/${id}/estado`, { estado }),
  eliminar: (id) => api.delete(`/clientes-potenciales/${id}`),
  convertirACliente: (id, datos) => api.post(`/clientes-potenciales/${id}/convertir`, datos),
  obtenerEstadisticas: () => api.get('/clientes-potenciales/stats')
};

export const dashboardAPI = {
  obtenerEstadisticas: () => api.get('/dashboard/stats')
};

export const medicionesAPI = {
  obtenerPorCliente: (clienteId) => api.get(`/mediciones/cliente/${clienteId}`),
  obtenerUltima: (clienteId) => api.get(`/mediciones/cliente/${clienteId}/ultima`),
  crear: (clienteId, datos) => api.post(`/mediciones/cliente/${clienteId}`, datos),
  actualizar: (id, datos) => api.put(`/mediciones/${id}`, datos),
  eliminar: (id) => api.delete(`/mediciones/${id}`)
};

export const centroAPI = {
  obtener: () => api.get('/centro'),
  actualizar: (datos) => api.put('/centro', datos)
};
