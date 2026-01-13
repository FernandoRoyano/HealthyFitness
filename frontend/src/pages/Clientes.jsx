import { useState, useEffect } from 'react';
import { clientesAPI, usersAPI } from '../services/api';

function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [entrenadores, setEntrenadores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [clienteEditando, setClienteEditando] = useState(null);
  const [formulario, setFormulario] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    fechaNacimiento: '',
    genero: 'otro',
    direccion: '',
    objetivos: '',
    condicionesMedicas: '',
    peso: '',
    altura: '',
    nivelActividad: 'sedentario',
    notas: '',
    entrenador: ''
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [clientesRes, entrenadoresRes] = await Promise.all([
        clientesAPI.obtenerTodos(),
        usersAPI.obtenerEntrenadores()
      ]);
      setClientes(clientesRes.data);
      setEntrenadores(entrenadoresRes.data);
    } catch {
      setError('Error al cargar datos');
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

  const handleChange = (e) => {
    setFormulario({
      ...formulario,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (clienteEditando) {
        await clientesAPI.actualizar(clienteEditando._id, formulario);
      } else {
        await clientesAPI.crear(formulario);
      }
      cargarClientes();
      cerrarFormulario();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al guardar cliente');
    }
  };

  const handleEditar = (cliente) => {
    setClienteEditando(cliente);
    setFormulario({
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      email: cliente.email,
      telefono: cliente.telefono,
      fechaNacimiento: cliente.fechaNacimiento?.split('T')[0] || '',
      genero: cliente.genero || 'otro',
      direccion: cliente.direccion || '',
      objetivos: cliente.objetivos || '',
      condicionesMedicas: cliente.condicionesMedicas || '',
      peso: cliente.peso || '',
      altura: cliente.altura || '',
      nivelActividad: cliente.nivelActividad || 'sedentario',
      notas: cliente.notas || '',
      entrenador: cliente.entrenador?._id || ''
    });
    setMostrarFormulario(true);
  };

  const handleEliminar = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este cliente?')) {
      try {
        await clientesAPI.eliminar(id);
        cargarClientes();
      } catch {
        setError('Error al eliminar cliente');
      }
    }
  };

  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setClienteEditando(null);
    setFormulario({
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      fechaNacimiento: '',
      genero: 'otro',
      direccion: '',
      objetivos: '',
      condicionesMedicas: '',
      peso: '',
      altura: '',
      nivelActividad: 'sedentario',
      notas: '',
      entrenador: ''
    });
  };

  if (cargando) return <div style={styles.container}>Cargando...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Gestión de Clientes</h1>
        <button
          onClick={() => setMostrarFormulario(true)}
          style={styles.buttonPrimary}
        >
          + Nuevo Cliente
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {mostrarFormulario && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2>{clienteEditando ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
              <button onClick={cerrarFormulario} style={styles.closeButton}>×</button>
            </div>
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Nombre*</label>
                  <input
                    type="text"
                    name="nombre"
                    value={formulario.nombre}
                    onChange={handleChange}
                    required
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Apellido*</label>
                  <input
                    type="text"
                    name="apellido"
                    value={formulario.apellido}
                    onChange={handleChange}
                    required
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Email*</label>
                  <input
                    type="email"
                    name="email"
                    value={formulario.email}
                    onChange={handleChange}
                    required
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Teléfono*</label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formulario.telefono}
                    onChange={handleChange}
                    required
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Entrenador Asignado*</label>
                <select
                  name="entrenador"
                  value={formulario.entrenador}
                  onChange={handleChange}
                  required
                  style={styles.input}
                >
                  <option value="">Seleccionar entrenador</option>
                  {entrenadores.map((entrenador) => (
                    <option key={entrenador._id} value={entrenador._id}>
                      {entrenador.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Fecha de Nacimiento</label>
                  <input
                    type="date"
                    name="fechaNacimiento"
                    value={formulario.fechaNacimiento}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Género</label>
                  <select
                    name="genero"
                    value={formulario.genero}
                    onChange={handleChange}
                    style={styles.input}
                  >
                    <option value="masculino">Masculino</option>
                    <option value="femenino">Femenino</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Dirección</label>
                <input
                  type="text"
                  name="direccion"
                  value={formulario.direccion}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Peso (kg)</label>
                  <input
                    type="number"
                    name="peso"
                    value={formulario.peso}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Altura (cm)</label>
                  <input
                    type="number"
                    name="altura"
                    value={formulario.altura}
                    onChange={handleChange}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Nivel de Actividad</label>
                <select
                  name="nivelActividad"
                  value={formulario.nivelActividad}
                  onChange={handleChange}
                  style={styles.input}
                >
                  <option value="sedentario">Sedentario</option>
                  <option value="ligero">Ligero</option>
                  <option value="moderado">Moderado</option>
                  <option value="activo">Activo</option>
                  <option value="muy-activo">Muy Activo</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Objetivos</label>
                <textarea
                  name="objetivos"
                  value={formulario.objetivos}
                  onChange={handleChange}
                  rows="3"
                  style={{...styles.input, resize: 'vertical'}}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Condiciones Médicas</label>
                <textarea
                  name="condicionesMedicas"
                  value={formulario.condicionesMedicas}
                  onChange={handleChange}
                  rows="2"
                  style={{...styles.input, resize: 'vertical'}}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Notas</label>
                <textarea
                  name="notas"
                  value={formulario.notas}
                  onChange={handleChange}
                  rows="2"
                  style={{...styles.input, resize: 'vertical'}}
                />
              </div>

              <div style={styles.formActions}>
                <button type="button" onClick={cerrarFormulario} style={styles.buttonSecondary}>
                  Cancelar
                </button>
                <button type="submit" style={styles.buttonPrimary}>
                  {clienteEditando ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={styles.table}>
        {clientes.length === 0 ? (
          <p style={styles.empty}>No hay clientes registrados</p>
        ) : (
          <table style={styles.tableElement}>
            <thead>
              <tr>
                <th style={styles.th}>Nombre</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Teléfono</th>
                <th style={styles.th}>Entrenador</th>
                <th style={styles.th}>Objetivos</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((cliente) => (
                <tr key={cliente._id} style={styles.tr}>
                  <td style={styles.td}>{cliente.nombre} {cliente.apellido}</td>
                  <td style={styles.td}>{cliente.email}</td>
                  <td style={styles.td}>{cliente.telefono}</td>
                  <td style={styles.td}>{cliente.entrenador?.nombre || '-'}</td>
                  <td style={styles.td}>{cliente.objetivos || '-'}</td>
                  <td style={styles.td}>
                    <button
                      onClick={() => handleEditar(cliente)}
                      style={styles.buttonEdit}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleEliminar(cliente._id)}
                      style={styles.buttonDelete}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
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
    padding: '6px 12px',
    fontSize: '12px',
    color: 'white',
    backgroundColor: '#28a745',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginRight: '5px'
  },
  buttonDelete: {
    padding: '6px 12px',
    fontSize: '12px',
    color: 'white',
    backgroundColor: '#dc3545',
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
    overflowY: 'auto',
    padding: '20px'
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '8px',
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
  table: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    overflow: 'hidden'
  },
  tableElement: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    padding: '12px',
    textAlign: 'left',
    backgroundColor: '#f8f9fa',
    fontWeight: '600',
    color: '#333',
    borderBottom: '2px solid #dee2e6'
  },
  tr: {
    borderBottom: '1px solid #dee2e6'
  },
  td: {
    padding: '12px'
  },
  empty: {
    padding: '40px',
    textAlign: 'center',
    color: '#666'
  }
};

export default Clientes;
