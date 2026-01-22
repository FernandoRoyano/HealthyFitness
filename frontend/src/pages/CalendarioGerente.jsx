import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { reservasAPI, clientesAPI, usersAPI } from '../services/api';
import CalendarioSemanal from '../components/CalendarioSemanal';

function CalendarioGerente() {
  useAuth();
  const [entrenadores, setEntrenadores] = useState([]);
  const [entrenadorSeleccionado, setEntrenadorSeleccionado] = useState(null);
  const [reservas, setReservas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [reservaEditando, setReservaEditando] = useState(null);
  const [formulario, setFormulario] = useState({
    cliente: '',
    entrenador: '',
    fecha: '',
    horaInicio: '',
    horaFin: '',
    tipoSesion: 'personal',
    estado: 'confirmada',
    notas: '',
    duracion: 60
  });

  useEffect(() => {
    cargarEntrenadores();
    cargarClientes();
  }, []);

  useEffect(() => {
    if (entrenadorSeleccionado) {
      cargarReservasEntrenador(entrenadorSeleccionado);
    }
  }, [entrenadorSeleccionado]);

  const cargarEntrenadores = async () => {
    try {
      const { data } = await usersAPI.obtenerEntrenadores();
      setEntrenadores(data);
      if (data.length > 0) {
        setEntrenadorSeleccionado(data[0]._id);
      }
    } catch {
      setError('Error al cargar entrenadores');
    } finally {
      setCargando(false);
    }
  };

  const cargarClientes = async () => {
    try {
      const { data } = await clientesAPI.obtenerTodos();
      setClientes(data);
    } catch {
      setError('Error al cargar clientes');
    }
  };

  const cargarReservasEntrenador = async (entrenadorId) => {
    try {
      const { data } = await reservasAPI.obtenerTodas({ entrenador: entrenadorId });
      setReservas(data);
    } catch {
      setError('Error al cargar reservas');
    }
  };

  // Calcular hora fin basada en hora inicio y duración
  const calcularHoraFin = (horaInicio, duracion) => {
    const [horas, minutos] = horaInicio.split(':').map(Number);
    const totalMinutos = horas * 60 + minutos + duracion;
    const nuevaHora = Math.floor(totalMinutos / 60);
    const nuevosMin = totalMinutos % 60;
    return `${nuevaHora.toString().padStart(2, '0')}:${nuevosMin.toString().padStart(2, '0')}`;
  };

  const handleAgregarReserva = (fecha, hora) => {
    const duracionDefault = 60;
    const horaFinStr = calcularHoraFin(hora, duracionDefault);

    setFormulario({
      cliente: '',
      entrenador: entrenadorSeleccionado,
      fecha: fecha.toISOString().split('T')[0],
      horaInicio: hora,
      horaFin: horaFinStr,
      tipoSesion: 'personal',
      estado: 'confirmada',
      notas: '',
      duracion: duracionDefault
    });
    setMostrarFormulario(true);
  };

  const handleEditarReserva = (reserva) => {
    setReservaEditando(reserva);
    setFormulario({
      cliente: reserva.cliente._id,
      entrenador: reserva.entrenador?._id || entrenadorSeleccionado,
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    let nuevoFormulario = { ...formulario, [name]: value };

    // Si cambia la duración o la hora de inicio, recalcular hora fin
    if (name === 'duracion' && formulario.horaInicio) {
      nuevoFormulario.horaFin = calcularHoraFin(formulario.horaInicio, parseInt(value));
    } else if (name === 'horaInicio' && formulario.duracion) {
      nuevoFormulario.horaFin = calcularHoraFin(value, parseInt(formulario.duracion));
    }

    setFormulario(nuevoFormulario);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const datos = {
        ...formulario,
        entrenador: formulario.entrenador
      };

      if (reservaEditando) {
        await reservasAPI.actualizar(reservaEditando._id, datos);
      } else {
        await reservasAPI.crear(datos);
      }
      cargarReservasEntrenador(entrenadorSeleccionado);
      cerrarFormulario();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al guardar reserva');
    }
  };

  const handleEliminar = async () => {
    if (reservaEditando && window.confirm('¿Estás seguro de eliminar esta reserva?')) {
      try {
        await reservasAPI.eliminar(reservaEditando._id);
        cargarReservasEntrenador(entrenadorSeleccionado);
        cerrarFormulario();
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
      entrenador: '',
      fecha: '',
      horaInicio: '',
      horaFin: '',
      tipoSesion: 'personal',
      estado: 'confirmada',
      notas: '',
      duracion: 60
    });
  };

  const handleMoverReserva = async (reservaId, nuevaFecha, nuevaHoraInicio, nuevaHoraFin) => {
    try {
      await reservasAPI.actualizar(reservaId, {
        fecha: nuevaFecha.toISOString().split('T')[0],
        horaInicio: nuevaHoraInicio,
        horaFin: nuevaHoraFin
      });
      cargarReservasEntrenador(entrenadorSeleccionado);
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al mover la reserva');
    }
  };

  const entrenadorActual = entrenadores.find(e => e._id === entrenadorSeleccionado);

  if (cargando) return <div style={styles.container}>Cargando...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Agenda de Reservas</h1>
          <p style={styles.subtitle}>Gestiona las citas reales de cada entrenador</p>
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {/* Selector de entrenador */}
      <div style={styles.selectorContainer}>
        <label style={styles.selectorLabel}>Entrenador:</label>
        <div style={styles.entrenadoresTabs}>
          {entrenadores.map((entrenador) => (
            <button
              key={entrenador._id}
              onClick={() => setEntrenadorSeleccionado(entrenador._id)}
              style={{
                ...styles.entrenadorTab,
                ...(entrenadorSeleccionado === entrenador._id && styles.entrenadorTabActivo)
              }}
            >
              {entrenador.nombre}
            </button>
          ))}
        </div>
      </div>

      {entrenadorActual && (
        <div style={styles.calendarioContainer}>
          <div style={styles.entrenadorInfo}>
            <h2 style={styles.entrenadorNombre}>{entrenadorActual.nombre}</h2>
            <p style={styles.entrenadorEmail}>{entrenadorActual.email}</p>
          </div>

          <CalendarioSemanal
            reservas={reservas}
            entrenador={entrenadorSeleccionado}
            onAgregarReserva={handleAgregarReserva}
            onEditarReserva={handleEditarReserva}
            onMoverReserva={handleMoverReserva}
          />
        </div>
      )}

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
                <label style={styles.label}>Entrenador*</label>
                <select
                  name="entrenador"
                  value={formulario.entrenador}
                  onChange={handleChange}
                  required
                  style={styles.input}
                >
                  <option value="">Selecciona un entrenador</option>
                  {entrenadores.map((entrenador) => (
                    <option key={entrenador._id} value={entrenador._id}>
                      {entrenador.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formRow}>
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
                <div style={styles.formGroup}>
                  <label style={styles.label}>Tipo de Sesión</label>
                  <select
                    name="tipoSesion"
                    value={formulario.tipoSesion}
                    onChange={handleChange}
                    style={styles.input}
                  >
                    <option value="personal">Personal</option>
                    <option value="grupal">Grupal</option>
                    <option value="evaluacion">Evaluación</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Duración</label>
                <select
                  name="duracion"
                  value={formulario.duracion}
                  onChange={handleChange}
                  style={styles.input}
                >
                  <option value="30">30 minutos</option>
                  <option value="60">1 hora</option>
                  <option value="90">1 hora 30 min</option>
                </select>
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
                {reservaEditando && (
                  <button type="button" onClick={handleEliminar} style={styles.buttonDelete}>
                    Eliminar
                  </button>
                )}
                <div style={styles.formActionsRight}>
                  <button type="button" onClick={cerrarFormulario} style={styles.buttonSecondary}>
                    Cancelar
                  </button>
                  <button type="submit" style={styles.buttonPrimary}>
                    {reservaEditando ? 'Actualizar' : 'Guardar'}
                  </button>
                </div>
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
    maxWidth: '1600px',
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
  subtitle: {
    fontSize: '14px',
    color: '#666',
    marginTop: '5px'
  },
  error: {
    padding: '10px',
    backgroundColor: '#fee',
    color: '#c00',
    borderRadius: '4px',
    marginBottom: '20px'
  },
  selectorContainer: {
    marginBottom: '20px',
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  selectorLabel: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '10px',
    display: 'block'
  },
  entrenadoresTabs: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap'
  },
  entrenadorTab: {
    padding: '10px 20px',
    fontSize: '14px',
    backgroundColor: '#f0f0f0',
    color: '#666',
    border: '2px solid transparent',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  entrenadorTabActivo: {
    backgroundColor: '#007bff',
    color: 'white',
    borderColor: '#0056b3'
  },
  calendarioContainer: {
    marginTop: '20px'
  },
  entrenadorInfo: {
    backgroundColor: '#e3f2fd',
    padding: '15px 20px',
    borderRadius: '8px 8px 0 0',
    borderBottom: '2px solid #1976d2'
  },
  entrenadorNombre: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1976d2',
    margin: 0
  },
  entrenadorEmail: {
    fontSize: '14px',
    color: '#555',
    marginTop: '5px'
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
    justifyContent: 'space-between',
    gap: '10px',
    marginTop: '10px'
  },
  formActionsRight: {
    display: 'flex',
    gap: '10px'
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
  buttonDelete: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '500',
    color: 'white',
    backgroundColor: '#dc3545',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  }
};

export default CalendarioGerente;
