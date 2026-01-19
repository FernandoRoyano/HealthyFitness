import { useState, useEffect, useRef } from 'react';
import { usersAPI } from '../services/api';
import './Entrenadores.css';

function Entrenadores() {
  const [entrenadores, setEntrenadores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [entrenadorEditando, setEntrenadorEditando] = useState(null);
  const [mostrarModalReasignar, setMostrarModalReasignar] = useState(false);
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const fotoInputRef = useRef(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [archivoFoto, setArchivoFoto] = useState(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [formulario, setFormulario] = useState({
    nombre: '',
    email: '',
    telefono: ''
  });
  const [formularioCrear, setFormularioCrear] = useState({
    nombre: '',
    email: '',
    telefono: '',
    password: ''
  });
  const [formularioReasignar, setFormularioReasignar] = useState({
    origen: '',
    destino: ''
  });
  const [mostrarModalPassword, setMostrarModalPassword] = useState(false);
  const [entrenadorPassword, setEntrenadorPassword] = useState(null);
  const [nuevaPassword, setNuevaPassword] = useState('');

  useEffect(() => {
    cargarEntrenadores();
  }, []);

  const cargarEntrenadores = async () => {
    try {
      const { data } = await usersAPI.obtenerEntrenadores();
      setEntrenadores(data);
    } catch {
      setError('Error al cargar entrenadores');
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

  const handleChangeReasignar = (e) => {
    setFormularioReasignar({
      ...formularioReasignar,
      [e.target.name]: e.target.value
    });
  };

  const handleChangeCrear = (e) => {
    setFormularioCrear({
      ...formularioCrear,
      [e.target.name]: e.target.value
    });
  };

  const handleCrear = async (e) => {
    e.preventDefault();
    try {
      await usersAPI.crearEntrenador(formularioCrear);
      cargarEntrenadores();
      cerrarModalCrear();
      setError('');
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al crear entrenador');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await usersAPI.actualizarEntrenador(entrenadorEditando._id, formulario);

      // Si hay foto nueva, subirla
      if (archivoFoto && entrenadorEditando._id) {
        await handleSubirFoto(entrenadorEditando._id);
      }

      cargarEntrenadores();
      cerrarFormulario();
      setError('');
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al actualizar entrenador');
    }
  };

  const handleReasignar = async (e) => {
    e.preventDefault();
    try {
      const { data } = await usersAPI.reasignarClientes(
        formularioReasignar.origen,
        formularioReasignar.destino
      );
      alert(`${data.clientesActualizados} clientes reasignados correctamente`);
      cerrarModalReasignar();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al reasignar clientes');
    }
  };

  const handleEditar = (entrenador) => {
    setEntrenadorEditando(entrenador);
    setFormulario({
      nombre: entrenador.nombre,
      email: entrenador.email,
      telefono: entrenador.telefono || ''
    });
    // Si tiene foto, mostrar preview
    if (entrenador.foto) {
      const apiUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
      setFotoPreview(`${apiUrl}${entrenador.foto}`);
    } else {
      setFotoPreview(null);
    }
    setArchivoFoto(null);
    setMostrarFormulario(true);
  };

  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setEntrenadorEditando(null);
    setFotoPreview(null);
    setArchivoFoto(null);
    setFormulario({
      nombre: '',
      email: '',
      telefono: ''
    });
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setArchivoFoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubirFoto = async (entrenadorId) => {
    if (!archivoFoto) return;

    setSubiendoFoto(true);
    try {
      const formData = new FormData();
      formData.append('foto', archivoFoto);
      await usersAPI.subirFoto(entrenadorId, formData);
      setArchivoFoto(null);
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al subir foto');
    } finally {
      setSubiendoFoto(false);
    }
  };

  const cerrarModalReasignar = () => {
    setMostrarModalReasignar(false);
    setFormularioReasignar({
      origen: '',
      destino: ''
    });
  };

  const cerrarModalCrear = () => {
    setMostrarModalCrear(false);
    setFormularioCrear({
      nombre: '',
      email: '',
      telefono: '',
      password: ''
    });
  };

  const abrirModalPassword = (entrenador) => {
    setEntrenadorPassword(entrenador);
    setNuevaPassword('');
    setMostrarModalPassword(true);
  };

  const cerrarModalPassword = () => {
    setMostrarModalPassword(false);
    setEntrenadorPassword(null);
    setNuevaPassword('');
  };

  const handleResetearPassword = async (e) => {
    e.preventDefault();
    try {
      await usersAPI.resetearPasswordEntrenador(entrenadorPassword._id, nuevaPassword);
      alert('Contraseña actualizada correctamente');
      cerrarModalPassword();
      setError('');
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al resetear contraseña');
    }
  };

  if (cargando) return <div style={styles.container}>Cargando...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Gestión de Entrenadores</h1>
          <p style={styles.subtitle}>Administra los perfiles de los entrenadores de HealthyFitness</p>
        </div>
        <div className="button-group" style={styles.headerButtons}>
          <button
            onClick={() => setMostrarModalCrear(true)}
            className="btn-primary-custom"
            style={styles.buttonPrimary}
          >
            + Nuevo Entrenador
          </button>
          <button
            onClick={() => setMostrarModalReasignar(true)}
            className="btn-secondary-custom"
            style={styles.buttonSecondary}
          >
            Reasignar Clientes
          </button>
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.grid}>
        {entrenadores.map((entrenador) => {
          return (
            <div key={entrenador._id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.cardTitleSection}>
                  <div style={styles.avatarSmall}>
                    <span style={{ fontSize: '24px' }}>👤</span>
                  </div>
                  <h3 style={styles.cardTitle}>{entrenador.nombre}</h3>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleEditar(entrenador)}
                    style={styles.buttonEdit}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => abrirModalPassword(entrenador)}
                    style={styles.buttonPassword}
                    title="Resetear contraseña"
                  >
                    🔑
                  </button>
                </div>
              </div>
              <div style={styles.cardBody}>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Email:</span>
                  <span style={styles.value}>{entrenador.email}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Teléfono:</span>
                  <span style={styles.value}>{entrenador.telefono || 'No especificado'}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.label}>Rol:</span>
                  <span style={styles.badge}>{entrenador.rol}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {mostrarFormulario && (
        <div className="modal-overlay" style={styles.modal}>
          <div className="modal-content-responsive" style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2>Actualizar Perfil de Entrenador</h2>
              <button onClick={cerrarFormulario} style={styles.closeButton}>×</button>
            </div>
            <form onSubmit={handleSubmit} style={styles.form}>
              {/* FOTO DESHABILITADA TEMPORALMENTE - Se reactivará cuando se implemente Cloudinary
              <div style={styles.fotoSection}>
                <div style={styles.fotoPreviewContainer}>
                  {fotoPreview ? (
                    <img src={fotoPreview} alt="Preview" style={styles.fotoPreview} />
                  ) : (
                    <div style={styles.fotoPlaceholder}>
                      <span style={{ fontSize: '40px' }}>👤</span>
                    </div>
                  )}
                </div>
                <div style={styles.fotoActions}>
                  <input
                    ref={fotoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFotoChange}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => fotoInputRef.current?.click()}
                    style={styles.buttonSecondary}
                  >
                    {fotoPreview ? 'Cambiar foto' : 'Subir foto'}
                  </button>
                  <span style={{ fontSize: '12px', color: '#666' }}>Opcional (JPG, PNG, WebP)</span>
                </div>
              </div>
              */}

              <div style={styles.formGroup}>
                <label style={styles.labelForm}>Nombre Completo*</label>
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
                <label style={styles.labelForm}>Email*</label>
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
                <label style={styles.labelForm}>Teléfono</label>
                <input
                  type="tel"
                  name="telefono"
                  value={formulario.telefono}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>

              <div style={styles.helpText}>
                <strong>Nota:</strong> Al actualizar este perfil, el entrenador mantendrá todos sus clientes asignados
                y el historial de seguimiento. Esta opción es ideal cuando un entrenador deja el centro y entra uno nuevo.
              </div>

              <div style={styles.formActions}>
                <button type="button" onClick={cerrarFormulario} style={styles.buttonCancelForm}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary-custom" style={styles.buttonPrimary}>
                  Actualizar Perfil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mostrarModalCrear && (
        <div className="modal-overlay" style={styles.modal}>
          <div className="modal-content-responsive" style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2>Crear Nuevo Entrenador</h2>
              <button onClick={cerrarModalCrear} style={styles.closeButton}>×</button>
            </div>
            <form onSubmit={handleCrear} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.labelForm}>Nombre Completo*</label>
                <input
                  type="text"
                  name="nombre"
                  value={formularioCrear.nombre}
                  onChange={handleChangeCrear}
                  required
                  style={styles.input}
                  placeholder="Ej: Juan Pérez"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.labelForm}>Email*</label>
                <input
                  type="email"
                  name="email"
                  value={formularioCrear.email}
                  onChange={handleChangeCrear}
                  required
                  style={styles.input}
                  placeholder="juan@ejemplo.com"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.labelForm}>Teléfono</label>
                <input
                  type="tel"
                  name="telefono"
                  value={formularioCrear.telefono}
                  onChange={handleChangeCrear}
                  style={styles.input}
                  placeholder="+34 600 000 000"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.labelForm}>Contraseña*</label>
                <input
                  type="password"
                  name="password"
                  value={formularioCrear.password}
                  onChange={handleChangeCrear}
                  required
                  minLength="6"
                  style={styles.input}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div style={styles.helpText}>
                <strong>Nota:</strong> El entrenador podrá acceder al sistema con este email y contraseña.
                Se recomienda que cambien la contraseña en su primer acceso.
              </div>

              <div style={styles.formActions}>
                <button type="button" onClick={cerrarModalCrear} style={styles.buttonCancelForm}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary-custom" style={styles.buttonPrimary}>
                  Crear Entrenador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mostrarModalReasignar && (
        <div className="modal-overlay" style={styles.modal}>
          <div className="modal-content-responsive" style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2>Reasignar Clientes</h2>
              <button onClick={cerrarModalReasignar} style={styles.closeButton}>×</button>
            </div>
            <form onSubmit={handleReasignar} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.labelForm}>Entrenador Origen*</label>
                <select
                  name="origen"
                  value={formularioReasignar.origen}
                  onChange={handleChangeReasignar}
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

              <div style={styles.formGroup}>
                <label style={styles.labelForm}>Entrenador Destino*</label>
                <select
                  name="destino"
                  value={formularioReasignar.destino}
                  onChange={handleChangeReasignar}
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

              <div style={styles.helpText}>
                <strong>Nota:</strong> Todos los clientes del entrenador origen serán reasignados al entrenador destino.
                El historial y seguimiento de cada cliente se mantendrá intacto.
              </div>

              <div style={styles.formActions}>
                <button type="button" onClick={cerrarModalReasignar} style={styles.buttonCancelForm}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary-custom" style={styles.buttonPrimary}>
                  Reasignar Clientes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mostrarModalPassword && entrenadorPassword && (
        <div className="modal-overlay" style={styles.modal}>
          <div className="modal-content-responsive" style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2>Resetear Contraseña</h2>
              <button onClick={cerrarModalPassword} style={styles.closeButton}>×</button>
            </div>
            <form onSubmit={handleResetearPassword} style={styles.form}>
              <div style={styles.infoBox}>
                <strong>Entrenador:</strong> {entrenadorPassword.nombre}<br />
                <strong>Email:</strong> {entrenadorPassword.email}
              </div>

              <div style={styles.formGroup}>
                <label style={styles.labelForm}>Nueva Contraseña*</label>
                <input
                  type="password"
                  value={nuevaPassword}
                  onChange={(e) => setNuevaPassword(e.target.value)}
                  required
                  minLength="6"
                  style={styles.input}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div style={styles.helpText}>
                <strong>Nota:</strong> La contraseña será actualizada inmediatamente.
                Comparte la nueva contraseña con el entrenador de forma segura.
              </div>

              <div style={styles.formActions}>
                <button type="button" onClick={cerrarModalPassword} style={styles.buttonCancelForm}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary-custom" style={styles.buttonPrimary}>
                  Actualizar Contraseña
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px'
  },
  headerButtons: {
    display: 'flex',
    gap: '10px'
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
    padding: '12px',
    backgroundColor: '#fee',
    color: '#c00',
    borderRadius: '6px',
    marginBottom: '20px',
    fontSize: '14px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    padding: '20px'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
    paddingBottom: '15px',
    borderBottom: '1px solid #e0e0e0'
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#333',
    margin: 0
  },
  cardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  label: {
    fontSize: '14px',
    color: '#666',
    fontWeight: '500'
  },
  value: {
    fontSize: '14px',
    color: '#333'
  },
  badge: {
    fontSize: '12px',
    padding: '4px 12px',
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
    borderRadius: '12px',
    fontWeight: '500',
    textTransform: 'capitalize'
  },
  buttonPrimary: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '500',
    color: 'white',
    backgroundColor: '#007bff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  buttonSecondary: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#007bff',
    backgroundColor: 'white',
    border: '2px solid #007bff',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  buttonEdit: {
    padding: '6px 12px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#007bff',
    backgroundColor: 'transparent',
    border: '1px solid #007bff',
    borderRadius: '4px',
    cursor: 'pointer'
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
    maxWidth: '500px',
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
    gap: '20px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  labelForm: {
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
  helpText: {
    padding: '12px',
    backgroundColor: '#f8f9fa',
    borderLeft: '4px solid #007bff',
    fontSize: '13px',
    color: '#555',
    lineHeight: '1.5'
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '10px'
  },
  buttonCancelForm: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#666',
    backgroundColor: '#e0e0e0',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  buttonPassword: {
    padding: '6px 12px',
    fontSize: '16px',
    backgroundColor: '#fff3cd',
    border: '1px solid #ffc107',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  infoBox: {
    padding: '12px',
    backgroundColor: '#e3f2fd',
    borderRadius: '4px',
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#1976d2'
  },
  // Estilos para sección de foto
  fotoSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px'
  },
  fotoPreviewContainer: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    overflow: 'hidden',
    border: '3px solid #dee2e6',
    flexShrink: 0
  },
  fotoPreview: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  fotoPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e9ecef'
  },
  fotoActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  // Estilos para avatar en cards
  cardTitleSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  avatarSmall: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    overflow: 'hidden',
    backgroundColor: '#e9ecef',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid #dee2e6',
    flexShrink: 0
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  }
};

export default Entrenadores;
