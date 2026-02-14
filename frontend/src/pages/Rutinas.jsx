import { useState, useEffect } from 'react';
import { entrenamientoAPI, clientesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const objetivoLabels = {
  hipertrofia: 'Hipertrofia',
  fuerza: 'Fuerza',
  resistencia: 'Resistencia',
  perdida_grasa: 'Perdida de grasa',
  tonificacion: 'Tonificacion',
  salud_general: 'Salud general'
};

const objetivoColores = {
  hipertrofia: '#e74c3c',
  fuerza: '#3498db',
  resistencia: '#2ecc71',
  perdida_grasa: '#e67e22',
  tonificacion: '#9b59b6',
  salud_general: '#607d8b'
};

const dificultadLabels = {
  principiante: 'Principiante',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado'
};

const dificultadColores = {
  principiante: '#2ecc71',
  intermedio: '#f39c12',
  avanzado: '#e74c3c'
};

const coloresGrupoMuscular = {
  pecho: '#e74c3c',
  espalda: '#3498db',
  hombros: '#e67e22',
  biceps: '#9b59b6',
  triceps: '#8e44ad',
  piernas: '#2ecc71',
  gluteos: '#1abc9c',
  core: '#f39c12',
  cardio: '#e91e63',
  cuerpo_completo: '#607d8b'
};

const formularioVacio = {
  nombre: '',
  descripcion: '',
  cliente: '',
  objetivo: 'hipertrofia',
  dificultad: 'intermedio',
  diasPorSemana: 3,
  esPlantilla: false,
  fechaInicio: '',
  fechaFin: '',
  activa: true,
  dias: []
};

const ejercicioEntradaVacia = {
  ejercicio: '',
  series: 3,
  repeticiones: '10',
  descansoSegundos: 60,
  peso: '',
  notas: ''
};

function Rutinas() {
  const { usuario } = useAuth();

  // Estado principal
  const [rutinas, setRutinas] = useState([]);
  const [rutinaSeleccionada, setRutinaSeleccionada] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [ejerciciosLibreria, setEjerciciosLibreria] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  // Filtros
  const [filtroActivo, setFiltroActivo] = useState('todas');
  const [busqueda, setBusqueda] = useState('');

  // Modal
  const [modalAbierto, setModalAbierto] = useState(false);
  const [rutinaEditando, setRutinaEditando] = useState(null);
  const [formulario, setFormulario] = useState({ ...formularioVacio });
  const [pasoModal, setPasoModal] = useState(1);
  const [guardando, setGuardando] = useState(false);

  // Buscador de ejercicios dentro del modal
  const [busquedaEjercicio, setBusquedaEjercicio] = useState('');
  const [ejerciciosDiaIndex, setEjerciciosDiaIndex] = useState(null);
  const [mostrarSelectorEjercicio, setMostrarSelectorEjercicio] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, []);

  // Limpiar mensajes
  useEffect(() => {
    if (mensaje || error) {
      const timer = setTimeout(() => {
        setMensaje('');
        setError('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [mensaje, error]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [rutinasRes, clientesRes, ejerciciosRes] = await Promise.all([
        entrenamientoAPI.obtenerRutinas(),
        clientesAPI.obtenerTodos(),
        entrenamientoAPI.obtenerEjercicios()
      ]);
      setRutinas(rutinasRes.data);
      setClientes(clientesRes.data);
      setEjerciciosLibreria(ejerciciosRes.data);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const cargarRutinas = async () => {
    try {
      const { data } = await entrenamientoAPI.obtenerRutinas();
      setRutinas(data);
    } catch (err) {
      console.error('Error al cargar rutinas:', err);
    }
  };

  // Filtrar rutinas
  const rutinasFiltradas = rutinas.filter(rutina => {
    // Filtro por tab
    if (filtroActivo === 'activas' && !rutina.activa) return false;
    if (filtroActivo === 'plantillas' && !rutina.esPlantilla) return false;

    // Filtro por busqueda
    if (busqueda) {
      const texto = busqueda.toLowerCase();
      const nombreCliente = rutina.cliente
        ? `${rutina.cliente.nombre || ''} ${rutina.cliente.apellido || ''}`.toLowerCase()
        : '';
      return (
        (rutina.nombre || '').toLowerCase().includes(texto) ||
        nombreCliente.includes(texto) ||
        (rutina.objetivo || '').toLowerCase().includes(texto)
      );
    }

    return true;
  });

  // Formatear fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Obtener nombre del cliente
  const getNombreCliente = (rutina) => {
    if (!rutina.cliente) return 'Sin cliente';
    if (typeof rutina.cliente === 'string') {
      const cliente = clientes.find(c => c._id === rutina.cliente);
      return cliente ? `${cliente.nombre} ${cliente.apellido}` : 'Cliente desconocido';
    }
    return `${rutina.cliente.nombre || ''} ${rutina.cliente.apellido || ''}`.trim() || 'Sin nombre';
  };

  // Ver detalle de rutina
  const verDetalle = async (rutina) => {
    try {
      const { data } = await entrenamientoAPI.obtenerRutinaPorId(rutina._id);
      setRutinaSeleccionada(data);
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al cargar detalle de la rutina');
    }
  };

  // Volver a la lista
  const volverALista = () => {
    setRutinaSeleccionada(null);
  };

  // Abrir modal para crear
  const abrirModalCrear = () => {
    setRutinaEditando(null);
    setFormulario({ ...formularioVacio });
    setPasoModal(1);
    setModalAbierto(true);
  };

  // Abrir modal para editar
  const abrirModalEditar = (rutina) => {
    setRutinaEditando(rutina);
    setFormulario({
      nombre: rutina.nombre || '',
      descripcion: rutina.descripcion || '',
      cliente: rutina.cliente?._id || rutina.cliente || '',
      objetivo: rutina.objetivo || 'hipertrofia',
      dificultad: rutina.dificultad || 'intermedio',
      diasPorSemana: rutina.diasPorSemana || 3,
      esPlantilla: rutina.esPlantilla || false,
      fechaInicio: rutina.fechaInicio ? rutina.fechaInicio.split('T')[0] : '',
      fechaFin: rutina.fechaFin ? rutina.fechaFin.split('T')[0] : '',
      activa: rutina.activa !== undefined ? rutina.activa : true,
      dias: (rutina.dias || []).map(dia => ({
        nombre: dia.nombre || '',
        ejercicios: (dia.ejercicios || []).map(ej => ({
          ejercicio: ej.ejercicio?._id || ej.ejercicio || '',
          series: ej.series || 3,
          repeticiones: ej.repeticiones || '10',
          descansoSegundos: ej.descansoSegundos || 60,
          peso: ej.peso || '',
          notas: ej.notas || ''
        }))
      }))
    });
    setPasoModal(1);
    setModalAbierto(true);
  };

  // Cerrar modal
  const cerrarModal = () => {
    setModalAbierto(false);
    setRutinaEditando(null);
    setPasoModal(1);
    setBusquedaEjercicio('');
    setMostrarSelectorEjercicio(false);
    setEjerciciosDiaIndex(null);
  };

  // Guardar rutina
  const handleGuardar = async () => {
    if (!formulario.nombre.trim()) {
      setError('El nombre de la rutina es obligatorio');
      return;
    }

    setGuardando(true);
    try {
      const datos = {
        ...formulario,
        cliente: formulario.esPlantilla ? null : (formulario.cliente || null),
        diasPorSemana: parseInt(formulario.diasPorSemana) || 3,
        dias: formulario.dias.map(dia => ({
          nombre: dia.nombre,
          ejercicios: dia.ejercicios.map(ej => ({
            ejercicio: ej.ejercicio,
            series: parseInt(ej.series) || 3,
            repeticiones: ej.repeticiones || '10',
            descansoSegundos: parseInt(ej.descansoSegundos) || 60,
            peso: ej.peso || '',
            notas: ej.notas || ''
          }))
        }))
      };

      if (rutinaEditando) {
        await entrenamientoAPI.actualizarRutina(rutinaEditando._id, datos);
        setMensaje('Rutina actualizada correctamente');
        // Si estamos viendo el detalle, recargar
        if (rutinaSeleccionada && rutinaSeleccionada._id === rutinaEditando._id) {
          const { data } = await entrenamientoAPI.obtenerRutinaPorId(rutinaEditando._id);
          setRutinaSeleccionada(data);
        }
      } else {
        await entrenamientoAPI.crearRutina(datos);
        setMensaje('Rutina creada correctamente');
      }

      cerrarModal();
      cargarRutinas();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al guardar la rutina');
    } finally {
      setGuardando(false);
    }
  };

  // Duplicar rutina
  const handleDuplicar = async (rutina, e) => {
    if (e) e.stopPropagation();
    try {
      await entrenamientoAPI.duplicarRutina(rutina._id, {
        nombre: `${rutina.nombre} (copia)`
      });
      setMensaje('Rutina duplicada correctamente');
      cargarRutinas();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al duplicar la rutina');
    }
  };

  // Eliminar rutina
  const handleEliminar = async (rutina, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`¿Eliminar la rutina "${rutina.nombre}"?`)) return;

    try {
      await entrenamientoAPI.eliminarRutina(rutina._id);
      setMensaje('Rutina eliminada correctamente');
      if (rutinaSeleccionada && rutinaSeleccionada._id === rutina._id) {
        setRutinaSeleccionada(null);
      }
      cargarRutinas();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al eliminar la rutina');
    }
  };

  // ====== Funciones del formulario (dias y ejercicios) ======

  const agregarDia = () => {
    const numeroDia = formulario.dias.length + 1;
    setFormulario(prev => ({
      ...prev,
      dias: [
        ...prev.dias,
        { nombre: `Dia ${numeroDia}`, ejercicios: [] }
      ]
    }));
  };

  const eliminarDia = (diaIndex) => {
    setFormulario(prev => ({
      ...prev,
      dias: prev.dias.filter((_, i) => i !== diaIndex)
    }));
  };

  const actualizarNombreDia = (diaIndex, nuevoNombre) => {
    setFormulario(prev => ({
      ...prev,
      dias: prev.dias.map((dia, i) =>
        i === diaIndex ? { ...dia, nombre: nuevoNombre } : dia
      )
    }));
  };

  const abrirSelectorEjercicio = (diaIndex) => {
    setEjerciciosDiaIndex(diaIndex);
    setBusquedaEjercicio('');
    setMostrarSelectorEjercicio(true);
  };

  const seleccionarEjercicio = (ejercicioId) => {
    if (ejerciciosDiaIndex === null) return;

    setFormulario(prev => ({
      ...prev,
      dias: prev.dias.map((dia, i) =>
        i === ejerciciosDiaIndex
          ? {
              ...dia,
              ejercicios: [
                ...dia.ejercicios,
                { ...ejercicioEntradaVacia, ejercicio: ejercicioId }
              ]
            }
          : dia
      )
    }));

    setMostrarSelectorEjercicio(false);
    setEjerciciosDiaIndex(null);
    setBusquedaEjercicio('');
  };

  const eliminarEjercicioDelDia = (diaIndex, ejercicioIndex) => {
    setFormulario(prev => ({
      ...prev,
      dias: prev.dias.map((dia, i) =>
        i === diaIndex
          ? { ...dia, ejercicios: dia.ejercicios.filter((_, j) => j !== ejercicioIndex) }
          : dia
      )
    }));
  };

  const actualizarEjercicioDelDia = (diaIndex, ejercicioIndex, campo, valor) => {
    setFormulario(prev => ({
      ...prev,
      dias: prev.dias.map((dia, i) =>
        i === diaIndex
          ? {
              ...dia,
              ejercicios: dia.ejercicios.map((ej, j) =>
                j === ejercicioIndex ? { ...ej, [campo]: valor } : ej
              )
            }
          : dia
      )
    }));
  };

  // Obtener nombre de ejercicio por ID
  const getNombreEjercicio = (ejercicioId) => {
    if (!ejercicioId) return 'Sin ejercicio';
    if (typeof ejercicioId === 'object' && ejercicioId.nombre) {
      return ejercicioId.nombre;
    }
    const ej = ejerciciosLibreria.find(e => e._id === ejercicioId);
    return ej ? ej.nombre : 'Ejercicio desconocido';
  };

  // Obtener grupo muscular del ejercicio
  const getGrupoMuscular = (ejercicioId) => {
    if (!ejercicioId) return null;
    if (typeof ejercicioId === 'object' && ejercicioId.grupoMuscular) {
      return ejercicioId.grupoMuscular;
    }
    const ej = ejerciciosLibreria.find(e => e._id === ejercicioId);
    return ej ? ej.grupoMuscular : null;
  };

  // Filtrar ejercicios de la libreria para el selector
  const ejerciciosFiltrados = ejerciciosLibreria.filter(ej => {
    if (!busquedaEjercicio) return true;
    const texto = busquedaEjercicio.toLowerCase();
    return (
      (ej.nombre || '').toLowerCase().includes(texto) ||
      (ej.grupoMuscular || '').toLowerCase().includes(texto)
    );
  });

  // ====== RENDER: Loading ======
  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <p style={styles.loadingText}>Cargando rutinas...</p>
        </div>
      </div>
    );
  }

  // ====== RENDER: Vista Detalle ======
  if (rutinaSeleccionada) {
    return (
      <div style={styles.container}>
        {error && (
          <div style={styles.errorAlert}>
            {error}
            <button onClick={() => setError('')} style={styles.closeAlert}>X</button>
          </div>
        )}
        {mensaje && (
          <div style={styles.successAlert}>
            {mensaje}
            <button onClick={() => setMensaje('')} style={styles.closeAlert}>X</button>
          </div>
        )}

        {/* Cabecera detalle */}
        <div style={styles.detalleHeader}>
          <button onClick={volverALista} style={styles.volverButton}>
            Volver
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={styles.detalleTitle}>{rutinaSeleccionada.nombre}</h1>
            {rutinaSeleccionada.descripcion && (
              <p style={styles.detalleDescripcion}>{rutinaSeleccionada.descripcion}</p>
            )}
          </div>
          <div style={styles.detalleAcciones}>
            <button
              onClick={() => abrirModalEditar(rutinaSeleccionada)}
              style={styles.editarButton}
            >
              Editar
            </button>
            <button
              onClick={(e) => handleEliminar(rutinaSeleccionada, e)}
              style={styles.eliminarButton}
            >
              Eliminar
            </button>
          </div>
        </div>

        {/* Info de la rutina */}
        <div style={styles.detalleInfo}>
          <div style={styles.detalleInfoGrid}>
            <div style={styles.detalleInfoItem}>
              <span style={styles.detalleInfoLabel}>Cliente</span>
              <span style={styles.detalleInfoValue}>
                {rutinaSeleccionada.esPlantilla ? 'Plantilla general' : getNombreCliente(rutinaSeleccionada)}
              </span>
            </div>
            <div style={styles.detalleInfoItem}>
              <span style={styles.detalleInfoLabel}>Objetivo</span>
              <span style={{
                ...styles.badge,
                backgroundColor: objetivoColores[rutinaSeleccionada.objetivo] || '#607d8b',
                color: '#fff'
              }}>
                {objetivoLabels[rutinaSeleccionada.objetivo] || rutinaSeleccionada.objetivo}
              </span>
            </div>
            <div style={styles.detalleInfoItem}>
              <span style={styles.detalleInfoLabel}>Dificultad</span>
              <span style={{
                ...styles.badge,
                backgroundColor: dificultadColores[rutinaSeleccionada.dificultad] || '#607d8b',
                color: '#fff'
              }}>
                {dificultadLabels[rutinaSeleccionada.dificultad] || rutinaSeleccionada.dificultad}
              </span>
            </div>
            <div style={styles.detalleInfoItem}>
              <span style={styles.detalleInfoLabel}>Dias/Semana</span>
              <span style={styles.detalleInfoValue}>{rutinaSeleccionada.diasPorSemana || '-'}</span>
            </div>
            <div style={styles.detalleInfoItem}>
              <span style={styles.detalleInfoLabel}>Estado</span>
              <span style={{
                ...styles.badge,
                backgroundColor: rutinaSeleccionada.activa ? '#d4edda' : '#f8d7da',
                color: rutinaSeleccionada.activa ? '#155724' : '#721c24'
              }}>
                {rutinaSeleccionada.activa ? 'Activa' : 'Inactiva'}
              </span>
            </div>
            <div style={styles.detalleInfoItem}>
              <span style={styles.detalleInfoLabel}>Creada</span>
              <span style={styles.detalleInfoValue}>{formatearFecha(rutinaSeleccionada.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Dias de la rutina */}
        <div style={styles.diasContainer}>
          <h2 style={styles.diasTitulo}>
            Dias de entrenamiento ({(rutinaSeleccionada.dias || []).length})
          </h2>

          {(!rutinaSeleccionada.dias || rutinaSeleccionada.dias.length === 0) ? (
            <div style={styles.emptyState}>
              <p>Esta rutina no tiene dias configurados.</p>
              <button onClick={() => abrirModalEditar(rutinaSeleccionada)} style={styles.editarButton}>
                Configurar dias
              </button>
            </div>
          ) : (
            rutinaSeleccionada.dias.map((dia, diaIndex) => (
              <div key={diaIndex} style={styles.diaCard}>
                <div style={styles.diaCardHeader}>
                  <h3 style={styles.diaCardTitle}>{dia.nombre || `Dia ${diaIndex + 1}`}</h3>
                  <span style={styles.diaCardCount}>
                    {(dia.ejercicios || []).length} ejercicio{(dia.ejercicios || []).length !== 1 ? 's' : ''}
                  </span>
                </div>

                {(!dia.ejercicios || dia.ejercicios.length === 0) ? (
                  <div style={styles.diaCardEmpty}>Sin ejercicios configurados</div>
                ) : (
                  <div style={styles.ejerciciosTabla}>
                    <div style={styles.ejerciciosTablaHeader}>
                      <span style={{ ...styles.ejerciciosTablaCol, flex: 0.5 }}>#</span>
                      <span style={{ ...styles.ejerciciosTablaCol, flex: 3 }}>Ejercicio</span>
                      <span style={{ ...styles.ejerciciosTablaCol, flex: 1 }}>Series</span>
                      <span style={{ ...styles.ejerciciosTablaCol, flex: 1 }}>Reps</span>
                      <span style={{ ...styles.ejerciciosTablaCol, flex: 1 }}>Descanso</span>
                      <span style={{ ...styles.ejerciciosTablaCol, flex: 1 }}>Peso</span>
                      <span style={{ ...styles.ejerciciosTablaCol, flex: 2 }}>Notas</span>
                    </div>
                    {dia.ejercicios.map((ej, ejIndex) => {
                      const grupo = getGrupoMuscular(ej.ejercicio);
                      return (
                        <div key={ejIndex} style={styles.ejerciciosTablaRow}>
                          <span style={{ ...styles.ejerciciosTablaCol, flex: 0.5, fontWeight: '600', color: '#999' }}>
                            {ejIndex + 1}
                          </span>
                          <span style={{ ...styles.ejerciciosTablaCol, flex: 3 }}>
                            <span style={styles.ejercicioNombre}>
                              {getNombreEjercicio(ej.ejercicio)}
                            </span>
                            {grupo && (
                              <span style={{
                                ...styles.grupoMuscularbadge,
                                backgroundColor: coloresGrupoMuscular[grupo] || '#607d8b'
                              }}>
                                {grupo}
                              </span>
                            )}
                          </span>
                          <span style={{ ...styles.ejerciciosTablaCol, flex: 1 }}>{ej.series}</span>
                          <span style={{ ...styles.ejerciciosTablaCol, flex: 1 }}>{ej.repeticiones}</span>
                          <span style={{ ...styles.ejerciciosTablaCol, flex: 1 }}>{ej.descansoSegundos}s</span>
                          <span style={{ ...styles.ejerciciosTablaCol, flex: 1 }}>{ej.peso || '-'}</span>
                          <span style={{ ...styles.ejerciciosTablaCol, flex: 2, color: '#666', fontSize: '12px' }}>
                            {ej.notas || '-'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // ====== RENDER: Vista Lista (default) ======
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Rutinas de Entrenamiento</h1>
          <p style={styles.subtitle}>Gestiona las rutinas de tus clientes</p>
        </div>
        <button onClick={abrirModalCrear} style={styles.nuevaRutinaButton}>
          + Nueva Rutina
        </button>
      </div>

      {/* Mensajes */}
      {error && (
        <div style={styles.errorAlert}>
          {error}
          <button onClick={() => setError('')} style={styles.closeAlert}>X</button>
        </div>
      )}
      {mensaje && (
        <div style={styles.successAlert}>
          {mensaje}
          <button onClick={() => setMensaje('')} style={styles.closeAlert}>X</button>
        </div>
      )}

      {/* Filtros */}
      <div style={styles.filtrosContainer}>
        <div style={styles.filtroTabs}>
          {[
            { key: 'todas', label: 'Todas' },
            { key: 'activas', label: 'Activas' },
            { key: 'plantillas', label: 'Plantillas' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFiltroActivo(tab.key)}
              style={{
                ...styles.filtroTab,
                ...(filtroActivo === tab.key ? styles.filtroTabActivo : {})
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Buscar por nombre, cliente, objetivo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={styles.busquedaInput}
        />
      </div>

      {/* Lista de rutinas */}
      {rutinasFiltradas.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyStateText}>
            {rutinas.length === 0
              ? 'No hay rutinas creadas todavia.'
              : 'No se encontraron rutinas con los filtros seleccionados.'}
          </p>
          {rutinas.length === 0 && (
            <button onClick={abrirModalCrear} style={styles.nuevaRutinaButton}>
              + Crear primera rutina
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Vista tabla desktop */}
          <div style={styles.tablaWrapper}>
            <table style={styles.tabla}>
              <thead>
                <tr>
                  <th style={styles.th}>Nombre</th>
                  <th style={styles.th}>Cliente</th>
                  <th style={styles.th}>Objetivo</th>
                  <th style={styles.th}>Dificultad</th>
                  <th style={styles.th}>Dias/Sem</th>
                  <th style={styles.th}>Estado</th>
                  <th style={styles.th}>Creada</th>
                  <th style={styles.th}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rutinasFiltradas.map(rutina => (
                  <tr
                    key={rutina._id}
                    style={styles.tr}
                    onClick={() => verDetalle(rutina)}
                  >
                    <td style={styles.td}>
                      <div style={styles.rutinaNombreCell}>
                        <span style={styles.rutinaNombre}>{rutina.nombre}</span>
                        {rutina.esPlantilla && (
                          <span style={styles.plantillaBadge}>Plantilla</span>
                        )}
                      </div>
                    </td>
                    <td style={styles.td}>{getNombreCliente(rutina)}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        backgroundColor: objetivoColores[rutina.objetivo] || '#607d8b',
                        color: '#fff'
                      }}>
                        {objetivoLabels[rutina.objetivo] || rutina.objetivo}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        backgroundColor: dificultadColores[rutina.dificultad] || '#607d8b',
                        color: '#fff'
                      }}>
                        {dificultadLabels[rutina.dificultad] || rutina.dificultad}
                      </span>
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>{rutina.diasPorSemana || '-'}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        backgroundColor: rutina.activa ? '#d4edda' : '#f8d7da',
                        color: rutina.activa ? '#155724' : '#721c24'
                      }}>
                        {rutina.activa ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td style={styles.td}>{formatearFecha(rutina.createdAt)}</td>
                    <td style={styles.td}>
                      <div style={styles.accionesCell} onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => verDetalle(rutina)}
                          style={styles.accionButtonVer}
                          title="Ver detalle"
                        >
                          Ver
                        </button>
                        <button
                          onClick={(e) => handleDuplicar(rutina, e)}
                          style={styles.accionButtonDuplicar}
                          title="Duplicar"
                        >
                          Duplicar
                        </button>
                        <button
                          onClick={(e) => handleEliminar(rutina, e)}
                          style={styles.accionButtonEliminar}
                          title="Eliminar"
                        >
                          X
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Vista cards movil */}
          <div style={styles.cardsContainer}>
            {rutinasFiltradas.map(rutina => (
              <div
                key={rutina._id}
                style={styles.rutinaCard}
                onClick={() => verDetalle(rutina)}
              >
                <div style={styles.rutinaCardHeader}>
                  <div>
                    <h3 style={styles.rutinaCardNombre}>{rutina.nombre}</h3>
                    {rutina.esPlantilla && (
                      <span style={styles.plantillaBadge}>Plantilla</span>
                    )}
                  </div>
                  <span style={{
                    ...styles.badge,
                    backgroundColor: rutina.activa ? '#d4edda' : '#f8d7da',
                    color: rutina.activa ? '#155724' : '#721c24'
                  }}>
                    {rutina.activa ? 'Activa' : 'Inactiva'}
                  </span>
                </div>

                <div style={styles.rutinaCardBody}>
                  <div style={styles.rutinaCardRow}>
                    <span style={styles.rutinaCardLabel}>Cliente:</span>
                    <span style={styles.rutinaCardValue}>{getNombreCliente(rutina)}</span>
                  </div>
                  <div style={styles.rutinaCardRow}>
                    <span style={styles.rutinaCardLabel}>Objetivo:</span>
                    <span style={{
                      ...styles.badge,
                      backgroundColor: objetivoColores[rutina.objetivo] || '#607d8b',
                      color: '#fff'
                    }}>
                      {objetivoLabels[rutina.objetivo] || rutina.objetivo}
                    </span>
                  </div>
                  <div style={styles.rutinaCardRow}>
                    <span style={styles.rutinaCardLabel}>Dificultad:</span>
                    <span style={{
                      ...styles.badge,
                      backgroundColor: dificultadColores[rutina.dificultad] || '#607d8b',
                      color: '#fff'
                    }}>
                      {dificultadLabels[rutina.dificultad] || rutina.dificultad}
                    </span>
                  </div>
                  <div style={styles.rutinaCardRow}>
                    <span style={styles.rutinaCardLabel}>Dias/Semana:</span>
                    <span style={styles.rutinaCardValue}>{rutina.diasPorSemana || '-'}</span>
                  </div>
                  <div style={styles.rutinaCardRow}>
                    <span style={styles.rutinaCardLabel}>Creada:</span>
                    <span style={styles.rutinaCardValue}>{formatearFecha(rutina.createdAt)}</span>
                  </div>
                </div>

                <div style={styles.rutinaCardActions} onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => verDetalle(rutina)}
                    style={styles.cardButtonVer}
                  >
                    Ver
                  </button>
                  <button
                    onClick={(e) => handleDuplicar(rutina, e)}
                    style={styles.cardButtonDuplicar}
                  >
                    Duplicar
                  </button>
                  <button
                    onClick={(e) => handleEliminar(rutina, e)}
                    style={styles.cardButtonEliminar}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ====== Modal Crear/Editar ====== */}
      {modalAbierto && (
        <div style={styles.modalOverlay} onClick={cerrarModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {rutinaEditando ? 'Editar Rutina' : 'Nueva Rutina'}
              </h2>
              <button onClick={cerrarModal} style={styles.modalCloseButton}>X</button>
            </div>

            {/* Indicador de pasos */}
            <div style={styles.pasosIndicador}>
              <button
                onClick={() => setPasoModal(1)}
                style={{
                  ...styles.pasoButton,
                  ...(pasoModal === 1 ? styles.pasoButtonActivo : {})
                }}
              >
                1. Informacion General
              </button>
              <button
                onClick={() => setPasoModal(2)}
                style={{
                  ...styles.pasoButton,
                  ...(pasoModal === 2 ? styles.pasoButtonActivo : {})
                }}
              >
                2. Dias y Ejercicios
              </button>
            </div>

            <div style={styles.modalBody}>
              {/* ====== PASO 1: Info General ====== */}
              {pasoModal === 1 && (
                <div style={styles.formContainer}>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Nombre de la rutina *</label>
                    <input
                      type="text"
                      value={formulario.nombre}
                      onChange={(e) => setFormulario(prev => ({ ...prev, nombre: e.target.value }))}
                      placeholder="Ej: Rutina Full Body Principiante"
                      style={styles.formInput}
                      required
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Descripcion</label>
                    <textarea
                      value={formulario.descripcion}
                      onChange={(e) => setFormulario(prev => ({ ...prev, descripcion: e.target.value }))}
                      placeholder="Descripcion de la rutina..."
                      rows={3}
                      style={{ ...styles.formInput, resize: 'vertical' }}
                    />
                  </div>

                  <div style={styles.formRow}>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Objetivo</label>
                      <select
                        value={formulario.objetivo}
                        onChange={(e) => setFormulario(prev => ({ ...prev, objetivo: e.target.value }))}
                        style={styles.formInput}
                      >
                        {Object.entries(objetivoLabels).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Dificultad</label>
                      <select
                        value={formulario.dificultad}
                        onChange={(e) => setFormulario(prev => ({ ...prev, dificultad: e.target.value }))}
                        style={styles.formInput}
                      >
                        {Object.entries(dificultadLabels).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={styles.formRow}>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Dias por semana</label>
                      <input
                        type="number"
                        value={formulario.diasPorSemana}
                        onChange={(e) => setFormulario(prev => ({ ...prev, diasPorSemana: e.target.value }))}
                        min="1"
                        max="7"
                        style={styles.formInput}
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.formCheckboxLabel}>
                        <input
                          type="checkbox"
                          checked={formulario.esPlantilla}
                          onChange={(e) => setFormulario(prev => ({ ...prev, esPlantilla: e.target.checked }))}
                          style={styles.formCheckbox}
                        />
                        Es plantilla (sin cliente asignado)
                      </label>
                    </div>
                  </div>

                  {!formulario.esPlantilla && (
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Cliente</label>
                      <select
                        value={formulario.cliente}
                        onChange={(e) => setFormulario(prev => ({ ...prev, cliente: e.target.value }))}
                        style={styles.formInput}
                      >
                        <option value="">Seleccionar cliente</option>
                        {clientes.map(cliente => (
                          <option key={cliente._id} value={cliente._id}>
                            {cliente.nombre} {cliente.apellido}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div style={styles.formRow}>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Fecha de inicio</label>
                      <input
                        type="date"
                        value={formulario.fechaInicio}
                        onChange={(e) => setFormulario(prev => ({ ...prev, fechaInicio: e.target.value }))}
                        style={styles.formInput}
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Fecha de fin</label>
                      <input
                        type="date"
                        value={formulario.fechaFin}
                        onChange={(e) => setFormulario(prev => ({ ...prev, fechaFin: e.target.value }))}
                        style={styles.formInput}
                      />
                    </div>
                  </div>

                  <div style={styles.formActions}>
                    <button
                      type="button"
                      onClick={cerrarModal}
                      style={styles.cancelarButton}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => setPasoModal(2)}
                      style={styles.siguienteButton}
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}

              {/* ====== PASO 2: Dias y Ejercicios ====== */}
              {pasoModal === 2 && (
                <div style={styles.formContainer}>
                  <div style={styles.diasEditorHeader}>
                    <h3 style={styles.diasEditorTitulo}>
                      Dias de entrenamiento ({formulario.dias.length})
                    </h3>
                    <button
                      type="button"
                      onClick={agregarDia}
                      style={styles.agregarDiaButton}
                    >
                      + Anadir Dia
                    </button>
                  </div>

                  {formulario.dias.length === 0 ? (
                    <div style={styles.emptyStateDias}>
                      <p>No hay dias configurados. Pulsa "Anadir Dia" para empezar.</p>
                    </div>
                  ) : (
                    formulario.dias.map((dia, diaIndex) => (
                      <div key={diaIndex} style={styles.diaEditorCard}>
                        <div style={styles.diaEditorHeader}>
                          <input
                            type="text"
                            value={dia.nombre}
                            onChange={(e) => actualizarNombreDia(diaIndex, e.target.value)}
                            placeholder="Nombre del dia"
                            style={styles.diaEditorNombreInput}
                          />
                          <div style={styles.diaEditorActions}>
                            <button
                              type="button"
                              onClick={() => abrirSelectorEjercicio(diaIndex)}
                              style={styles.agregarEjercicioButton}
                            >
                              + Ejercicio
                            </button>
                            <button
                              type="button"
                              onClick={() => eliminarDia(diaIndex)}
                              style={styles.eliminarDiaButton}
                            >
                              Eliminar dia
                            </button>
                          </div>
                        </div>

                        {dia.ejercicios.length === 0 ? (
                          <div style={styles.sinEjercicios}>
                            Sin ejercicios. Pulsa "+ Ejercicio" para anadir.
                          </div>
                        ) : (
                          <div style={styles.ejerciciosEditorLista}>
                            {dia.ejercicios.map((ej, ejIndex) => (
                              <div key={ejIndex} style={styles.ejercicioEditorRow}>
                                <div style={styles.ejercicioEditorNumero}>{ejIndex + 1}</div>
                                <div style={styles.ejercicioEditorContent}>
                                  <div style={styles.ejercicioEditorNombre}>
                                    {getNombreEjercicio(ej.ejercicio)}
                                    {getGrupoMuscular(ej.ejercicio) && (
                                      <span style={{
                                        ...styles.grupoMuscularbadge,
                                        backgroundColor: coloresGrupoMuscular[getGrupoMuscular(ej.ejercicio)] || '#607d8b'
                                      }}>
                                        {getGrupoMuscular(ej.ejercicio)}
                                      </span>
                                    )}
                                  </div>
                                  <div style={styles.ejercicioEditorCampos}>
                                    <div style={styles.ejercicioEditorCampo}>
                                      <label style={styles.ejercicioEditorCampoLabel}>Series</label>
                                      <input
                                        type="number"
                                        value={ej.series}
                                        onChange={(e) => actualizarEjercicioDelDia(diaIndex, ejIndex, 'series', e.target.value)}
                                        min="1"
                                        style={styles.ejercicioEditorCampoInput}
                                      />
                                    </div>
                                    <div style={styles.ejercicioEditorCampo}>
                                      <label style={styles.ejercicioEditorCampoLabel}>Reps</label>
                                      <input
                                        type="text"
                                        value={ej.repeticiones}
                                        onChange={(e) => actualizarEjercicioDelDia(diaIndex, ejIndex, 'repeticiones', e.target.value)}
                                        style={styles.ejercicioEditorCampoInput}
                                      />
                                    </div>
                                    <div style={styles.ejercicioEditorCampo}>
                                      <label style={styles.ejercicioEditorCampoLabel}>Descanso (s)</label>
                                      <input
                                        type="number"
                                        value={ej.descansoSegundos}
                                        onChange={(e) => actualizarEjercicioDelDia(diaIndex, ejIndex, 'descansoSegundos', e.target.value)}
                                        min="0"
                                        style={styles.ejercicioEditorCampoInput}
                                      />
                                    </div>
                                    <div style={styles.ejercicioEditorCampo}>
                                      <label style={styles.ejercicioEditorCampoLabel}>Peso</label>
                                      <input
                                        type="text"
                                        value={ej.peso}
                                        onChange={(e) => actualizarEjercicioDelDia(diaIndex, ejIndex, 'peso', e.target.value)}
                                        placeholder="Ej: 20kg"
                                        style={styles.ejercicioEditorCampoInput}
                                      />
                                    </div>
                                    <div style={styles.ejercicioEditorCampo}>
                                      <label style={styles.ejercicioEditorCampoLabel}>Notas</label>
                                      <input
                                        type="text"
                                        value={ej.notas}
                                        onChange={(e) => actualizarEjercicioDelDia(diaIndex, ejIndex, 'notas', e.target.value)}
                                        placeholder="Opcional"
                                        style={styles.ejercicioEditorCampoInput}
                                      />
                                    </div>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => eliminarEjercicioDelDia(diaIndex, ejIndex)}
                                  style={styles.eliminarEjercicioButton}
                                  title="Eliminar ejercicio"
                                >
                                  X
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}

                  <div style={styles.formActions}>
                    <button
                      type="button"
                      onClick={() => setPasoModal(1)}
                      style={styles.cancelarButton}
                    >
                      Anterior
                    </button>
                    <button
                      type="button"
                      onClick={handleGuardar}
                      disabled={guardando}
                      style={styles.guardarButton}
                    >
                      {guardando ? 'Guardando...' : (rutinaEditando ? 'Guardar Cambios' : 'Crear Rutina')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ====== Selector de Ejercicio (sub-modal) ====== */}
      {mostrarSelectorEjercicio && (
        <div style={styles.selectorOverlay} onClick={() => setMostrarSelectorEjercicio(false)}>
          <div style={styles.selectorContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.selectorHeader}>
              <h3 style={styles.selectorTitulo}>Seleccionar Ejercicio</h3>
              <button
                onClick={() => setMostrarSelectorEjercicio(false)}
                style={styles.modalCloseButton}
              >
                X
              </button>
            </div>
            <div style={styles.selectorBusqueda}>
              <input
                type="text"
                placeholder="Buscar por nombre o grupo muscular..."
                value={busquedaEjercicio}
                onChange={(e) => setBusquedaEjercicio(e.target.value)}
                style={styles.selectorBusquedaInput}
                autoFocus
              />
            </div>
            <div style={styles.selectorLista}>
              {ejerciciosFiltrados.length === 0 ? (
                <div style={styles.selectorVacio}>
                  No se encontraron ejercicios
                </div>
              ) : (
                ejerciciosFiltrados.map(ej => (
                  <div
                    key={ej._id}
                    style={styles.selectorItem}
                    onClick={() => seleccionarEjercicio(ej._id)}
                  >
                    <div style={styles.selectorItemInfo}>
                      <span style={styles.selectorItemNombre}>{ej.nombre}</span>
                      {ej.grupoMuscular && (
                        <span style={{
                          ...styles.grupoMuscularbadge,
                          backgroundColor: coloresGrupoMuscular[ej.grupoMuscular] || '#607d8b'
                        }}>
                          {ej.grupoMuscular}
                        </span>
                      )}
                    </div>
                    {ej.equipamiento && (
                      <span style={styles.selectorItemEquipamiento}>{ej.equipamiento}</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ====== ESTILOS ======
const styles = {
  // === Layout general ===
  container: {
    padding: '20px',
    maxWidth: '1400px',
    margin: '0 auto'
  },
  loadingContainer: {
    textAlign: 'center',
    padding: '60px 20px'
  },
  loadingText: {
    fontSize: '16px',
    color: '#666'
  },

  // === Header ===
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '25px',
    flexWrap: 'wrap',
    gap: '15px'
  },
  title: {
    margin: 0,
    fontSize: 'clamp(22px, 5vw, 28px)',
    fontWeight: 'bold',
    color: '#1a1a2e'
  },
  subtitle: {
    color: '#666',
    marginTop: '5px',
    marginBottom: 0,
    fontSize: '14px'
  },
  nuevaRutinaButton: {
    backgroundColor: '#75b760',
    color: '#fff',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600'
  },

  // === Alertas ===
  errorAlert: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '12px 20px',
    borderRadius: '8px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  successAlert: {
    backgroundColor: '#d4edda',
    color: '#155724',
    padding: '12px 20px',
    borderRadius: '8px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  closeAlert: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    color: 'inherit',
    fontWeight: 'bold'
  },

  // === Filtros ===
  filtrosContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '15px'
  },
  filtroTabs: {
    display: 'flex',
    gap: '0',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '1px solid #ddd'
  },
  filtroTab: {
    padding: '10px 20px',
    border: 'none',
    backgroundColor: '#f5f5f5',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: '#666',
    transition: 'all 0.2s ease'
  },
  filtroTabActivo: {
    backgroundColor: '#75b760',
    color: '#fff'
  },
  busquedaInput: {
    padding: '10px 15px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '14px',
    minWidth: '280px',
    outline: 'none'
  },

  // === Empty state ===
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  emptyStateText: {
    color: '#666',
    fontSize: '16px',
    marginBottom: '20px'
  },

  // === Badge generico ===
  badge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
    whiteSpace: 'nowrap'
  },
  plantillaBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '500',
    backgroundColor: '#FF6F00',
    color: '#fff',
    marginLeft: '8px'
  },
  grupoMuscularbadge: {
    display: 'inline-block',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: '500',
    color: '#fff',
    marginLeft: '6px'
  },

  // === Tabla desktop ===
  tablaWrapper: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    overflowX: 'auto'
  },
  tabla: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '900px'
  },
  th: {
    padding: '14px 15px',
    textAlign: 'left',
    backgroundColor: '#1a1a2e',
    color: '#fff',
    fontWeight: '600',
    fontSize: '13px',
    whiteSpace: 'nowrap'
  },
  tr: {
    borderBottom: '1px solid #eee',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  td: {
    padding: '14px 15px',
    verticalAlign: 'middle',
    fontSize: '14px'
  },
  rutinaNombreCell: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  rutinaNombre: {
    fontWeight: '600',
    color: '#1a1a2e'
  },
  accionesCell: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap'
  },
  accionButtonVer: {
    padding: '5px 10px',
    fontSize: '12px',
    color: '#fff',
    backgroundColor: '#007bff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  accionButtonDuplicar: {
    padding: '5px 10px',
    fontSize: '12px',
    color: '#fff',
    backgroundColor: '#FF6F00',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  accionButtonEliminar: {
    padding: '5px 10px',
    fontSize: '12px',
    color: '#fff',
    backgroundColor: '#dc3545',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },

  // === Cards movil ===
  cardsContainer: {
    display: 'none',
    flexDirection: 'column',
    gap: '15px'
  },
  rutinaCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    overflow: 'hidden',
    cursor: 'pointer'
  },
  rutinaCardHeader: {
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderBottom: '1px solid #eee',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '10px'
  },
  rutinaCardNombre: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '600',
    color: '#1a1a2e'
  },
  rutinaCardBody: {
    padding: '15px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  rutinaCardRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  rutinaCardLabel: {
    fontSize: '13px',
    color: '#666',
    fontWeight: '500'
  },
  rutinaCardValue: {
    fontSize: '14px',
    color: '#333'
  },
  rutinaCardActions: {
    padding: '15px',
    borderTop: '1px solid #eee',
    display: 'flex',
    gap: '10px'
  },
  cardButtonVer: {
    flex: 1,
    padding: '10px 15px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#fff',
    backgroundColor: '#007bff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  cardButtonDuplicar: {
    flex: 1,
    padding: '10px 15px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#fff',
    backgroundColor: '#FF6F00',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  cardButtonEliminar: {
    flex: 1,
    padding: '10px 15px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#fff',
    backgroundColor: '#dc3545',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  },

  // === Vista Detalle ===
  detalleHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '15px',
    marginBottom: '25px',
    flexWrap: 'wrap'
  },
  volverButton: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
    backgroundColor: '#e0e0e0',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    whiteSpace: 'nowrap'
  },
  detalleTitle: {
    margin: 0,
    fontSize: 'clamp(20px, 4vw, 26px)',
    fontWeight: 'bold',
    color: '#1a1a2e'
  },
  detalleDescripcion: {
    color: '#666',
    marginTop: '5px',
    marginBottom: 0,
    fontSize: '14px'
  },
  detalleAcciones: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
    marginLeft: 'auto'
  },
  editarButton: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#fff',
    backgroundColor: '#007bff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  eliminarButton: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#fff',
    backgroundColor: '#dc3545',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  detalleInfo: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    padding: '25px',
    marginBottom: '25px'
  },
  detalleInfoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '20px'
  },
  detalleInfoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  detalleInfoLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  detalleInfoValue: {
    fontSize: '15px',
    fontWeight: '500',
    color: '#1a1a2e'
  },

  // === Dias en detalle ===
  diasContainer: {
    marginTop: '10px'
  },
  diasTitulo: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: '20px'
  },
  diaCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginBottom: '20px',
    overflow: 'hidden'
  },
  diaCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '18px 20px',
    backgroundColor: '#1a1a2e',
    color: '#fff'
  },
  diaCardTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '600'
  },
  diaCardCount: {
    fontSize: '13px',
    opacity: 0.8
  },
  diaCardEmpty: {
    padding: '25px',
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic'
  },
  ejerciciosTabla: {
    padding: '0'
  },
  ejerciciosTablaHeader: {
    display: 'flex',
    padding: '12px 20px',
    backgroundColor: '#f8f9fa',
    borderBottom: '2px solid #e9ecef',
    fontWeight: '600',
    fontSize: '12px',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  ejerciciosTablaRow: {
    display: 'flex',
    padding: '14px 20px',
    borderBottom: '1px solid #f0f0f0',
    alignItems: 'center',
    fontSize: '14px'
  },
  ejerciciosTablaCol: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    overflow: 'hidden'
  },
  ejercicioNombre: {
    fontWeight: '500',
    color: '#1a1a2e'
  },

  // === Modal ===
  modalOverlay: {
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
    backgroundColor: '#fff',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '900px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 25px',
    borderBottom: '1px solid #ddd',
    flexShrink: 0
  },
  modalTitle: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '600',
    color: '#1a1a2e'
  },
  modalCloseButton: {
    fontSize: '20px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    color: '#666',
    fontWeight: 'bold',
    padding: '5px 10px'
  },
  modalBody: {
    overflowY: 'auto',
    flex: 1
  },

  // === Pasos del modal ===
  pasosIndicador: {
    display: 'flex',
    borderBottom: '1px solid #ddd',
    flexShrink: 0
  },
  pasoButton: {
    flex: 1,
    padding: '14px 20px',
    border: 'none',
    backgroundColor: '#f5f5f5',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: '#666',
    transition: 'all 0.2s'
  },
  pasoButtonActivo: {
    backgroundColor: '#fff',
    color: '#75b760',
    borderBottom: '3px solid #75b760',
    fontWeight: '600'
  },

  // === Formulario ===
  formContainer: {
    padding: '25px',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  formLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#333'
  },
  formInput: {
    padding: '10px 14px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px'
  },
  formCheckboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
    cursor: 'pointer',
    paddingTop: '28px'
  },
  formCheckbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer'
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '10px',
    paddingTop: '15px',
    borderTop: '1px solid #eee'
  },
  cancelarButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
    backgroundColor: '#e0e0e0',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  siguienteButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#fff',
    backgroundColor: '#007bff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  guardarButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#fff',
    backgroundColor: '#75b760',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  },

  // === Editor de dias (Paso 2) ===
  diasEditorHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '5px'
  },
  diasEditorTitulo: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '600',
    color: '#1a1a2e'
  },
  agregarDiaButton: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#fff',
    backgroundColor: '#75b760',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  emptyStateDias: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#999',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '2px dashed #ddd'
  },
  diaEditorCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: '10px',
    border: '1px solid #e9ecef',
    overflow: 'hidden'
  },
  diaEditorHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 15px',
    backgroundColor: '#1a1a2e',
    gap: '10px',
    flexWrap: 'wrap'
  },
  diaEditorNombreInput: {
    padding: '8px 12px',
    fontSize: '14px',
    fontWeight: '600',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '6px',
    backgroundColor: 'rgba(255,255,255,0.15)',
    color: '#fff',
    outline: 'none',
    flex: 1,
    minWidth: '150px'
  },
  diaEditorActions: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  agregarEjercicioButton: {
    padding: '8px 14px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#fff',
    backgroundColor: '#007bff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  eliminarDiaButton: {
    padding: '8px 14px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#fff',
    backgroundColor: '#dc3545',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  sinEjercicios: {
    padding: '20px',
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    fontSize: '14px'
  },

  // === Editor de ejercicios ===
  ejerciciosEditorLista: {
    padding: '10px'
  },
  ejercicioEditorRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '12px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    marginBottom: '8px',
    border: '1px solid #e9ecef'
  },
  ejercicioEditorNumero: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: '#1a1a2e',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '600',
    flexShrink: 0,
    marginTop: '2px'
  },
  ejercicioEditorContent: {
    flex: 1,
    minWidth: 0
  },
  ejercicioEditorNombre: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: '10px',
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '4px'
  },
  ejercicioEditorCampos: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
    gap: '8px'
  },
  ejercicioEditorCampo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px'
  },
  ejercicioEditorCampoLabel: {
    fontSize: '11px',
    fontWeight: '500',
    color: '#999',
    textTransform: 'uppercase'
  },
  ejercicioEditorCampoInput: {
    padding: '6px 8px',
    fontSize: '13px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box'
  },
  eliminarEjercicioButton: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    backgroundColor: '#dc3545',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: '2px'
  },

  // === Selector de ejercicio (sub-modal) ===
  selectorOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1100,
    padding: '20px'
  },
  selectorContent: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '550px',
    maxHeight: '70vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  selectorHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '18px 20px',
    borderBottom: '1px solid #ddd',
    flexShrink: 0
  },
  selectorTitulo: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600',
    color: '#1a1a2e'
  },
  selectorBusqueda: {
    padding: '15px 20px',
    borderBottom: '1px solid #eee',
    flexShrink: 0
  },
  selectorBusquedaInput: {
    width: '100%',
    padding: '10px 14px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  selectorLista: {
    overflowY: 'auto',
    flex: 1,
    padding: '10px'
  },
  selectorVacio: {
    padding: '30px',
    textAlign: 'center',
    color: '#999'
  },
  selectorItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 15px',
    borderRadius: '8px',
    cursor: 'pointer',
    marginBottom: '4px',
    transition: 'background-color 0.15s',
    border: '1px solid #f0f0f0'
  },
  selectorItemInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap'
  },
  selectorItemNombre: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#1a1a2e'
  },
  selectorItemEquipamiento: {
    fontSize: '12px',
    color: '#999'
  }
};

export default Rutinas;
