import { useState, useEffect } from 'react';
import { entrenamientoAPI } from '../services/api';
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

const ejercicioEntradaVacia = {
  ejercicio: '',
  series: 3,
  repeticiones: '10',
  descansoSegundos: 60,
  peso: '',
  notas: ''
};

function ModalEditarRutina({ clienteId, clienteNombre, rutina, onClose, onGuardado }) {
  const { usuario } = useAuth();

  // Modo: 'ver' o 'editar'
  const [modo, setModo] = useState(rutina ? 'ver' : 'editar');

  // Datos de la rutina completa (con ejercicios populados)
  const [rutinaCompleta, setRutinaCompleta] = useState(null);
  const [cargando, setCargando] = useState(!!rutina);

  // Formulario de edicion
  const [formulario, setFormulario] = useState({
    nombre: '',
    descripcion: '',
    objetivo: 'hipertrofia',
    dificultad: 'intermedio',
    diasPorSemana: 3,
    activa: true,
    fechaInicio: '',
    fechaFin: '',
    dias: []
  });

  // Ejercicios de la biblioteca
  const [ejerciciosLibreria, setEjerciciosLibreria] = useState([]);
  const [cargandoEjercicios, setCargandoEjercicios] = useState(false);

  // Selector de ejercicio
  const [mostrarSelector, setMostrarSelector] = useState(false);
  const [selectorDiaIndex, setSelectorDiaIndex] = useState(null);
  const [busquedaEjercicio, setBusquedaEjercicio] = useState('');
  const [filtroGrupo, setFiltroGrupo] = useState('');

  // Dias expandidos (vista)
  const [diasExpandidos, setDiasExpandidos] = useState({});

  // Estado
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    if (rutina?._id) {
      cargarRutinaCompleta(rutina._id);
    } else {
      // Creacion nueva: cargar ejercicios de la biblioteca inmediatamente
      cargarEjerciciosLibreria();
    }
  }, [rutina]);

  const cargarRutinaCompleta = async (id) => {
    try {
      setCargando(true);
      const { data } = await entrenamientoAPI.obtenerRutinaPorId(id);
      setRutinaCompleta(data);
      // Expandir el primer dia por defecto
      if (data.dias?.length > 0) {
        setDiasExpandidos({ 0: true });
      }
    } catch (err) {
      setError('Error al cargar la rutina');
    } finally {
      setCargando(false);
    }
  };

  const cargarEjerciciosLibreria = async () => {
    if (ejerciciosLibreria.length > 0) return;
    try {
      setCargandoEjercicios(true);
      const { data } = await entrenamientoAPI.obtenerEjercicios();
      setEjerciciosLibreria(data);
    } catch (err) {
      console.error('Error al cargar ejercicios:', err);
    } finally {
      setCargandoEjercicios(false);
    }
  };

  const iniciarEdicion = () => {
    cargarEjerciciosLibreria();
    const r = rutinaCompleta;
    setFormulario({
      nombre: r.nombre || '',
      descripcion: r.descripcion || '',
      objetivo: r.objetivo || 'hipertrofia',
      dificultad: r.dificultad || 'intermedio',
      diasPorSemana: r.diasPorSemana || 3,
      activa: r.activa !== undefined ? r.activa : true,
      fechaInicio: r.fechaInicio ? r.fechaInicio.split('T')[0] : '',
      fechaFin: r.fechaFin ? r.fechaFin.split('T')[0] : '',
      dias: (r.dias || []).map(dia => ({
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
    setModo('editar');
  };

  const iniciarCreacion = () => {
    cargarEjerciciosLibreria();
    setFormulario({
      nombre: '',
      descripcion: '',
      objetivo: 'hipertrofia',
      dificultad: 'intermedio',
      diasPorSemana: 3,
      activa: true,
      fechaInicio: '',
      fechaFin: '',
      dias: []
    });
    setModo('editar');
  };

  // Funciones de formulario
  const agregarDia = () => {
    const numeroDia = formulario.dias.length + 1;
    setFormulario(prev => ({
      ...prev,
      dias: [...prev.dias, { nombre: `Dia ${numeroDia}`, ejercicios: [] }]
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

  const abrirSelector = (diaIndex) => {
    setSelectorDiaIndex(diaIndex);
    setBusquedaEjercicio('');
    setFiltroGrupo('');
    setMostrarSelector(true);
  };

  const seleccionarEjercicio = (ejercicioId) => {
    if (selectorDiaIndex === null) return;
    setFormulario(prev => ({
      ...prev,
      dias: prev.dias.map((dia, i) =>
        i === selectorDiaIndex
          ? { ...dia, ejercicios: [...dia.ejercicios, { ...ejercicioEntradaVacia, ejercicio: ejercicioId }] }
          : dia
      )
    }));
    setMostrarSelector(false);
    setSelectorDiaIndex(null);
  };

  const eliminarEjercicioDelDia = (diaIndex, ejIndex) => {
    setFormulario(prev => ({
      ...prev,
      dias: prev.dias.map((dia, i) =>
        i === diaIndex
          ? { ...dia, ejercicios: dia.ejercicios.filter((_, j) => j !== ejIndex) }
          : dia
      )
    }));
  };

  const actualizarEjercicioDelDia = (diaIndex, ejIndex, campo, valor) => {
    setFormulario(prev => ({
      ...prev,
      dias: prev.dias.map((dia, i) =>
        i === diaIndex
          ? {
              ...dia,
              ejercicios: dia.ejercicios.map((ej, j) =>
                j === ejIndex ? { ...ej, [campo]: valor } : ej
              )
            }
          : dia
      )
    }));
  };

  const getNombreEjercicio = (ejercicioId) => {
    const ej = ejerciciosLibreria.find(e => e._id === ejercicioId);
    return ej ? ej.nombre : 'Ejercicio';
  };

  const getGrupoEjercicio = (ejercicioId) => {
    const ej = ejerciciosLibreria.find(e => e._id === ejercicioId);
    return ej ? ej.grupoMuscular : '';
  };

  // Guardar
  const handleGuardar = async () => {
    if (!formulario.nombre.trim()) {
      setError('El nombre de la rutina es obligatorio');
      return;
    }

    setGuardando(true);
    setError('');
    try {
      const datos = {
        ...formulario,
        cliente: clienteId,
        entrenador: usuario._id,
        esPlantilla: false,
        diasPorSemana: parseInt(formulario.diasPorSemana) || 3,
        dias: formulario.dias.map((dia, diaIdx) => ({
          nombre: dia.nombre,
          orden: diaIdx + 1,
          ejercicios: dia.ejercicios.map((ej, ejIdx) => ({
            ejercicio: ej.ejercicio,
            orden: ejIdx + 1,
            series: parseInt(ej.series) || 3,
            repeticiones: ej.repeticiones || '10',
            descansoSegundos: parseInt(ej.descansoSegundos) || 60,
            peso: ej.peso || '',
            notas: ej.notas || ''
          }))
        }))
      };

      if (rutinaCompleta) {
        await entrenamientoAPI.actualizarRutina(rutinaCompleta._id, datos);
        setMensaje('Rutina actualizada correctamente');
      } else {
        await entrenamientoAPI.crearRutina(datos);
        setMensaje('Rutina creada correctamente');
      }

      setTimeout(() => {
        onGuardado && onGuardado();
      }, 800);
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al guardar la rutina');
    } finally {
      setGuardando(false);
    }
  };

  const toggleDia = (index) => {
    setDiasExpandidos(prev => ({ ...prev, [index]: !prev[index] }));
  };

  // Filtrar ejercicios del selector
  const ejerciciosFiltrados = ejerciciosLibreria.filter(ej => {
    if (!ej.activo) return false;
    if (filtroGrupo && ej.grupoMuscular !== filtroGrupo) return false;
    if (busquedaEjercicio) {
      return ej.nombre.toLowerCase().includes(busquedaEjercicio.toLowerCase());
    }
    return true;
  });

  const getImageUrl = (imagen) => {
    if (!imagen) return null;
    const apiUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    return `${apiUrl}${imagen}`;
  };

  // ========== RENDER ==========

  // Vista de carga
  if (cargando) {
    return (
      <div style={styles.overlay}>
        <div style={styles.modal}>
          <div style={styles.loading}>Cargando rutina...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h2 style={styles.headerTitle}>
              {modo === 'ver' ? rutinaCompleta?.nombre || 'Rutina' : (rutinaCompleta ? 'Editar Rutina' : 'Nueva Rutina')}
            </h2>
            <p style={styles.headerSubtitle}>{clienteNombre}</p>
          </div>
          <div style={styles.headerActions}>
            {modo === 'ver' && (
              <button style={styles.btnEditar} onClick={iniciarEdicion}>Editar</button>
            )}
            <button style={styles.btnCerrar} onClick={onClose}>&times;</button>
          </div>
        </div>

        {/* Mensajes */}
        {error && <div style={styles.errorMsg}>{error}</div>}
        {mensaje && <div style={styles.successMsg}>{mensaje}</div>}

        {/* Contenido */}
        <div style={styles.body}>
          {modo === 'ver' ? renderVista() : renderEdicion()}
        </div>
      </div>

      {/* Selector de ejercicio */}
      {mostrarSelector && (
        <div style={styles.selectorOverlay}>
          <div style={styles.selectorModal}>
            <div style={styles.selectorHeader}>
              <h3 style={styles.selectorTitle}>Seleccionar Ejercicio</h3>
              <button style={styles.btnCerrar} onClick={() => setMostrarSelector(false)}>&times;</button>
            </div>
            <div style={styles.selectorFiltros}>
              <input
                type="text"
                placeholder="Buscar ejercicio..."
                value={busquedaEjercicio}
                onChange={(e) => setBusquedaEjercicio(e.target.value)}
                style={styles.selectorInput}
              />
              <select
                value={filtroGrupo}
                onChange={(e) => setFiltroGrupo(e.target.value)}
                style={styles.selectorSelect}
              >
                <option value="">Todos los grupos</option>
                <option value="pecho">Pecho</option>
                <option value="espalda">Espalda</option>
                <option value="hombros">Hombros</option>
                <option value="biceps">Biceps</option>
                <option value="triceps">Triceps</option>
                <option value="piernas">Piernas</option>
                <option value="gluteos">Gluteos</option>
                <option value="core">Core</option>
                <option value="cardio">Cardio</option>
                <option value="cuerpo_completo">Cuerpo completo</option>
              </select>
            </div>
            <div style={styles.selectorLista}>
              {cargandoEjercicios ? (
                <div style={styles.loading}>Cargando ejercicios...</div>
              ) : ejerciciosFiltrados.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                  No se encontraron ejercicios
                </div>
              ) : (
                ejerciciosFiltrados.map(ej => (
                  <div
                    key={ej._id}
                    style={styles.selectorItem}
                    onClick={() => seleccionarEjercicio(ej._id)}
                  >
                    <div style={styles.selectorItemNombre}>{ej.nombre}</div>
                    <span style={{
                      ...styles.selectorItemGrupo,
                      backgroundColor: coloresGrupoMuscular[ej.grupoMuscular] || '#607d8b'
                    }}>
                      {ej.grupoMuscular?.replace('_', ' ')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ====== VISTA (solo lectura) ======
  function renderVista() {
    if (!rutinaCompleta) return null;
    const r = rutinaCompleta;

    return (
      <div>
        {/* Info general */}
        <div style={styles.infoGrid}>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>Objetivo</span>
            <span style={{
              ...styles.infoBadge,
              backgroundColor: objetivoColores[r.objetivo] || '#607d8b'
            }}>
              {objetivoLabels[r.objetivo] || r.objetivo}
            </span>
          </div>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>Dificultad</span>
            <span style={styles.infoValue}>{dificultadLabels[r.dificultad] || r.dificultad}</span>
          </div>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>Dias/semana</span>
            <span style={styles.infoValue}>{r.diasPorSemana || '-'}</span>
          </div>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>Estado</span>
            <span style={{
              ...styles.infoBadge,
              backgroundColor: r.activa ? '#10b981' : '#999'
            }}>
              {r.activa ? 'Activa' : 'Inactiva'}
            </span>
          </div>
        </div>

        {r.descripcion && (
          <p style={styles.descripcion}>{r.descripcion}</p>
        )}

        {/* Dias */}
        <h3 style={styles.seccionTitulo}>Dias de entrenamiento</h3>
        {r.dias && r.dias.length > 0 ? (
          <div style={styles.diasLista}>
            {r.dias.map((dia, idx) => (
              <div key={idx} style={styles.diaCard}>
                <div
                  style={styles.diaHeader}
                  onClick={() => toggleDia(idx)}
                >
                  <div style={styles.diaHeaderLeft}>
                    <span style={styles.diaToggle}>{diasExpandidos[idx] ? '▼' : '▶'}</span>
                    <span style={styles.diaNombre}>{dia.nombre}</span>
                    <span style={styles.diaEjCount}>{dia.ejercicios?.length || 0} ejercicios</span>
                  </div>
                </div>

                {diasExpandidos[idx] && dia.ejercicios && (
                  <div style={styles.ejerciciosLista}>
                    {dia.ejercicios.map((ej, ejIdx) => (
                      <div key={ejIdx} style={styles.ejercicioRow}>
                        <div style={styles.ejercicioInfo}>
                          {ej.ejercicio?.imagen ? (
                            <img
                              src={getImageUrl(ej.ejercicio.imagen)}
                              alt={ej.ejercicio.nombre}
                              style={styles.ejercicioMiniatura}
                            />
                          ) : (
                            <span style={styles.ejercicioOrden}>{ejIdx + 1}</span>
                          )}
                          <div>
                            <div style={styles.ejercicioNombre}>
                              {ej.ejercicio?.nombre || 'Ejercicio'}
                            </div>
                            <span style={{
                              ...styles.ejercicioGrupo,
                              backgroundColor: coloresGrupoMuscular[ej.ejercicio?.grupoMuscular] || '#607d8b'
                            }}>
                              {ej.ejercicio?.grupoMuscular?.replace('_', ' ') || ''}
                            </span>
                          </div>
                        </div>
                        <div style={styles.ejercicioDetalles}>
                          <span style={styles.ejercicioDetalle}>{ej.series} x {ej.repeticiones}</span>
                          <span style={styles.ejercicioDetalleSep}>|</span>
                          <span style={styles.ejercicioDetalle}>{ej.descansoSegundos}s desc.</span>
                          {ej.peso && (
                            <>
                              <span style={styles.ejercicioDetalleSep}>|</span>
                              <span style={styles.ejercicioDetalle}>{ej.peso} kg</span>
                            </>
                          )}
                        </div>
                        {ej.notas && (
                          <div style={styles.ejercicioNotas}>{ej.notas}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.empty}>Esta rutina no tiene dias programados.</div>
        )}
      </div>
    );
  }

  // ====== EDICION ======
  function renderEdicion() {
    return (
      <div>
        {/* Datos generales */}
        <div style={styles.formSection}>
          <h3 style={styles.seccionTitulo}>Datos generales</h3>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Nombre *</label>
              <input
                type="text"
                value={formulario.nombre}
                onChange={(e) => setFormulario(prev => ({ ...prev, nombre: e.target.value }))}
                style={styles.formInput}
                placeholder="Ej: Rutina Hipertrofia Fase 1"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Objetivo</label>
              <select
                value={formulario.objetivo}
                onChange={(e) => setFormulario(prev => ({ ...prev, objetivo: e.target.value }))}
                style={styles.formSelect}
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
                style={styles.formSelect}
              >
                {Object.entries(dificultadLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Dias/semana</label>
              <input
                type="number"
                min="1"
                max="7"
                value={formulario.diasPorSemana}
                onChange={(e) => setFormulario(prev => ({ ...prev, diasPorSemana: e.target.value }))}
                style={styles.formInput}
              />
            </div>
            <div style={styles.formGroupFull}>
              <label style={styles.formLabel}>Descripcion</label>
              <textarea
                value={formulario.descripcion}
                onChange={(e) => setFormulario(prev => ({ ...prev, descripcion: e.target.value }))}
                style={styles.formTextarea}
                rows="2"
                placeholder="Descripcion opcional de la rutina"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Fecha inicio</label>
              <input
                type="date"
                value={formulario.fechaInicio}
                onChange={(e) => setFormulario(prev => ({ ...prev, fechaInicio: e.target.value }))}
                style={styles.formInput}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Fecha fin</label>
              <input
                type="date"
                value={formulario.fechaFin}
                onChange={(e) => setFormulario(prev => ({ ...prev, fechaFin: e.target.value }))}
                style={styles.formInput}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formCheckboxLabel}>
                <input
                  type="checkbox"
                  checked={formulario.activa}
                  onChange={(e) => setFormulario(prev => ({ ...prev, activa: e.target.checked }))}
                  style={styles.formCheckbox}
                />
                Rutina activa
              </label>
            </div>
          </div>
        </div>

        {/* Dias */}
        <div style={styles.formSection}>
          <div style={styles.diasEditHeader}>
            <h3 style={styles.seccionTitulo}>Dias de entrenamiento</h3>
            <button style={styles.btnAgregar} onClick={agregarDia}>+ Agregar dia</button>
          </div>

          {formulario.dias.length === 0 ? (
            <div style={styles.empty}>
              No hay dias configurados. Agrega un dia para empezar a construir la rutina.
            </div>
          ) : (
            formulario.dias.map((dia, diaIdx) => (
              <div key={diaIdx} style={styles.diaEditCard}>
                <div style={styles.diaEditHeader}>
                  <input
                    type="text"
                    value={dia.nombre}
                    onChange={(e) => actualizarNombreDia(diaIdx, e.target.value)}
                    style={styles.diaEditNombreInput}
                    placeholder="Nombre del dia"
                  />
                  <div style={styles.diaEditActions}>
                    <button
                      style={styles.btnAgregarEj}
                      onClick={() => abrirSelector(diaIdx)}
                    >
                      + Ejercicio
                    </button>
                    <button
                      style={styles.btnEliminarDia}
                      onClick={() => eliminarDia(diaIdx)}
                      title="Eliminar dia"
                    >
                      &times;
                    </button>
                  </div>
                </div>

                {dia.ejercicios.length === 0 ? (
                  <div style={styles.diaEditEmpty}>
                    Sin ejercicios. Pulsa "+ Ejercicio" para agregar.
                  </div>
                ) : (
                  <div style={styles.ejerciciosEditLista}>
                    {dia.ejercicios.map((ej, ejIdx) => (
                      <div key={ejIdx} style={styles.ejercicioEditRow}>
                        <div style={styles.ejercicioEditInfo}>
                          <span style={styles.ejercicioOrden}>{ejIdx + 1}</span>
                          <div style={styles.ejercicioEditNombre}>
                            <span style={styles.ejercicioNombreText}>
                              {getNombreEjercicio(ej.ejercicio)}
                            </span>
                            {getGrupoEjercicio(ej.ejercicio) && (
                              <span style={{
                                ...styles.ejercicioGrupo,
                                backgroundColor: coloresGrupoMuscular[getGrupoEjercicio(ej.ejercicio)] || '#607d8b'
                              }}>
                                {getGrupoEjercicio(ej.ejercicio).replace('_', ' ')}
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={styles.ejercicioEditCampos}>
                          <div style={styles.campoMini}>
                            <label style={styles.campoMiniLabel}>Series</label>
                            <input
                              type="number"
                              min="1"
                              value={ej.series}
                              onChange={(e) => actualizarEjercicioDelDia(diaIdx, ejIdx, 'series', e.target.value)}
                              style={styles.campoMiniInput}
                            />
                          </div>
                          <div style={styles.campoMini}>
                            <label style={styles.campoMiniLabel}>Reps</label>
                            <input
                              type="text"
                              value={ej.repeticiones}
                              onChange={(e) => actualizarEjercicioDelDia(diaIdx, ejIdx, 'repeticiones', e.target.value)}
                              style={styles.campoMiniInput}
                              placeholder="10"
                            />
                          </div>
                          <div style={styles.campoMini}>
                            <label style={styles.campoMiniLabel}>Desc.(s)</label>
                            <input
                              type="number"
                              min="0"
                              value={ej.descansoSegundos}
                              onChange={(e) => actualizarEjercicioDelDia(diaIdx, ejIdx, 'descansoSegundos', e.target.value)}
                              style={styles.campoMiniInput}
                            />
                          </div>
                          <div style={styles.campoMini}>
                            <label style={styles.campoMiniLabel}>Peso</label>
                            <input
                              type="text"
                              value={ej.peso}
                              onChange={(e) => actualizarEjercicioDelDia(diaIdx, ejIdx, 'peso', e.target.value)}
                              style={styles.campoMiniInput}
                              placeholder="kg"
                            />
                          </div>
                          <button
                            style={styles.btnEliminarEj}
                            onClick={() => eliminarEjercicioDelDia(diaIdx, ejIdx)}
                            title="Eliminar ejercicio"
                          >
                            &times;
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Botones de accion */}
        <div style={styles.footerActions}>
          <button
            style={styles.btnCancelar}
            onClick={() => {
              if (rutinaCompleta) {
                setModo('ver');
              } else {
                onClose();
              }
            }}
          >
            Cancelar
          </button>
          <button
            style={styles.btnGuardar}
            onClick={handleGuardar}
            disabled={guardando}
          >
            {guardando ? 'Guardando...' : (rutinaCompleta ? 'Guardar Cambios' : 'Crear Rutina')}
          </button>
        </div>
      </div>
    );
  }
}

// ====== ESTILOS ======
const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1100,
    padding: '20px'
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '800px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #e4e4e9',
    flexShrink: 0
  },
  headerTitle: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#1a1a2e',
    margin: 0,
    fontFamily: 'Inter, sans-serif'
  },
  headerSubtitle: {
    fontSize: '13px',
    color: '#6b7280',
    margin: '4px 0 0',
    fontFamily: 'Inter, sans-serif'
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  btnEditar: {
    padding: '8px 16px',
    backgroundColor: '#10b981',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600
  },
  btnCerrar: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#666',
    padding: '4px 8px',
    lineHeight: 1
  },
  body: {
    padding: '20px 24px',
    overflowY: 'auto',
    flex: 1
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '60px 0',
    fontSize: '16px',
    color: '#666'
  },
  errorMsg: {
    margin: '0 24px',
    padding: '10px 14px',
    backgroundColor: '#fee',
    color: '#c00',
    borderRadius: '8px',
    fontSize: '13px'
  },
  successMsg: {
    margin: '0 24px',
    padding: '10px 14px',
    backgroundColor: '#eeffee',
    color: '#080',
    borderRadius: '8px',
    fontSize: '13px'
  },

  // Vista
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '12px',
    marginBottom: '16px'
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  infoLabel: {
    fontSize: '12px',
    color: '#888',
    fontWeight: 500
  },
  infoValue: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1a1a2e'
  },
  infoBadge: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#fff',
    width: 'fit-content'
  },
  descripcion: {
    fontSize: '14px',
    color: '#555',
    marginBottom: '20px',
    lineHeight: 1.5,
    backgroundColor: '#f9fafb',
    padding: '12px',
    borderRadius: '8px'
  },
  seccionTitulo: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#1a1a2e',
    margin: '0 0 12px',
    fontFamily: 'Inter, sans-serif'
  },
  diasLista: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  diaCard: {
    backgroundColor: '#f9fafb',
    borderRadius: '10px',
    border: '1px solid #e4e4e9',
    overflow: 'hidden'
  },
  diaHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    cursor: 'pointer',
    userSelect: 'none'
  },
  diaHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  diaToggle: {
    fontSize: '11px',
    color: '#888',
    width: '16px'
  },
  diaNombre: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1a1a2e'
  },
  diaEjCount: {
    fontSize: '12px',
    color: '#888',
    fontWeight: 400
  },
  ejerciciosLista: {
    borderTop: '1px solid #e4e4e9',
    padding: '8px 0'
  },
  ejercicioRow: {
    padding: '10px 16px 10px 42px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    borderBottom: '1px solid #f0f0f0'
  },
  ejercicioInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  ejercicioOrden: {
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: 700,
    flexShrink: 0
  },
  ejercicioMiniatura: {
    width: '40px',
    height: '40px',
    borderRadius: '6px',
    objectFit: 'cover',
    flexShrink: 0
  },
  ejercicioNombre: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1a1a2e'
  },
  ejercicioGrupo: {
    display: 'inline-block',
    padding: '1px 8px',
    borderRadius: '10px',
    fontSize: '10px',
    fontWeight: 600,
    color: '#fff',
    marginTop: '2px',
    textTransform: 'capitalize'
  },
  ejercicioDetalles: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginLeft: '32px',
    fontSize: '13px',
    color: '#555'
  },
  ejercicioDetalle: {
    fontSize: '13px',
    color: '#555'
  },
  ejercicioDetalleSep: {
    color: '#ddd'
  },
  ejercicioNotas: {
    marginLeft: '32px',
    fontSize: '12px',
    color: '#888',
    fontStyle: 'italic'
  },
  empty: {
    padding: '24px',
    textAlign: 'center',
    color: '#999',
    fontSize: '14px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px'
  },

  // Edicion
  formSection: {
    marginBottom: '24px'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  formGroupFull: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    gridColumn: '1 / -1'
  },
  formLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#555'
  },
  formInput: {
    padding: '8px 10px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    outline: 'none'
  },
  formSelect: {
    padding: '8px 10px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#fff'
  },
  formTextarea: {
    padding: '8px 10px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit'
  },
  formCheckboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#333',
    cursor: 'pointer',
    paddingTop: '20px'
  },
  formCheckbox: {
    width: '16px',
    height: '16px',
    cursor: 'pointer'
  },

  // Dias edicion
  diasEditHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  btnAgregar: {
    padding: '7px 14px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500
  },
  diaEditCard: {
    backgroundColor: '#f9fafb',
    borderRadius: '10px',
    border: '1px solid #e4e4e9',
    marginBottom: '12px',
    overflow: 'hidden'
  },
  diaEditHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 14px',
    gap: '10px',
    backgroundColor: '#f3f4f6'
  },
  diaEditNombreInput: {
    flex: 1,
    padding: '6px 10px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    fontWeight: 600,
    outline: 'none'
  },
  diaEditActions: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center'
  },
  btnAgregarEj: {
    padding: '5px 12px',
    backgroundColor: '#10b981',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 500,
    whiteSpace: 'nowrap'
  },
  btnEliminarDia: {
    padding: '4px 8px',
    backgroundColor: '#dc3545',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    lineHeight: 1,
    fontWeight: 700
  },
  diaEditEmpty: {
    padding: '16px',
    textAlign: 'center',
    color: '#999',
    fontSize: '13px'
  },
  ejerciciosEditLista: {
    padding: '6px 0'
  },
  ejercicioEditRow: {
    padding: '8px 14px',
    borderBottom: '1px solid #eeeff2'
  },
  ejercicioEditInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '6px'
  },
  ejercicioEditNombre: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  ejercicioNombreText: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#1a1a2e'
  },
  ejercicioEditCampos: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '8px',
    marginLeft: '32px',
    flexWrap: 'wrap'
  },
  campoMini: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  campoMiniLabel: {
    fontSize: '10px',
    color: '#888',
    fontWeight: 500
  },
  campoMiniInput: {
    padding: '5px 6px',
    borderRadius: '5px',
    border: '1px solid #d1d5db',
    fontSize: '13px',
    width: '65px',
    outline: 'none',
    textAlign: 'center'
  },
  btnEliminarEj: {
    padding: '3px 8px',
    backgroundColor: 'transparent',
    color: '#dc3545',
    border: '1px solid #dc3545',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
    lineHeight: 1,
    fontWeight: 700,
    marginLeft: 'auto'
  },

  // Footer
  footerActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    paddingTop: '16px',
    borderTop: '1px solid #e4e4e9',
    marginTop: '8px'
  },
  btnCancelar: {
    padding: '10px 20px',
    backgroundColor: '#f3f4f6',
    color: '#333',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500
  },
  btnGuardar: {
    padding: '10px 24px',
    backgroundColor: '#10b981',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600
  },

  // Selector de ejercicio
  selectorOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1200,
    padding: '20px'
  },
  selectorModal: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '500px',
    maxHeight: '70vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
  },
  selectorHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #e4e4e9'
  },
  selectorTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1a1a2e',
    margin: 0
  },
  selectorFiltros: {
    padding: '12px 20px',
    display: 'flex',
    gap: '8px',
    borderBottom: '1px solid #f0f0f0'
  },
  selectorInput: {
    flex: 1,
    padding: '8px 10px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '13px',
    outline: 'none'
  },
  selectorSelect: {
    padding: '8px 10px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '13px',
    outline: 'none',
    backgroundColor: '#fff'
  },
  selectorLista: {
    overflowY: 'auto',
    flex: 1,
    padding: '4px 0'
  },
  selectorItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 20px',
    cursor: 'pointer',
    borderBottom: '1px solid #f5f5f5',
    transition: 'background-color 0.15s'
  },
  selectorItemNombre: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#1a1a2e'
  },
  selectorItemGrupo: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: 600,
    color: '#fff',
    textTransform: 'capitalize'
  }
};

export default ModalEditarRutina;
