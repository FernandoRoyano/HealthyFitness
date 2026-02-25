import { useState, useEffect } from 'react';
import { entrenamientoAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Camera } from 'lucide-react';

const gruposMusculares = [
  'pecho', 'espalda', 'hombros', 'biceps', 'triceps',
  'piernas', 'gluteos', 'core', 'cardio', 'cuerpo_completo'
];

const categorias = ['fuerza', 'cardio', 'estiramiento', 'funcional', 'peso_corporal'];

const dificultades = ['principiante', 'intermedio', 'avanzado'];

const coloresGrupoMuscular = {
  pecho: '#dc6b6b',
  espalda: '#6b9fd4',
  hombros: '#d4956b',
  biceps: '#9b7bb8',
  triceps: '#8569a0',
  piernas: '#5dba7d',
  gluteos: '#4da89a',
  core: '#d4a84b',
  cardio: '#d45c7e',
  cuerpo_completo: '#6b8294'
};

const etiquetasGrupoMuscular = {
  pecho: 'Pecho',
  espalda: 'Espalda',
  hombros: 'Hombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  piernas: 'Piernas',
  gluteos: 'Glúteos',
  core: 'Core',
  cardio: 'Cardio',
  cuerpo_completo: 'Cuerpo Completo'
};

const etiquetasCategoria = {
  fuerza: 'Fuerza',
  cardio: 'Cardio',
  estiramiento: 'Estiramiento',
  funcional: 'Funcional',
  peso_corporal: 'Peso Corporal'
};

const etiquetasDificultad = {
  principiante: 'Principiante',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado'
};

const coloresDificultad = {
  principiante: '#10b981',
  intermedio: '#f59e0b',
  avanzado: '#ef4444'
};

const formularioVacio = {
  nombre: '',
  descripcion: '',
  grupoMuscular: 'pecho',
  grupoMuscularSecundario: [],
  categoria: 'fuerza',
  dificultad: 'principiante',
  equipamiento: '',
  instrucciones: '',
  videoUrl: ''
};

function Ejercicios() {
  const { usuario } = useAuth();
  const esGerente = usuario?.rol === 'gerente';

  const [ejercicios, setEjercicios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [ejercicioEditando, setEjercicioEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [formulario, setFormulario] = useState({ ...formularioVacio });
  const [archivoImagen, setArchivoImagen] = useState(null);
  const [previewImagen, setPreviewImagen] = useState(null);

  // Filtros
  const [filtroGrupo, setFiltroGrupo] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroBusqueda, setFiltroBusqueda] = useState('');

  useEffect(() => {
    cargarEjercicios();
  }, []);

  const cargarEjercicios = async () => {
    try {
      setCargando(true);
      const { data } = await entrenamientoAPI.obtenerEjercicios();
      setEjercicios(data);
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al cargar ejercicios');
    } finally {
      setCargando(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormulario(prev => ({ ...prev, [name]: value }));
  };

  const toggleGrupoSecundario = (grupo) => {
    setFormulario(prev => {
      const actual = prev.grupoMuscularSecundario || [];
      const yaIncluido = actual.includes(grupo);
      return {
        ...prev,
        grupoMuscularSecundario: yaIncluido
          ? actual.filter(g => g !== grupo)
          : [...actual, grupo]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setError('');
    try {
      let ejercicioId;
      if (ejercicioEditando) {
        await entrenamientoAPI.actualizarEjercicio(ejercicioEditando._id, formulario);
        ejercicioId = ejercicioEditando._id;
      } else {
        const { data } = await entrenamientoAPI.crearEjercicio(formulario);
        ejercicioId = data._id;
      }

      // Subir imagen si hay archivo seleccionado
      if (archivoImagen && ejercicioId) {
        const formData = new FormData();
        formData.append('foto', archivoImagen);
        await entrenamientoAPI.subirImagenEjercicio(ejercicioId, formData);
      }

      await cargarEjercicios();
      cerrarFormulario();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al guardar ejercicio');
    } finally {
      setGuardando(false);
    }
  };

  const handleEditar = (ejercicio) => {
    setEjercicioEditando(ejercicio);
    setFormulario({
      nombre: ejercicio.nombre || '',
      descripcion: ejercicio.descripcion || '',
      grupoMuscular: ejercicio.grupoMuscular || 'pecho',
      grupoMuscularSecundario: ejercicio.grupoMuscularSecundario || [],
      categoria: ejercicio.categoria || 'fuerza',
      dificultad: ejercicio.dificultad || 'principiante',
      equipamiento: ejercicio.equipamiento || '',
      instrucciones: ejercicio.instrucciones || '',
      videoUrl: ejercicio.videoUrl || ''
    });
    if (ejercicio.imagen) {
      const apiUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
      setPreviewImagen(`${apiUrl}${ejercicio.imagen}`);
    } else {
      setPreviewImagen(null);
    }
    setArchivoImagen(null);
    setMostrarFormulario(true);
  };

  const handleEliminar = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este ejercicio? Esta acción no se puede deshacer.')) {
      try {
        await entrenamientoAPI.eliminarEjercicio(id);
        await cargarEjercicios();
      } catch (err) {
        setError(err.response?.data?.mensaje || 'Error al eliminar ejercicio');
      }
    }
  };

  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setEjercicioEditando(null);
    setFormulario({ ...formularioVacio });
    setArchivoImagen(null);
    setPreviewImagen(null);
    setError('');
  };

  const abrirNuevo = () => {
    setEjercicioEditando(null);
    setFormulario({ ...formularioVacio });
    setArchivoImagen(null);
    setPreviewImagen(null);
    setError('');
    setMostrarFormulario(true);
  };

  const handleImagenChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setArchivoImagen(file);
      setPreviewImagen(URL.createObjectURL(file));
    }
  };

  const handleEliminarImagen = async () => {
    if (ejercicioEditando?.imagen) {
      try {
        await entrenamientoAPI.eliminarImagenEjercicio(ejercicioEditando._id);
        await cargarEjercicios();
      } catch (err) {
        setError('Error al eliminar imagen');
        return;
      }
    }
    setArchivoImagen(null);
    setPreviewImagen(null);
  };

  const getImageUrl = (imagen) => {
    if (!imagen) return null;
    const apiUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    return `${apiUrl}${imagen}`;
  };

  // Filtrar ejercicios
  const ejerciciosFiltrados = ejercicios.filter(ej => {
    const coincideGrupo = !filtroGrupo || ej.grupoMuscular === filtroGrupo;
    const coincideCategoria = !filtroCategoria || ej.categoria === filtroCategoria;
    const terminoBusqueda = filtroBusqueda.toLowerCase();
    const coincideBusqueda = !filtroBusqueda ||
      (ej.nombre && ej.nombre.toLowerCase().includes(terminoBusqueda)) ||
      (ej.equipamiento && ej.equipamiento.toLowerCase().includes(terminoBusqueda)) ||
      (ej.descripcion && ej.descripcion.toLowerCase().includes(terminoBusqueda));
    return coincideGrupo && coincideCategoria && coincideBusqueda;
  });

  if (cargando) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Cargando ejercicios...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Biblioteca de Ejercicios</h1>
          <p style={styles.subtitle}>
            {ejercicios.length} ejercicio{ejercicios.length !== 1 ? 's' : ''} en la biblioteca
          </p>
        </div>
        {esGerente && (
          <button onClick={abrirNuevo} style={styles.buttonPrimary}>
            + Nuevo Ejercicio
          </button>
        )}
      </div>

      {/* Error */}
      {error && !mostrarFormulario && (
        <div style={styles.error}>
          {error}
          <button onClick={() => setError('')} style={styles.errorClose}>x</button>
        </div>
      )}

      {/* Filtros */}
      <div style={styles.filtrosContainer}>
        <div style={styles.filtroGroup}>
          <label style={styles.filtroLabel}>Grupo Muscular</label>
          <select
            value={filtroGrupo}
            onChange={(e) => setFiltroGrupo(e.target.value)}
            style={styles.filtroSelect}
          >
            <option value="">Todos los grupos</option>
            {gruposMusculares.map(grupo => (
              <option key={grupo} value={grupo}>{etiquetasGrupoMuscular[grupo]}</option>
            ))}
          </select>
        </div>
        <div style={styles.filtroGroup}>
          <label style={styles.filtroLabel}>Categoría</label>
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            style={styles.filtroSelect}
          >
            <option value="">Todas las categorías</option>
            {categorias.map(cat => (
              <option key={cat} value={cat}>{etiquetasCategoria[cat]}</option>
            ))}
          </select>
        </div>
        <div style={styles.filtroGroup}>
          <label style={styles.filtroLabel}>Buscar</label>
          <input
            type="text"
            placeholder="Buscar por nombre, equipamiento..."
            value={filtroBusqueda}
            onChange={(e) => setFiltroBusqueda(e.target.value)}
            style={styles.filtroInput}
          />
        </div>
        {(filtroGrupo || filtroCategoria || filtroBusqueda) && (
          <button
            onClick={() => {
              setFiltroGrupo('');
              setFiltroCategoria('');
              setFiltroBusqueda('');
            }}
            style={styles.limpiarFiltrosBtn}
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Resultado de filtros */}
      {(filtroGrupo || filtroCategoria || filtroBusqueda) && (
        <p style={styles.resultadoFiltro}>
          {ejerciciosFiltrados.length} resultado{ejerciciosFiltrados.length !== 1 ? 's' : ''} encontrado{ejerciciosFiltrados.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Grid de ejercicios */}
      {ejerciciosFiltrados.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>
            <span style={{ fontSize: '48px', opacity: 0.3 }}>&#127947;</span>
          </div>
          <p style={styles.emptyTitle}>
            {ejercicios.length === 0
              ? 'No hay ejercicios registrados'
              : 'No se encontraron ejercicios con los filtros aplicados'
            }
          </p>
          {ejercicios.length === 0 && esGerente && (
            <button onClick={abrirNuevo} style={styles.buttonPrimary}>
              + Crear primer ejercicio
            </button>
          )}
        </div>
      ) : (
        <div style={styles.grid}>
          {ejerciciosFiltrados.map((ejercicio) => (
            <div key={ejercicio._id} style={styles.card}>
              {ejercicio.imagen && (
                <div style={styles.cardImageContainer}>
                  <img
                    src={getImageUrl(ejercicio.imagen)}
                    alt={ejercicio.nombre}
                    style={styles.cardImage}
                  />
                </div>
              )}
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>{ejercicio.nombre}</h3>
                {esGerente && (
                  <div style={styles.cardActions}>
                    <button
                      onClick={() => handleEditar(ejercicio)}
                      style={styles.cardEditBtn}
                      title="Editar"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleEliminar(ejercicio._id)}
                      style={styles.cardDeleteBtn}
                      title="Eliminar"
                    >
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
              <div style={styles.cardBody}>
                <div style={styles.badgesRow}>
                  <span
                    style={{
                      ...styles.badge,
                      backgroundColor: coloresGrupoMuscular[ejercicio.grupoMuscular] || '#607d8b',
                      color: 'white'
                    }}
                  >
                    {etiquetasGrupoMuscular[ejercicio.grupoMuscular] || ejercicio.grupoMuscular}
                  </span>
                  {ejercicio.grupoMuscularSecundario && ejercicio.grupoMuscularSecundario.length > 0 && (
                    ejercicio.grupoMuscularSecundario.map(gs => (
                      <span
                        key={gs}
                        style={{
                          ...styles.badgeSecundario,
                          borderColor: coloresGrupoMuscular[gs] || '#607d8b',
                          color: coloresGrupoMuscular[gs] || '#607d8b'
                        }}
                      >
                        {etiquetasGrupoMuscular[gs] || gs}
                      </span>
                    ))
                  )}
                </div>
                <div style={styles.cardInfo}>
                  <div style={styles.cardInfoItem}>
                    <span style={styles.cardInfoLabel}>Categoría</span>
                    <span style={styles.cardInfoValue}>
                      {etiquetasCategoria[ejercicio.categoria] || ejercicio.categoria}
                    </span>
                  </div>
                  <div style={styles.cardInfoItem}>
                    <span style={styles.cardInfoLabel}>Dificultad</span>
                    <span
                      style={{
                        ...styles.dificultadBadge,
                        backgroundColor: coloresDificultad[ejercicio.dificultad] || '#999',
                        color: 'white'
                      }}
                    >
                      {etiquetasDificultad[ejercicio.dificultad] || ejercicio.dificultad}
                    </span>
                  </div>
                </div>
                {ejercicio.equipamiento && (
                  <div style={styles.cardEquipamiento}>
                    <span style={styles.cardInfoLabel}>Equipamiento</span>
                    <span style={styles.equipamientoText}>{ejercicio.equipamiento}</span>
                  </div>
                )}
                {ejercicio.descripcion && (
                  <p style={styles.cardDescripcion}>{ejercicio.descripcion}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Crear/Editar */}
      {mostrarFormulario && (
        <div style={styles.modal} onClick={cerrarFormulario}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={{ margin: 0 }}>
                {ejercicioEditando ? 'Editar Ejercicio' : 'Nuevo Ejercicio'}
              </h2>
              <button onClick={cerrarFormulario} style={styles.closeButton}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit} style={styles.form}>
              {error && (
                <div style={styles.error}>{error}</div>
              )}

              <div style={styles.formGroup}>
                <label style={styles.label}>Nombre*</label>
                <input
                  type="text"
                  name="nombre"
                  value={formulario.nombre}
                  onChange={handleChange}
                  required
                  placeholder="Nombre del ejercicio"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Descripción</label>
                <textarea
                  name="descripcion"
                  value={formulario.descripcion}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Descripción del ejercicio..."
                  style={{ ...styles.input, resize: 'vertical' }}
                />
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Grupo Muscular Principal*</label>
                  <select
                    name="grupoMuscular"
                    value={formulario.grupoMuscular}
                    onChange={handleChange}
                    required
                    style={styles.input}
                  >
                    {gruposMusculares.map(grupo => (
                      <option key={grupo} value={grupo}>
                        {etiquetasGrupoMuscular[grupo]}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Categoría*</label>
                  <select
                    name="categoria"
                    value={formulario.categoria}
                    onChange={handleChange}
                    required
                    style={styles.input}
                  >
                    {categorias.map(cat => (
                      <option key={cat} value={cat}>
                        {etiquetasCategoria[cat]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Grupos Musculares Secundarios</label>
                <div style={styles.checkboxGrid}>
                  {gruposMusculares
                    .filter(g => g !== formulario.grupoMuscular)
                    .map(grupo => (
                      <label key={grupo} style={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={(formulario.grupoMuscularSecundario || []).includes(grupo)}
                          onChange={() => toggleGrupoSecundario(grupo)}
                          style={styles.checkbox}
                        />
                        <span
                          style={{
                            ...styles.checkboxText,
                            color: (formulario.grupoMuscularSecundario || []).includes(grupo)
                              ? coloresGrupoMuscular[grupo]
                              : '#555'
                          }}
                        >
                          {etiquetasGrupoMuscular[grupo]}
                        </span>
                      </label>
                    ))
                  }
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Dificultad*</label>
                  <select
                    name="dificultad"
                    value={formulario.dificultad}
                    onChange={handleChange}
                    required
                    style={styles.input}
                  >
                    {dificultades.map(dif => (
                      <option key={dif} value={dif}>
                        {etiquetasDificultad[dif]}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Equipamiento</label>
                  <input
                    type="text"
                    name="equipamiento"
                    value={formulario.equipamiento}
                    onChange={handleChange}
                    placeholder="Ej: Mancuernas, barra, banco..."
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Instrucciones</label>
                <textarea
                  name="instrucciones"
                  value={formulario.instrucciones}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Instrucciones paso a paso para realizar el ejercicio..."
                  style={{ ...styles.input, resize: 'vertical' }}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>URL del Video</label>
                <input
                  type="url"
                  name="videoUrl"
                  value={formulario.videoUrl}
                  onChange={handleChange}
                  placeholder="https://www.youtube.com/watch?v=..."
                  style={styles.input}
                />
                <span style={{ fontSize: '12px', color: '#666' }}>
                  Opcional - Enlace a un video demostrativo
                </span>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Imagen del ejercicio</label>
                {previewImagen ? (
                  <div style={styles.imagenPreviewContainer}>
                    <img src={previewImagen} alt="Preview" style={styles.imagenPreview} />
                    <button
                      type="button"
                      onClick={handleEliminarImagen}
                      style={styles.imagenEliminarBtn}
                    >
                      Eliminar imagen
                    </button>
                  </div>
                ) : (
                  <div style={styles.imagenUploadZone}>
                    <Camera size={28} style={{ color: '#94a3b8' }} />
                    <span style={{ fontSize: '13px', color: '#666' }}>Selecciona una imagen (JPEG, PNG, WebP - max 5MB)</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImagenChange}
                      style={styles.imagenFileInput}
                    />
                  </div>
                )}
              </div>

              <div style={styles.formActions}>
                <button
                  type="button"
                  onClick={cerrarFormulario}
                  style={styles.buttonSecondary}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  style={{
                    ...styles.buttonPrimary,
                    opacity: guardando ? 0.7 : 1,
                    cursor: guardando ? 'not-allowed' : 'pointer'
                  }}
                >
                  {guardando
                    ? 'Guardando...'
                    : ejercicioEditando ? 'Actualizar' : 'Crear Ejercicio'
                  }
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
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #e2e8f0',
    borderTop: '4px solid #10b981',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  loadingText: {
    marginTop: '15px',
    color: '#666',
    fontSize: '16px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '25px',
    flexWrap: 'wrap',
    gap: '15px'
  },
  title: {
    fontSize: 'clamp(22px, 5vw, 28px)',
    fontWeight: 'bold',
    color: '#333',
    margin: 0
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    marginTop: '4px'
  },
  error: {
    padding: '12px 16px',
    backgroundColor: '#fee',
    color: '#c00',
    borderRadius: '6px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '14px'
  },
  errorClose: {
    background: 'none',
    border: 'none',
    color: '#c00',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '0 4px',
    fontWeight: 'bold'
  },
  // Filtros
  filtrosContainer: {
    display: 'flex',
    gap: '15px',
    marginBottom: '25px',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
  },
  filtroGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: '1 1 200px',
    minWidth: '180px'
  },
  filtroLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#555'
  },
  filtroSelect: {
    padding: '9px 12px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    outline: 'none',
    backgroundColor: 'white',
    color: '#333'
  },
  filtroInput: {
    padding: '9px 12px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    outline: 'none'
  },
  limpiarFiltrosBtn: {
    padding: '9px 16px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#666',
    backgroundColor: '#f0f0f0',
    border: '1px solid #ddd',
    borderRadius: '6px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    alignSelf: 'flex-end'
  },
  resultadoFiltro: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '15px',
    fontStyle: 'italic'
  },
  // Grid
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px'
  },
  // Cards
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
    overflow: 'hidden',
    transition: 'box-shadow 0.2s ease',
    display: 'flex',
    flexDirection: 'column'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '16px 18px 12px',
    borderBottom: '1px solid #f0f0f0',
    gap: '10px'
  },
  cardTitle: {
    margin: 0,
    fontSize: '17px',
    fontWeight: '600',
    color: '#1a1a2e',
    lineHeight: '1.3',
    flex: 1
  },
  cardActions: {
    display: 'flex',
    gap: '6px',
    flexShrink: 0
  },
  cardEditBtn: {
    padding: '4px 10px',
    fontSize: '12px',
    fontWeight: '500',
    color: 'white',
    backgroundColor: '#FF6F00',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  cardDeleteBtn: {
    padding: '4px 10px',
    fontSize: '12px',
    fontWeight: '500',
    color: 'white',
    backgroundColor: '#dc3545',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  cardBody: {
    padding: '14px 18px 18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    flex: 1
  },
  badgesRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px'
  },
  badge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
    letterSpacing: '0.3px'
  },
  badgeSecundario: {
    display: 'inline-block',
    padding: '3px 9px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '500',
    backgroundColor: 'transparent',
    border: '1.5px solid'
  },
  cardInfo: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap'
  },
  cardInfoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px'
  },
  cardInfoLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  cardInfoValue: {
    fontSize: '14px',
    color: '#333',
    fontWeight: '500'
  },
  dificultadBadge: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600'
  },
  cardEquipamiento: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px'
  },
  equipamientoText: {
    fontSize: '14px',
    color: '#444'
  },
  cardDescripcion: {
    fontSize: '13px',
    color: '#666',
    lineHeight: '1.5',
    margin: 0,
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  },
  // Empty state
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
  },
  emptyIcon: {
    marginBottom: '15px'
  },
  emptyTitle: {
    fontSize: '16px',
    color: '#999',
    marginBottom: '20px',
    textAlign: 'center'
  },
  // Botones
  buttonPrimary: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '500',
    color: 'white',
    backgroundColor: '#10b981',
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
  // Modal
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
    color: '#666',
    lineHeight: 1
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
    padding: '9px 12px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box'
  },
  checkboxGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: '8px',
    padding: '10px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
    border: '1px solid #e9ecef'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    padding: '4px 0'
  },
  checkbox: {
    width: '16px',
    height: '16px',
    cursor: 'pointer',
    accentColor: '#10b981'
  },
  checkboxText: {
    fontSize: '13px',
    fontWeight: '500'
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '10px'
  },
  // Imagen en card
  cardImageContainer: {
    width: '100%',
    height: '180px',
    overflow: 'hidden',
    backgroundColor: '#f5f5f5'
  },
  cardImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  // Imagen en formulario
  imagenPreviewContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    padding: '12px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #e9ecef'
  },
  imagenPreview: {
    maxWidth: '100%',
    maxHeight: '200px',
    borderRadius: '6px',
    objectFit: 'contain'
  },
  imagenEliminarBtn: {
    padding: '6px 14px',
    fontSize: '12px',
    fontWeight: '500',
    color: '#dc3545',
    backgroundColor: 'transparent',
    border: '1px solid #dc3545',
    borderRadius: '5px',
    cursor: 'pointer'
  },
  imagenUploadZone: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    padding: '24px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '2px dashed #d1d5db',
    cursor: 'pointer',
    position: 'relative'
  },
  imagenFileInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0,
    cursor: 'pointer'
  }
};

export default Ejercicios;
