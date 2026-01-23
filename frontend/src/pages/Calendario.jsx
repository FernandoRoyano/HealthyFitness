import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { reservasAPI, clientesAPI } from '../services/api';
import CalendarioSemanal from '../components/CalendarioSemanal';

function Calendario() {
  const { usuario } = useAuth();
  const [reservas, setReservas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [reservaEditando, setReservaEditando] = useState(null);
  const [formulario, setFormulario] = useState({
    cliente: '',
    fecha: '',
    horaInicio: '',
    horaFin: '',
    tipoSesion: 'individual',
    estado: 'confirmada',
    notas: '',
    duracion: 60
  });

  useEffect(() => {
    cargarDatos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario]);

  const cargarDatos = async () => {
    try {
      const [reservasRes, clientesRes] = await Promise.all([
        reservasAPI.obtenerTodas({ entrenador: usuario._id }),
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
      fecha: fecha.toISOString().split('T')[0],
      horaInicio: hora,
      horaFin: horaFinStr,
      tipoSesion: 'individual',
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

  const handleEliminar = async () => {
    if (reservaEditando && window.confirm('¿Estás seguro de eliminar esta reserva?')) {
      try {
        await reservasAPI.eliminar(reservaEditando._id);
        cargarDatos();
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
      fecha: '',
      horaInicio: '',
      horaFin: '',
      tipoSesion: 'individual',
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
      cargarDatos();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al mover la reserva');
    }
  };

  if (cargando) return <div style={styles.container}>Cargando...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Mi Calendario</h1>
          <p style={styles.subtitle}>Gestiona tus sesiones de entrenamiento</p>
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <CalendarioSemanal
        reservas={reservas}
        entrenador={usuario._id}
        onAgregarReserva={handleAgregarReserva}
        onEditarReserva={handleEditarReserva}
        onMoverReserva={handleMoverReserva}
      />

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
                    <option value="individual">Individual</option>
                    <option value="pareja">En pareja</option>
                    <option value="express">Express</option>
                    <option value="pareja-express">En pareja express</option>
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

export default Calendario;
