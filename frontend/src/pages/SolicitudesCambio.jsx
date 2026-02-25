import { useState, useEffect } from 'react';
import { solicitudesCambioAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Check, X } from 'lucide-react';

function SolicitudesCambio() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('pendiente');
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [procesando, setProcesando] = useState(false);
  const { usuario } = useAuth();

  useEffect(() => {
    cargarSolicitudes();
  }, [filtroEstado]);

  const cargarSolicitudes = async () => {
    try {
      setCargando(true);
      const params = filtroEstado === 'todas' ? {} : { estado: filtroEstado };
      const { data } = await solicitudesCambioAPI.obtenerTodas(params);
      setSolicitudes(data);
    } catch (err) {
      setError('Error al cargar solicitudes');
    } finally {
      setCargando(false);
    }
  };

  const handleAprobar = async (id) => {
    if (!window.confirm('¿Estás seguro de aprobar esta solicitud? Se actualizará la reserva automáticamente.')) {
      return;
    }

    try {
      setProcesando(true);
      await solicitudesCambioAPI.aprobar(id);
      cargarSolicitudes();
      setMostrarModal(false);
      setSolicitudSeleccionada(null);
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al aprobar solicitud');
    } finally {
      setProcesando(false);
    }
  };

  const handleRechazar = async (id) => {
    if (!motivoRechazo.trim()) {
      setError('Debes proporcionar un motivo de rechazo');
      return;
    }

    try {
      setProcesando(true);
      await solicitudesCambioAPI.rechazar(id, motivoRechazo);
      cargarSolicitudes();
      setMostrarModal(false);
      setSolicitudSeleccionada(null);
      setMotivoRechazo('');
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al rechazar solicitud');
    } finally {
      setProcesando(false);
    }
  };

  const handleCancelar = async (id) => {
    if (!window.confirm('¿Estás seguro de cancelar esta solicitud?')) {
      return;
    }

    try {
      await solicitudesCambioAPI.cancelar(id);
      cargarSolicitudes();
      setMostrarModal(false);
      setSolicitudSeleccionada(null);
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al cancelar solicitud');
    }
  };

  const abrirModal = (solicitud) => {
    setSolicitudSeleccionada(solicitud);
    setMostrarModal(true);
    setError('');
    setMotivoRechazo('');
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setSolicitudSeleccionada(null);
    setMotivoRechazo('');
    setError('');
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'pendiente': return '#ffc107';
      case 'aprobado': return '#28a745';
      case 'rechazado': return '#dc3545';
      default: return '#666';
    }
  };

  const getEstadoBadge = (estado) => {
    switch (estado) {
      case 'pendiente': return 'Pendiente';
      case 'aprobado': return 'Aprobado';
      case 'rechazado': return 'Rechazado';
      default: return estado;
    }
  };

  if (cargando) return <div style={styles.container}>Cargando...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Solicitudes de Cambio</h1>
      </div>

      {/* Filtros */}
      <div style={styles.filterContainer}>
        <button
          onClick={() => setFiltroEstado('pendiente')}
          style={{
            ...styles.filterButton,
            ...(filtroEstado === 'pendiente' && styles.filterButtonActive)
          }}
        >
          Pendientes
        </button>
        <button
          onClick={() => setFiltroEstado('aprobado')}
          style={{
            ...styles.filterButton,
            ...(filtroEstado === 'aprobado' && styles.filterButtonActive)
          }}
        >
          Aprobadas
        </button>
        <button
          onClick={() => setFiltroEstado('rechazado')}
          style={{
            ...styles.filterButton,
            ...(filtroEstado === 'rechazado' && styles.filterButtonActive)
          }}
        >
          Rechazadas
        </button>
        <button
          onClick={() => setFiltroEstado('todas')}
          style={{
            ...styles.filterButton,
            ...(filtroEstado === 'todas' && styles.filterButtonActive)
          }}
        >
          Todas
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {/* Lista de solicitudes */}
      <div style={styles.solicitudesList}>
        {solicitudes.length === 0 ? (
          <div style={styles.empty}>
            No hay solicitudes {filtroEstado !== 'todas' && filtroEstado}
          </div>
        ) : (
          solicitudes.map((solicitud) => (
            <div key={solicitud._id} style={styles.solicitudCard} onClick={() => abrirModal(solicitud)}>
              <div style={styles.solicitudHeader}>
                <div>
                  <h3 style={styles.solicitudTitulo}>
                    {solicitud.cliente.nombre} {solicitud.cliente.apellido}
                  </h3>
                  <p style={styles.solicitudSubtitulo}>
                    Entrenador: {solicitud.entrenador.nombre}
                  </p>
                </div>
                <span
                  style={{
                    ...styles.estadoBadge,
                    backgroundColor: getEstadoColor(solicitud.estado)
                  }}
                >
                  {getEstadoBadge(solicitud.estado)}
                </span>
              </div>

              <div style={styles.solicitudBody}>
                <div style={styles.cambioContainer}>
                  <div style={styles.cambioSeccion}>
                    <strong style={styles.cambioLabel}>Horario Actual:</strong>
                    <p style={styles.cambioTexto}>
                      {formatearFecha(solicitud.datosOriginales.fecha)}
                    </p>
                    <p style={styles.cambioTexto}>
                      {solicitud.datosOriginales.horaInicio} - {solicitud.datosOriginales.horaFin}
                    </p>
                  </div>

                  <div style={styles.flechaCambio}>→</div>

                  <div style={styles.cambioSeccion}>
                    <strong style={styles.cambioLabel}>Horario Propuesto:</strong>
                    <p style={styles.cambioTexto}>
                      {formatearFecha(solicitud.datosPropuestos.fecha)}
                    </p>
                    <p style={styles.cambioTexto}>
                      {solicitud.datosPropuestos.horaInicio} - {solicitud.datosPropuestos.horaFin}
                    </p>
                  </div>
                </div>

                {solicitud.motivoCambio && (
                  <div style={styles.motivoContainer}>
                    <strong>Motivo: </strong>{solicitud.motivoCambio}
                  </div>
                )}
              </div>

              <div style={styles.solicitudFooter}>
                <span style={styles.fechaCreacion}>
                  Creado: {new Date(solicitud.createdAt).toLocaleString('es-ES')}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de detalles */}
      {mostrarModal && solicitudSeleccionada && (
        <div style={styles.modal} onClick={cerrarModal}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2>Detalles de la Solicitud</h2>
              <button onClick={cerrarModal} style={styles.closeButton}>×</button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.infoGroup}>
                <strong>Cliente:</strong>
                <p>{solicitudSeleccionada.cliente.nombre} {solicitudSeleccionada.cliente.apellido}</p>
                <p style={styles.infoSecondary}>{solicitudSeleccionada.cliente.email}</p>
              </div>

              <div style={styles.infoGroup}>
                <strong>Entrenador:</strong>
                <p>{solicitudSeleccionada.entrenador.nombre}</p>
                <p style={styles.infoSecondary}>{solicitudSeleccionada.entrenador.email}</p>
              </div>

              <div style={styles.cambioContainer}>
                <div style={styles.cambioSeccionModal}>
                  <strong style={styles.cambioLabelModal}>Horario Actual</strong>
                  <p>{formatearFecha(solicitudSeleccionada.datosOriginales.fecha)}</p>
                  <p>
                    {solicitudSeleccionada.datosOriginales.horaInicio} - {solicitudSeleccionada.datosOriginales.horaFin}
                  </p>
                  <p>Tipo: {solicitudSeleccionada.datosOriginales.tipoSesion}</p>
                  <p>Duración: {solicitudSeleccionada.datosOriginales.duracion} min</p>
                </div>

                <div style={styles.flechaCambioModal}>→</div>

                <div style={styles.cambioSeccionModal}>
                  <strong style={styles.cambioLabelModal}>Horario Propuesto</strong>
                  <p>{formatearFecha(solicitudSeleccionada.datosPropuestos.fecha)}</p>
                  <p>
                    {solicitudSeleccionada.datosPropuestos.horaInicio} - {solicitudSeleccionada.datosPropuestos.horaFin}
                  </p>
                  <p>Tipo: {solicitudSeleccionada.datosPropuestos.tipoSesion}</p>
                  <p>Duración: {solicitudSeleccionada.datosPropuestos.duracion} min</p>
                </div>
              </div>

              {solicitudSeleccionada.motivoCambio && (
                <div style={styles.infoGroup}>
                  <strong>Motivo del Cambio:</strong>
                  <p>{solicitudSeleccionada.motivoCambio}</p>
                </div>
              )}

              {solicitudSeleccionada.estado === 'rechazado' && solicitudSeleccionada.motivoRechazo && (
                <div style={styles.infoGroup}>
                  <strong>Motivo del Rechazo:</strong>
                  <p style={{ color: '#dc3545' }}>{solicitudSeleccionada.motivoRechazo}</p>
                </div>
              )}

              {solicitudSeleccionada.revisadoPor && (
                <div style={styles.infoGroup}>
                  <strong>Revisado por:</strong>
                  <p>{solicitudSeleccionada.revisadoPor.nombre}</p>
                  <p style={styles.infoSecondary}>
                    {new Date(solicitudSeleccionada.fechaRevision).toLocaleString('es-ES')}
                  </p>
                </div>
              )}

              {/* Acciones para solicitudes pendientes */}
              {solicitudSeleccionada.estado === 'pendiente' && (
                <div style={styles.accionesContainer}>
                  {usuario.rol === 'gerente' ? (
                    <>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Motivo del rechazo (opcional):</label>
                        <textarea
                          value={motivoRechazo}
                          onChange={(e) => setMotivoRechazo(e.target.value)}
                          placeholder="Escribe el motivo si vas a rechazar..."
                          style={styles.textarea}
                          rows="3"
                        />
                      </div>

                      <div style={styles.botonesAccion}>
                        <button
                          onClick={() => handleAprobar(solicitudSeleccionada._id)}
                          disabled={procesando}
                          style={styles.buttonAprobar}
                        >
                          {procesando ? 'Procesando...' : <><Check size={14} style={{ marginRight: '4px', display: 'inline' }} /> Aprobar</>}
                        </button>
                        <button
                          onClick={() => handleRechazar(solicitudSeleccionada._id)}
                          disabled={procesando}
                          style={styles.buttonRechazar}
                        >
                          {procesando ? 'Procesando...' : <><X size={14} style={{ marginRight: '4px', display: 'inline' }} /> Rechazar</>}
                        </button>
                      </div>
                    </>
                  ) : (
                    <button
                      onClick={() => handleCancelar(solicitudSeleccionada._id)}
                      style={styles.buttonCancelar}
                    >
                      Cancelar Solicitud
                    </button>
                  )}
                </div>
              )}
            </div>
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
    color: '#333'
  },
  filterContainer: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    flexWrap: 'wrap'
  },
  filterButton: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#666',
    backgroundColor: 'white',
    border: '2px solid #e0e0e0',
    borderRadius: '20px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  filterButtonActive: {
    color: '#10b981',
    borderColor: '#10b981',
    backgroundColor: '#f8fdf6'
  },
  error: {
    padding: '14px',
    backgroundColor: '#fee',
    color: '#c00',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
    border: '1px solid #fcc'
  },
  solicitudesList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
    gap: '20px'
  },
  solicitudCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    padding: '20px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      boxShadow: '0 4px 16px rgba(0,0,0,0.15)'
    }
  },
  solicitudHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '15px',
    paddingBottom: '15px',
    borderBottom: '1px solid #e0e0e0'
  },
  solicitudTitulo: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '5px'
  },
  solicitudSubtitulo: {
    fontSize: '14px',
    color: '#666',
    margin: 0
  },
  estadoBadge: {
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    color: 'white'
  },
  solicitudBody: {
    marginBottom: '15px'
  },
  cambioContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    marginBottom: '15px'
  },
  cambioSeccion: {
    flex: 1
  },
  cambioLabel: {
    display: 'block',
    fontSize: '12px',
    color: '#666',
    marginBottom: '8px',
    textTransform: 'uppercase'
  },
  cambioTexto: {
    fontSize: '14px',
    color: '#333',
    margin: '4px 0'
  },
  flechaCambio: {
    fontSize: '24px',
    color: '#10b981',
    fontWeight: 'bold'
  },
  motivoContainer: {
    backgroundColor: '#f8f9fa',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#666'
  },
  solicitudFooter: {
    paddingTop: '15px',
    borderTop: '1px solid #e0e0e0'
  },
  fechaCreacion: {
    fontSize: '12px',
    color: '#999'
  },
  empty: {
    padding: '60px 20px',
    textAlign: 'center',
    color: '#999',
    fontSize: '16px',
    gridColumn: '1 / -1'
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
    borderRadius: '12px',
    width: '100%',
    maxWidth: '700px',
    maxHeight: '90vh',
    overflowY: 'auto'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid #e0e0e0'
  },
  closeButton: {
    fontSize: '32px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    color: '#666',
    lineHeight: 1
  },
  modalBody: {
    padding: '20px'
  },
  infoGroup: {
    marginBottom: '20px'
  },
  infoSecondary: {
    fontSize: '14px',
    color: '#999',
    margin: '4px 0 0 0'
  },
  cambioSeccionModal: {
    flex: 1,
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px'
  },
  cambioLabelModal: {
    display: 'block',
    fontSize: '14px',
    color: '#10b981',
    marginBottom: '10px',
    fontWeight: '600'
  },
  flechaCambioModal: {
    fontSize: '32px',
    color: '#10b981',
    fontWeight: 'bold'
  },
  accionesContainer: {
    marginTop: '30px',
    paddingTop: '20px',
    borderTop: '2px solid #e0e0e0'
  },
  formGroup: {
    marginBottom: '15px'
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '8px'
  },
  textarea: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    resize: 'vertical',
    fontFamily: 'inherit'
  },
  botonesAccion: {
    display: 'flex',
    gap: '10px'
  },
  buttonAprobar: {
    flex: 1,
    padding: '14px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#28a745',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  buttonRechazar: {
    flex: 1,
    padding: '14px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#dc3545',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  buttonCancelar: {
    width: '100%',
    padding: '14px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#dc3545',
    backgroundColor: 'white',
    border: '2px solid #dc3545',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  }
};

export default SolicitudesCambio;
