import { useState, useEffect, useCallback } from 'react';
import { solicitudesCambioAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Check, X, ClipboardList, Calendar, FileEdit, Clock } from 'lucide-react';

function AprobacionesCambios() {
  const { usuario } = useAuth();
  const [solicitudes, setSolicitudes] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState('pendiente');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mostrarModalRechazo, setMostrarModalRechazo] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');

  const cargarSolicitudes = useCallback(async () => {
    try {
      setCargando(true);
      const params = filtroEstado !== 'todas' ? { estado: filtroEstado } : {};
      const res = await solicitudesCambioAPI.obtenerTodas(params);
      setSolicitudes(res.data);
    } catch {
      setError('Error al cargar solicitudes');
    } finally {
      setCargando(false);
    }
  }, [filtroEstado]);

  useEffect(() => {
    cargarSolicitudes();
  }, [cargarSolicitudes]);

  const handleAprobar = async (id) => {
    if (!window.confirm('¿Confirmar la aprobación de este cambio de horario?')) {
      return;
    }

    try {
      await solicitudesCambioAPI.aprobar(id);
      cargarSolicitudes();
      setError('');
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al aprobar solicitud');
    }
  };

  const abrirModalRechazo = (solicitud) => {
    setSolicitudSeleccionada(solicitud);
    setMostrarModalRechazo(true);
  };

  const cerrarModalRechazo = () => {
    setMostrarModalRechazo(false);
    setSolicitudSeleccionada(null);
    setMotivoRechazo('');
  };

  const handleRechazar = async (e) => {
    e.preventDefault();
    try {
      await solicitudesCambioAPI.rechazar(solicitudSeleccionada._id, motivoRechazo);
      cargarSolicitudes();
      cerrarModalRechazo();
      setError('');
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al rechazar solicitud');
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatearFechaHora = (fecha) => {
    return new Date(fecha).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const obtenerColorEstado = (estado) => {
    const colores = {
      pendiente: '#ffc107',
      aprobado: '#28a745',
      rechazado: '#dc3545'
    };
    return colores[estado] || '#6c757d';
  };

  if (cargando) return <div style={styles.container}>Cargando...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Aprobación de Cambios de Horario</h1>
          <p style={styles.subtitle}>
            Gestiona las solicitudes de cambio de horario de los entrenadores
          </p>
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.filtros}>
        <button
          onClick={() => setFiltroEstado('pendiente')}
          style={{
            ...styles.botonFiltro,
            ...(filtroEstado === 'pendiente' && styles.botonFiltroActivo)
          }}
        >
          <Clock size={16} style={{ marginRight: '4px', display: 'inline' }} /> Pendientes
        </button>
        <button
          onClick={() => setFiltroEstado('aprobado')}
          style={{
            ...styles.botonFiltro,
            ...(filtroEstado === 'aprobado' && styles.botonFiltroActivo)
          }}
        >
          <Check size={16} style={{ marginRight: '4px', display: 'inline' }} /> Aprobadas
        </button>
        <button
          onClick={() => setFiltroEstado('rechazado')}
          style={{
            ...styles.botonFiltro,
            ...(filtroEstado === 'rechazado' && styles.botonFiltroActivo)
          }}
        >
          <X size={16} style={{ marginRight: '4px', display: 'inline' }} /> Rechazadas
        </button>
        <button
          onClick={() => setFiltroEstado('todas')}
          style={{
            ...styles.botonFiltro,
            ...(filtroEstado === 'todas' && styles.botonFiltroActivo)
          }}
        >
          <ClipboardList size={16} style={{ marginRight: '4px', display: 'inline' }} /> Todas
        </button>
      </div>

      {solicitudes.length === 0 ? (
        <div style={styles.empty}>
          No hay solicitudes {filtroEstado !== 'todas' ? filtroEstado + 's' : ''}
        </div>
      ) : (
        <div style={styles.solicitudesList}>
          {solicitudes.map((solicitud) => (
            <div key={solicitud._id} style={styles.solicitudCard}>
              <div style={styles.solicitudHeader}>
                <div>
                  <h3 style={styles.clienteNombre}>
                    {solicitud.cliente.nombre} {solicitud.cliente.apellido}
                  </h3>
                  <p style={styles.entrenadorNombre}>
                    Entrenador: {solicitud.entrenador.nombre}
                  </p>
                </div>
                <div
                  style={{
                    ...styles.estadoBadge,
                    backgroundColor: obtenerColorEstado(solicitud.estado)
                  }}
                >
                  {solicitud.estado.toUpperCase()}
                </div>
              </div>

              <div style={styles.comparacion}>
                <div style={styles.datosColumna}>
                  <h4 style={styles.columnaTitle}><Calendar size={16} style={{ marginRight: '4px', display: 'inline' }} /> Horario Actual</h4>
                  <div style={styles.datosGrupo}>
                    <div style={styles.datoItem}>
                      <span style={styles.datoLabel}>Fecha:</span>
                      <span>{formatearFecha(solicitud.datosOriginales.fecha)}</span>
                    </div>
                    <div style={styles.datoItem}>
                      <span style={styles.datoLabel}>Horario:</span>
                      <span>
                        {solicitud.datosOriginales.horaInicio} -{' '}
                        {solicitud.datosOriginales.horaFin}
                      </span>
                    </div>
                    <div style={styles.datoItem}>
                      <span style={styles.datoLabel}>Tipo:</span>
                      <span>{solicitud.datosOriginales.tipoSesion}</span>
                    </div>
                    <div style={styles.datoItem}>
                      <span style={styles.datoLabel}>Duración:</span>
                      <span>{solicitud.datosOriginales.duracion} min</span>
                    </div>
                  </div>
                </div>

                <div style={styles.flechaCambio}>→</div>

                <div style={styles.datosColumna}>
                  <h4 style={{...styles.columnaTitle, color: '#007bff'}}>
                    <FileEdit size={16} style={{ marginRight: '4px', display: 'inline' }} /> Horario Propuesto
                  </h4>
                  <div style={{...styles.datosGrupo, backgroundColor: '#e7f3ff'}}>
                    <div style={styles.datoItem}>
                      <span style={styles.datoLabel}>Fecha:</span>
                      <span style={styles.datoDestacado}>
                        {formatearFecha(solicitud.datosPropuestos.fecha)}
                      </span>
                    </div>
                    <div style={styles.datoItem}>
                      <span style={styles.datoLabel}>Horario:</span>
                      <span style={styles.datoDestacado}>
                        {solicitud.datosPropuestos.horaInicio} -{' '}
                        {solicitud.datosPropuestos.horaFin}
                      </span>
                    </div>
                    <div style={styles.datoItem}>
                      <span style={styles.datoLabel}>Tipo:</span>
                      <span style={styles.datoDestacado}>
                        {solicitud.datosPropuestos.tipoSesion}
                      </span>
                    </div>
                    <div style={styles.datoItem}>
                      <span style={styles.datoLabel}>Duración:</span>
                      <span style={styles.datoDestacado}>
                        {solicitud.datosPropuestos.duracion} min
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {solicitud.motivoCambio && (
                <div style={styles.motivoBox}>
                  <strong>Motivo del cambio:</strong> {solicitud.motivoCambio}
                </div>
              )}

              <div style={styles.metadatos}>
                <div style={styles.metadatoItem}>
                  <strong>Solicitado:</strong> {formatearFechaHora(solicitud.createdAt)}
                </div>
                {solicitud.estado !== 'pendiente' && (
                  <>
                    <div style={styles.metadatoItem}>
                      <strong>Revisado:</strong> {formatearFechaHora(solicitud.fechaRevision)}
                    </div>
                    <div style={styles.metadatoItem}>
                      <strong>Por:</strong> {solicitud.revisadoPor?.nombre || 'N/A'}
                    </div>
                  </>
                )}
              </div>

              {solicitud.estado === 'rechazado' && solicitud.motivoRechazo && (
                <div style={styles.motivoRechazoBox}>
                  <strong>Motivo de rechazo:</strong> {solicitud.motivoRechazo}
                </div>
              )}

              {solicitud.estado === 'pendiente' && usuario?.rol === 'gerente' && (
                <div style={styles.acciones}>
                  <button
                    onClick={() => handleAprobar(solicitud._id)}
                    style={styles.buttonAprobar}
                  >
                    <Check size={16} style={{ marginRight: '4px', display: 'inline' }} /> Aprobar Cambio
                  </button>
                  <button
                    onClick={() => abrirModalRechazo(solicitud)}
                    style={styles.buttonRechazar}
                  >
                    <X size={16} style={{ marginRight: '4px', display: 'inline' }} /> Rechazar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {mostrarModalRechazo && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2>Rechazar Solicitud de Cambio</h2>
              <button onClick={cerrarModalRechazo} style={styles.closeButton}>
                ×
              </button>
            </div>
            <form onSubmit={handleRechazar} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Motivo del rechazo (opcional):
                </label>
                <textarea
                  value={motivoRechazo}
                  onChange={(e) => setMotivoRechazo(e.target.value)}
                  rows="4"
                  style={{ ...styles.input, resize: 'vertical' }}
                  placeholder="Explica por qué se rechaza esta solicitud..."
                />
              </div>
              <div style={styles.formActions}>
                <button
                  type="button"
                  onClick={cerrarModalRechazo}
                  style={styles.buttonSecondary}
                >
                  Cancelar
                </button>
                <button type="submit" style={styles.buttonRechazar}>
                  Confirmar Rechazo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1400px',
    margin: '0 auto'
  },
  header: {
    marginBottom: '30px'
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '5px'
  },
  subtitle: {
    fontSize: '14px',
    color: '#666'
  },
  error: {
    padding: '10px',
    backgroundColor: '#fee',
    color: '#c00',
    borderRadius: '4px',
    marginBottom: '20px'
  },
  filtros: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    flexWrap: 'wrap'
  },
  botonFiltro: {
    padding: '10px 20px',
    fontSize: '14px',
    border: '2px solid #ddd',
    borderRadius: '6px',
    backgroundColor: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  botonFiltroActivo: {
    backgroundColor: '#007bff',
    color: 'white',
    borderColor: '#007bff'
  },
  solicitudesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  solicitudCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    padding: '25px'
  },
  solicitudHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px',
    paddingBottom: '15px',
    borderBottom: '2px solid #eee'
  },
  clienteNombre: {
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#333',
    margin: '0 0 5px 0'
  },
  entrenadorNombre: {
    fontSize: '14px',
    color: '#666',
    margin: 0
  },
  estadoBadge: {
    padding: '8px 16px',
    borderRadius: '20px',
    color: 'white',
    fontSize: '13px',
    fontWeight: '600'
  },
  comparacion: {
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    gap: '20px',
    marginBottom: '20px',
    alignItems: 'center'
  },
  datosColumna: {
    flex: 1
  },
  columnaTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#555',
    marginBottom: '15px'
  },
  datosGrupo: {
    backgroundColor: '#f8f9fa',
    padding: '15px',
    borderRadius: '6px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  datoItem: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px'
  },
  datoLabel: {
    fontWeight: '600',
    color: '#555'
  },
  datoDestacado: {
    fontWeight: '600',
    color: '#007bff'
  },
  flechaCambio: {
    fontSize: '32px',
    color: '#007bff',
    fontWeight: 'bold'
  },
  motivoBox: {
    backgroundColor: '#fff9e6',
    padding: '12px',
    borderRadius: '6px',
    borderLeft: '4px solid #ffc107',
    fontSize: '14px',
    marginBottom: '15px'
  },
  motivoRechazoBox: {
    backgroundColor: '#ffe6e6',
    padding: '12px',
    borderRadius: '6px',
    borderLeft: '4px solid #dc3545',
    fontSize: '14px',
    marginTop: '15px'
  },
  metadatos: {
    display: 'flex',
    gap: '20px',
    fontSize: '13px',
    color: '#666',
    paddingTop: '15px',
    borderTop: '1px solid #eee',
    flexWrap: 'wrap'
  },
  metadatoItem: {
    display: 'flex',
    gap: '5px'
  },
  acciones: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
    marginTop: '20px',
    paddingTop: '15px',
    borderTop: '2px solid #eee'
  },
  buttonAprobar: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '500',
    color: 'white',
    backgroundColor: '#28a745',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  buttonRechazar: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '500',
    color: 'white',
    backgroundColor: '#dc3545',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  buttonSecondary: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
    backgroundColor: '#e0e0e0',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  empty: {
    padding: '60px 20px',
    textAlign: 'center',
    color: '#999',
    backgroundColor: 'white',
    borderRadius: '8px',
    fontSize: '16px'
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '8px',
    width: '100%',
    maxWidth: '500px'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid #ddd'
  },
  closeButton: {
    fontSize: '32px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    color: '#666'
  },
  form: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#333'
  },
  input: {
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    outline: 'none'
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '10px'
  }
};

export default AprobacionesCambios;
