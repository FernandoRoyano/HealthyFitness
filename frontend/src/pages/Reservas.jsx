import { useState, useEffect } from 'react';
import { reservasAPI, clientesAPI, solicitudesCambioAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

function Reservas() {
  const { usuario } = useAuth();
  const [reservas, setReservas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [reservaEditando, setReservaEditando] = useState(null);
  const [mostrarModalSolicitud, setMostrarModalSolicitud] = useState(false);
  const [reservaSolicitud, setReservaSolicitud] = useState(null);
  const [formulario, setFormulario] = useState({
    cliente: '',
    fecha: '',
    horaInicio: '',
    horaFin: '',
    tipoSesion: 'individual',
    estado: 'pendiente',
    notas: '',
    duracion: 60
  });
  const [formularioSolicitud, setFormularioSolicitud] = useState({
    tipoCambio: 'puntual',
    fecha: '',
    horaInicio: '',
    horaFin: '',
    motivoCambio: ''
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [reservasRes, clientesRes] = await Promise.all([
        reservasAPI.obtenerTodas(),
        clientesAPI.obtenerTodos()
      ]);
      setReservas(reservasRes.data);
      setClientes(clientesRes.data);
    } catch {
      setError('Error al cargar datos');
    } finally {
      setCargando(false);
    }
  };

  const handleChange = (e) => {
    setFormulario({
      ...formulario,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const datos = {
        ...formulario,
        entrenador: usuario._id
      };

      if (reservaEditando) {
        await reservasAPI.actualizar(reservaEditando._id, datos);
      } else {
        await reservasAPI.crear(datos);
      }
      cargarDatos();
      cerrarFormulario();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al guardar reserva');
    }
  };

  const handleEditar = (reserva) => {
    setReservaEditando(reserva);
    setFormulario({
      cliente: reserva.cliente._id,
      fecha: new Date(reserva.fecha).toISOString().split('T')[0],
      horaInicio: reserva.horaInicio,
      horaFin: reserva.horaFin,
      tipoSesion: reserva.tipoSesion,
      estado: reserva.estado,
      notas: reserva.notas || '',
      duracion: reserva.duracion || 60
    });
    setMostrarFormulario(true);
  };

  const handleEliminar = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta reserva?')) {
      try {
        await reservasAPI.eliminar(id);
        cargarDatos();
      } catch {
        setError('Error al eliminar reserva');
      }
    }
  };

  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setReservaEditando(null);
    setFormulario({
      cliente: '',
      fecha: '',
      horaInicio: '',
      horaFin: '',
      tipoSesion: 'individual',
      estado: 'pendiente',
      notas: '',
      duracion: 60
    });
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const obtenerColorEstado = (estado) => {
    const colores = {
      pendiente: '#ffc107',
      confirmada: '#007bff',
      completada: '#28a745',
      cancelada: '#dc3545'
    };
    return colores[estado] || '#6c757d';
  };

  const handleSolicitarCambio = (reserva) => {
    setReservaSolicitud(reserva);
    setFormularioSolicitud({
      tipoCambio: 'puntual',
      fecha: new Date(reserva.fecha).toISOString().split('T')[0],
      horaInicio: reserva.horaInicio,
      horaFin: reserva.horaFin,
      motivoCambio: ''
    });
    setMostrarModalSolicitud(true);
  };

  const handleChangeSolicitud = (e) => {
    setFormularioSolicitud({
      ...formularioSolicitud,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmitSolicitud = async (e) => {
    e.preventDefault();
    try {
      const datos = {
        reservaOriginal: reservaSolicitud._id,
        entrenador: usuario._id,
        cliente: reservaSolicitud.cliente._id,
        tipoCambio: formularioSolicitud.tipoCambio,
        datosOriginales: {
          fecha: reservaSolicitud.fecha,
          horaInicio: reservaSolicitud.horaInicio,
          horaFin: reservaSolicitud.horaFin
        },
        datosPropuestos: {
          fecha: formularioSolicitud.fecha,
          horaInicio: formularioSolicitud.horaInicio,
          horaFin: formularioSolicitud.horaFin
        },
        motivoCambio: formularioSolicitud.motivoCambio
      };

      await solicitudesCambioAPI.crear(datos);
      setMostrarModalSolicitud(false);
      setReservaSolicitud(null);
      setError('');
      alert('Solicitud de cambio enviada correctamente');
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al crear solicitud');
    }
  };

  const cerrarModalSolicitud = () => {
    setMostrarModalSolicitud(false);
    setReservaSolicitud(null);
    setFormularioSolicitud({
      tipoCambio: 'puntual',
      fecha: '',
      horaInicio: '',
      horaFin: '',
      motivoCambio: ''
    });
  };

  if (cargando) return <div style={styles.container}>Cargando...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Agenda y Reservas</h1>
        <button
          onClick={() => setMostrarFormulario(true)}
          style={styles.buttonPrimary}
        >
          + Nueva Reserva
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {mostrarFormulario && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2>{reservaEditando ? 'Editar Reserva' : 'Nueva Reserva'}</h2>
              <button onClick={cerrarFormulario} style={styles.closeButton}>×</button>
            </div>
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Cliente*</label>
                <select
                  name="cliente"
                  value={formulario.cliente}
                  onChange={handleChange}
                  required
                  style={styles.input}
                >
                  <option value="">Selecciona un cliente</option>
                  {clientes.map((cliente) => (
                    <option key={cliente._id} value={cliente._id}>
                      {cliente.nombre} {cliente.apellido}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Fecha*</label>
                <input
                  type="date"
                  name="fecha"
                  value={formulario.fecha}
                  onChange={handleChange}
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Hora Inicio*</label>
                  <input
                    type="time"
                    name="horaInicio"
                    value={formulario.horaInicio}
                    onChange={handleChange}
                    required
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Hora Fin*</label>
                  <input
                    type="time"
                    name="horaFin"
                    value={formulario.horaFin}
                    onChange={handleChange}
                    required
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Tipo de Sesión</label>
                  <select
                    name="tipoSesion"
                    value={formulario.tipoSesion}
                    onChange={handleChange}
                    style={styles.input}
                  >
                    <option value="individual">Individual</option>
                    <option value="pareja">En pareja</option>
                    <option value="express">Express</option>
                    <option value="pareja-express">En pareja express</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Estado</label>
                  <select
                    name="estado"
                    value={formulario.estado}
                    onChange={handleChange}
                    style={styles.input}
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="confirmada">Confirmada</option>
                    <option value="completada">Completada</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Duración (minutos)</label>
                <input
                  type="number"
                  name="duracion"
                  value={formulario.duracion}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Notas</label>
                <textarea
                  name="notas"
                  value={formulario.notas}
                  onChange={handleChange}
                  rows="3"
                  style={{...styles.input, resize: 'vertical'}}
                />
              </div>

              <div style={styles.formActions}>
                <button type="button" onClick={cerrarFormulario} style={styles.buttonSecondary}>
                  Cancelar
                </button>
                <button type="submit" style={styles.buttonPrimary}>
                  {reservaEditando ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mostrarModalSolicitud && reservaSolicitud && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2>Solicitar Cambio de Reserva</h2>
              <button onClick={cerrarModalSolicitud} style={styles.closeButton}>×</button>
            </div>
            <form onSubmit={handleSubmitSolicitud} style={styles.form}>
              <div style={styles.infoBox}>
                <h3 style={styles.infoBoxTitle}>Reserva Original</h3>
                <p><strong>Cliente:</strong> {reservaSolicitud.cliente.nombre} {reservaSolicitud.cliente.apellido}</p>
                <p><strong>Fecha:</strong> {formatearFecha(reservaSolicitud.fecha)}</p>
                <p><strong>Horario:</strong> {reservaSolicitud.horaInicio} - {reservaSolicitud.horaFin}</p>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Tipo de Cambio*</label>
                <select
                  name="tipoCambio"
                  value={formularioSolicitud.tipoCambio}
                  onChange={handleChangeSolicitud}
                  required
                  style={styles.input}
                >
                  <option value="puntual">Cambio Puntual (una sola sesión)</option>
                  <option value="permanente">Cambio Permanente (todas las sesiones futuras)</option>
                  <option value="cancelacion">Cancelación Puntual</option>
                  <option value="suspension">Suspensión Temporal</option>
                </select>
              </div>

              {(formularioSolicitud.tipoCambio === 'puntual' || formularioSolicitud.tipoCambio === 'permanente') && (
                <>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Nueva Fecha*</label>
                    <input
                      type="date"
                      name="fecha"
                      value={formularioSolicitud.fecha}
                      onChange={handleChangeSolicitud}
                      required
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.formRow}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Nueva Hora Inicio*</label>
                      <input
                        type="time"
                        name="horaInicio"
                        value={formularioSolicitud.horaInicio}
                        onChange={handleChangeSolicitud}
                        required
                        style={styles.input}
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Nueva Hora Fin*</label>
                      <input
                        type="time"
                        name="horaFin"
                        value={formularioSolicitud.horaFin}
                        onChange={handleChangeSolicitud}
                        required
                        style={styles.input}
                      />
                    </div>
                  </div>
                </>
              )}

              <div style={styles.formGroup}>
                <label style={styles.label}>Motivo del Cambio*</label>
                <textarea
                  name="motivoCambio"
                  value={formularioSolicitud.motivoCambio}
                  onChange={handleChangeSolicitud}
                  rows="4"
                  required
                  placeholder="Explica el motivo de la solicitud..."
                  style={{...styles.input, resize: 'vertical'}}
                />
              </div>

              <div style={styles.formActions}>
                <button type="button" onClick={cerrarModalSolicitud} style={styles.buttonSecondary}>
                  Cancelar
                </button>
                <button type="submit" style={styles.buttonPrimary}>
                  Enviar Solicitud
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={styles.reservasList}>
        {reservas.length === 0 ? (
          <p style={styles.empty}>No hay reservas registradas</p>
        ) : (
          reservas.map((reserva) => (
            <div key={reserva._id} style={styles.reservaCard}>
              <div style={styles.reservaHeader}>
                <div>
                  <h3 style={styles.reservaCliente}>
                    {reserva.cliente.nombre} {reserva.cliente.apellido}
                  </h3>
                  <p style={styles.reservaFecha}>{formatearFecha(reserva.fecha)}</p>
                </div>
                <div
                  style={{
                    ...styles.estadoBadge,
                    backgroundColor: obtenerColorEstado(reserva.estado)
                  }}
                >
                  {reserva.estado}
                </div>
              </div>

              <div style={styles.reservaBody}>
                <div style={styles.reservaInfo}>
                  <span style={styles.infoLabel}>Horario:</span>
                  <span>{reserva.horaInicio} - {reserva.horaFin}</span>
                </div>
                <div style={styles.reservaInfo}>
                  <span style={styles.infoLabel}>Tipo:</span>
                  <span>{reserva.tipoSesion}</span>
                </div>
                <div style={styles.reservaInfo}>
                  <span style={styles.infoLabel}>Duración:</span>
                  <span>{reserva.duracion} minutos</span>
                </div>
                <div style={styles.reservaInfo}>
                  <span style={styles.infoLabel}>Entrenador:</span>
                  <span>{reserva.entrenador.nombre}</span>
                </div>
                {reserva.notas && (
                  <div style={styles.reservaInfo}>
                    <span style={styles.infoLabel}>Notas:</span>
                    <span>{reserva.notas}</span>
                  </div>
                )}
              </div>

              <div style={styles.reservaActions}>
                <button
                  onClick={() => handleSolicitarCambio(reserva)}
                  style={styles.buttonWarning}
                >
                  Solicitar Cambio
                </button>
                <button
                  onClick={() => handleEditar(reserva)}
                  style={styles.buttonEdit}
                >
                  Editar
                </button>
                <button
                  onClick={() => handleEliminar(reserva._id)}
                  style={styles.buttonDelete}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px'
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333'
  },
  buttonPrimary: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '500',
    color: 'white',
    backgroundColor: '#007bff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  buttonSecondary: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
    backgroundColor: '#e0e0e0',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  buttonEdit: {
    padding: '8px 16px',
    fontSize: '14px',
    color: 'white',
    backgroundColor: '#28a745',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  buttonDelete: {
    padding: '8px 16px',
    fontSize: '14px',
    color: 'white',
    backgroundColor: '#dc3545',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  buttonWarning: {
    padding: '8px 16px',
    fontSize: '14px',
    color: 'white',
    backgroundColor: '#ffc107',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  error: {
    padding: '10px',
    backgroundColor: '#fee',
    color: '#c00',
    borderRadius: '4px',
    marginBottom: '20px'
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
    maxWidth: '600px',
    maxHeight: '90vh',
    overflowY: 'auto'
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
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#333'
  },
  input: {
    padding: '8px 12px',
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
  },
  reservasList: {
    display: 'grid',
    gap: '20px'
  },
  reservaCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    padding: '20px'
  },
  reservaHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '15px',
    paddingBottom: '15px',
    borderBottom: '1px solid #eee'
  },
  reservaCliente: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#333',
    margin: '0 0 5px 0'
  },
  reservaFecha: {
    fontSize: '14px',
    color: '#666',
    margin: 0
  },
  estadoBadge: {
    padding: '6px 12px',
    borderRadius: '20px',
    color: 'white',
    fontSize: '12px',
    fontWeight: '500',
    textTransform: 'capitalize'
  },
  reservaBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '15px'
  },
  reservaInfo: {
    display: 'flex',
    gap: '10px',
    fontSize: '14px'
  },
  infoLabel: {
    fontWeight: '600',
    color: '#333',
    minWidth: '100px'
  },
  reservaActions: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
    paddingTop: '15px',
    borderTop: '1px solid #eee'
  },
  empty: {
    padding: '40px',
    textAlign: 'center',
    color: '#666',
    backgroundColor: 'white',
    borderRadius: '8px'
  },
  infoBox: {
    backgroundColor: '#f8f9fa',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '15px',
    border: '1px solid #dee2e6'
  },
  infoBoxTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '10px',
    color: '#333'
  }
};

export default Reservas;
