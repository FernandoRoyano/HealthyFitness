import { useState, useEffect } from 'react';
import { entrenamientoAPI } from '../services/api';

const formatearFechaLocal = (fecha) => {
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, '0');
  const day = String(fecha.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const RegistrarEntrenamiento = ({ clienteId, clienteNombre, onClose, onRegistrado }) => {
  // Estado principal
  const [rutina, setRutina] = useState(null);
  const [cargandoRutina, setCargandoRutina] = useState(true);
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [ejercicios, setEjercicios] = useState([]);
  const [duracionMinutos, setDuracionMinutos] = useState('');
  const [notas, setNotas] = useState('');
  const [fecha, setFecha] = useState(formatearFechaLocal(new Date()));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  // Estado para modo manual (sin rutina activa)
  const [modoManual, setModoManual] = useState(false);
  const [bibliotecaEjercicios, setBibliotecaEjercicios] = useState([]);
  const [cargandoBiblioteca, setCargandoBiblioteca] = useState(false);
  const [busquedaEjercicio, setBusquedaEjercicio] = useState('');
  const [mostrarBiblioteca, setMostrarBiblioteca] = useState(false);

  // Cargar rutina activa del cliente
  useEffect(() => {
    cargarRutinaActiva();
  }, [clienteId]);

  const cargarRutinaActiva = async () => {
    setCargandoRutina(true);
    setError('');
    try {
      const { data } = await entrenamientoAPI.obtenerRutinasPorCliente(clienteId);
      const rutinas = data.datos || data;
      const rutinaActiva = Array.isArray(rutinas)
        ? rutinas.find(r => r.activa === true)
        : null;

      if (rutinaActiva && rutinaActiva.dias && rutinaActiva.dias.length > 0) {
        setRutina(rutinaActiva);
        setModoManual(false);
      } else {
        setRutina(null);
        setModoManual(true);
      }
    } catch (err) {
      console.error('Error al cargar rutina:', err);
      setRutina(null);
      setModoManual(true);
    } finally {
      setCargandoRutina(false);
    }
  };

  // Seleccionar un dia de la rutina
  const seleccionarDia = (dia) => {
    setDiaSeleccionado(dia);
    const ejerciciosDelDia = dia.ejercicios.map(ej => ({
      ejercicio: ej.ejercicio._id || ej.ejercicio,
      nombre: ej.ejercicio.nombre || 'Ejercicio',
      grupoMuscular: ej.ejercicio.grupoMuscular || '',
      series: Array.from({ length: ej.series || 3 }, (_, i) => ({
        numeroSerie: i + 1,
        peso: ej.peso ? String(ej.peso) : '',
        repeticiones: ej.repeticiones ? String(ej.repeticiones) : '',
        rpe: '',
        completada: true
      })),
      notas: ''
    }));
    setEjercicios(ejerciciosDelDia);
  };

  // Cargar biblioteca de ejercicios para modo manual
  const cargarBiblioteca = async () => {
    if (bibliotecaEjercicios.length > 0) {
      setMostrarBiblioteca(true);
      return;
    }
    setCargandoBiblioteca(true);
    try {
      const { data } = await entrenamientoAPI.obtenerEjercicios({ activo: true, limit: 500 });
      const lista = data.datos || data;
      setBibliotecaEjercicios(Array.isArray(lista) ? lista : []);
      setMostrarBiblioteca(true);
    } catch (err) {
      setError('Error al cargar la biblioteca de ejercicios');
    } finally {
      setCargandoBiblioteca(false);
    }
  };

  // Agregar ejercicio manual desde biblioteca
  const agregarEjercicioManual = (ejercicioLib) => {
    const nuevoEjercicio = {
      ejercicio: ejercicioLib._id,
      nombre: ejercicioLib.nombre,
      grupoMuscular: ejercicioLib.grupoMuscular || '',
      series: [
        { numeroSerie: 1, peso: '', repeticiones: '', rpe: '', completada: true },
        { numeroSerie: 2, peso: '', repeticiones: '', rpe: '', completada: true },
        { numeroSerie: 3, peso: '', repeticiones: '', rpe: '', completada: true }
      ],
      notas: ''
    };
    setEjercicios(prev => [...prev, nuevoEjercicio]);
    setMostrarBiblioteca(false);
    setBusquedaEjercicio('');
  };

  // Eliminar ejercicio
  const eliminarEjercicio = (indice) => {
    setEjercicios(prev => prev.filter((_, i) => i !== indice));
  };

  // Actualizar una serie de un ejercicio
  const actualizarSerie = (ejercicioIdx, serieIdx, campo, valor) => {
    setEjercicios(prev => prev.map((ej, i) => {
      if (i !== ejercicioIdx) return ej;
      const nuevasSeries = ej.series.map((serie, j) => {
        if (j !== serieIdx) return serie;
        if (campo === 'completada') {
          return { ...serie, completada: valor };
        }
        return { ...serie, [campo]: valor };
      });
      return { ...ej, series: nuevasSeries };
    }));
  };

  // Actualizar notas de un ejercicio
  const actualizarNotasEjercicio = (ejercicioIdx, valor) => {
    setEjercicios(prev => prev.map((ej, i) => {
      if (i !== ejercicioIdx) return ej;
      return { ...ej, notas: valor };
    }));
  };

  // Agregar serie a un ejercicio
  const agregarSerie = (ejercicioIdx) => {
    setEjercicios(prev => prev.map((ej, i) => {
      if (i !== ejercicioIdx) return ej;
      const nuevoNumero = ej.series.length + 1;
      return {
        ...ej,
        series: [...ej.series, {
          numeroSerie: nuevoNumero,
          peso: '',
          repeticiones: '',
          rpe: '',
          completada: true
        }]
      };
    }));
  };

  // Eliminar ultima serie de un ejercicio
  const eliminarUltimaSerie = (ejercicioIdx) => {
    setEjercicios(prev => prev.map((ej, i) => {
      if (i !== ejercicioIdx || ej.series.length <= 1) return ej;
      return {
        ...ej,
        series: ej.series.slice(0, -1)
      };
    }));
  };

  // Guardar entrenamiento
  const handleGuardar = async () => {
    setError('');
    setMensaje('');

    if (ejercicios.length === 0) {
      setError('Debes agregar al menos un ejercicio');
      return;
    }

    // Validar que al menos una serie tenga datos
    const tieneAlgunDato = ejercicios.some(ej =>
      ej.series.some(s => s.peso !== '' || s.repeticiones !== '')
    );
    if (!tieneAlgunDato) {
      setError('Debes completar al menos una serie con peso o repeticiones');
      return;
    }

    setGuardando(true);

    try {
      const ejerciciosParaEnviar = ejercicios.map(ej => ({
        ejercicio: ej.ejercicio,
        series: ej.series
          .filter(s => s.completada || s.peso !== '' || s.repeticiones !== '')
          .map(s => ({
            numeroSerie: s.numeroSerie,
            peso: s.peso !== '' ? parseFloat(s.peso) : undefined,
            repeticiones: s.repeticiones !== '' ? parseInt(s.repeticiones, 10) : undefined,
            rpe: s.rpe !== '' ? parseInt(s.rpe, 10) : undefined,
            completada: s.completada
          })),
        notas: ej.notas || undefined
      }));

      const datos = {
        cliente: clienteId,
        fecha,
        ejercicios: ejerciciosParaEnviar,
        duracionMinutos: duracionMinutos !== '' ? parseInt(duracionMinutos, 10) : undefined,
        notas: notas || undefined,
        completado: true
      };

      if (rutina) {
        datos.rutina = rutina._id;
      }
      if (diaSeleccionado) {
        datos.diaRutina = diaSeleccionado.nombre;
      }

      await entrenamientoAPI.registrarEntrenamiento(datos);
      setMensaje('Entrenamiento registrado correctamente');

      setTimeout(() => {
        if (onRegistrado) onRegistrado();
        onClose();
      }, 1200);
    } catch (err) {
      const mensajeError = err.response?.data?.mensaje || err.response?.data?.error || 'Error al guardar el entrenamiento';
      setError(mensajeError);
    } finally {
      setGuardando(false);
    }
  };

  // Volver al selector de dias
  const volverADias = () => {
    setDiaSeleccionado(null);
    setEjercicios([]);
  };

  // Filtrado de biblioteca
  const ejerciciosFiltrados = bibliotecaEjercicios.filter(ej =>
    ej.nombre.toLowerCase().includes(busquedaEjercicio.toLowerCase()) ||
    (ej.grupoMuscular || '').toLowerCase().includes(busquedaEjercicio.toLowerCase())
  );

  // Badge color para grupo muscular
  const getGrupoColor = (grupo) => {
    const colores = {
      pecho: '#e74c3c',
      espalda: '#3498db',
      hombros: '#FF6F00',
      biceps: '#9b59b6',
      triceps: '#8e44ad',
      piernas: '#27ae60',
      gluteos: '#e67e22',
      core: '#f39c12',
      cardio: '#1abc9c',
      cuerpo_completo: '#2c3e50'
    };
    return colores[grupo] || '#666';
  };

  const formatearGrupo = (grupo) => {
    if (!grupo) return '';
    const nombres = {
      pecho: 'Pecho',
      espalda: 'Espalda',
      hombros: 'Hombros',
      biceps: 'Biceps',
      triceps: 'Triceps',
      piernas: 'Piernas',
      gluteos: 'Gluteos',
      core: 'Core',
      cardio: 'Cardio',
      cuerpo_completo: 'Cuerpo Completo'
    };
    return nombres[grupo] || grupo;
  };

  // ============ RENDER ============

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h2 style={styles.titulo}>Registrar Entrenamiento</h2>
            <p style={styles.subtitulo}>{clienteNombre}</p>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>

        {/* Mensajes */}
        {error && <div style={styles.errorMsg}>{error}</div>}
        {mensaje && <div style={styles.exitoMsg}>{mensaje}</div>}

        {/* Contenido scrollable */}
        <div style={styles.body}>
          {cargandoRutina ? (
            <div style={styles.cargando}>
              <div style={styles.spinner} />
              <p>Cargando rutina del cliente...</p>
            </div>
          ) : !modoManual && rutina && !diaSeleccionado ? (
            // ===== PASO 1: SELECTOR DE DIA =====
            <div>
              <p style={styles.seccionLabel}>
                Rutina activa: <strong>{rutina.nombre}</strong>
              </p>
              <p style={styles.instrucciones}>Selecciona el dia de entrenamiento:</p>
              <div style={styles.diasGrid}>
                {rutina.dias
                  .sort((a, b) => a.orden - b.orden)
                  .map(dia => (
                    <button
                      key={dia._id || dia.nombre}
                      style={styles.diaBtn}
                      onClick={() => seleccionarDia(dia)}
                      onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor = '#75b760';
                        e.currentTarget.style.color = '#fff';
                        e.currentTarget.style.borderColor = '#75b760';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor = '#f0fdf0';
                        e.currentTarget.style.color = '#1a1a2e';
                        e.currentTarget.style.borderColor = '#75b760';
                      }}
                    >
                      <span style={styles.diaNombre}>{dia.nombre}</span>
                      <span style={styles.diaEjercicios}>
                        {dia.ejercicios.length} ejercicio{dia.ejercicios.length !== 1 ? 's' : ''}
                      </span>
                    </button>
                  ))}
              </div>
              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <button
                  style={styles.btnTexto}
                  onClick={() => {
                    setModoManual(true);
                    setDiaSeleccionado(null);
                    setEjercicios([]);
                  }}
                >
                  O registrar sin rutina (modo manual)
                </button>
              </div>
            </div>
          ) : (
            // ===== PASO 2: FORMULARIO DE EJERCICIOS =====
            <div>
              {/* Boton volver (si venia de rutina) */}
              {rutina && !modoManual && (
                <div style={styles.volverRow}>
                  <button style={styles.btnVolver} onClick={volverADias}>
                    &larr; Cambiar dia
                  </button>
                  <span style={styles.diaActual}>
                    {diaSeleccionado?.nombre}
                  </span>
                </div>
              )}

              {modoManual && rutina && (
                <div style={styles.volverRow}>
                  <button style={styles.btnVolver} onClick={() => {
                    setModoManual(false);
                    setEjercicios([]);
                  }}>
                    &larr; Volver a rutina
                  </button>
                  <span style={styles.diaActual}>Modo manual (sin rutina)</span>
                </div>
              )}

              {modoManual && !rutina && (
                <div style={styles.volverRow}>
                  <span style={styles.diaActual}>Sin rutina asignada - Modo manual</span>
                </div>
              )}

              {/* Lista de ejercicios */}
              {ejercicios.length === 0 && (
                <p style={styles.sinEjercicios}>
                  No hay ejercicios. Agrega ejercicios desde la biblioteca.
                </p>
              )}

              {ejercicios.map((ej, ejIdx) => (
                <div key={ejIdx} style={styles.ejercicioCard}>
                  <div style={styles.ejercicioHeader}>
                    <div style={styles.ejercicioTitulo}>
                      <strong style={styles.ejercicioNombre}>{ej.nombre}</strong>
                      {ej.grupoMuscular && (
                        <span style={{
                          ...styles.grupoBadge,
                          backgroundColor: getGrupoColor(ej.grupoMuscular)
                        }}>
                          {formatearGrupo(ej.grupoMuscular)}
                        </span>
                      )}
                    </div>
                    <button
                      style={styles.btnEliminarEj}
                      onClick={() => eliminarEjercicio(ejIdx)}
                      title="Eliminar ejercicio"
                    >
                      &times;
                    </button>
                  </div>

                  {/* Tabla de series */}
                  <div style={styles.tablaContainer}>
                    <table style={styles.tabla}>
                      <thead>
                        <tr>
                          <th style={styles.th}>#</th>
                          <th style={styles.th}>Peso (kg)</th>
                          <th style={styles.th}>Reps</th>
                          <th style={styles.th}>RPE</th>
                          <th style={{ ...styles.th, textAlign: 'center' }}>Completada</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ej.series.map((serie, sIdx) => (
                          <tr key={sIdx} style={!serie.completada ? styles.serieNoCompletada : {}}>
                            <td style={styles.td}>
                              <span style={styles.serieNum}>#{serie.numeroSerie}</span>
                            </td>
                            <td style={styles.td}>
                              <input
                                type="number"
                                style={styles.inputSerie}
                                value={serie.peso}
                                onChange={e => actualizarSerie(ejIdx, sIdx, 'peso', e.target.value)}
                                placeholder="0"
                                min="0"
                                step="0.5"
                              />
                            </td>
                            <td style={styles.td}>
                              <input
                                type="number"
                                style={styles.inputSerie}
                                value={serie.repeticiones}
                                onChange={e => actualizarSerie(ejIdx, sIdx, 'repeticiones', e.target.value)}
                                placeholder="0"
                                min="0"
                              />
                            </td>
                            <td style={styles.td}>
                              <input
                                type="number"
                                style={{ ...styles.inputSerie, width: '52px' }}
                                value={serie.rpe}
                                onChange={e => actualizarSerie(ejIdx, sIdx, 'rpe', e.target.value)}
                                placeholder="-"
                                min="1"
                                max="10"
                              />
                            </td>
                            <td style={{ ...styles.td, textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={serie.completada}
                                onChange={e => actualizarSerie(ejIdx, sIdx, 'completada', e.target.checked)}
                                style={styles.checkbox}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div style={styles.seriesBotones}>
                    <button
                      style={styles.btnAgregarSerie}
                      onClick={() => agregarSerie(ejIdx)}
                    >
                      + Serie
                    </button>
                    {ej.series.length > 1 && (
                      <button
                        style={styles.btnQuitarSerie}
                        onClick={() => eliminarUltimaSerie(ejIdx)}
                      >
                        - Serie
                      </button>
                    )}
                  </div>

                  {/* Notas del ejercicio */}
                  <input
                    type="text"
                    style={styles.inputNotasEj}
                    placeholder="Notas del ejercicio (opcional)"
                    value={ej.notas}
                    onChange={e => actualizarNotasEjercicio(ejIdx, e.target.value)}
                  />
                </div>
              ))}

              {/* Boton agregar ejercicio */}
              <div style={styles.agregarEjContainer}>
                <button
                  style={styles.btnAgregarEjercicio}
                  onClick={cargarBiblioteca}
                  disabled={cargandoBiblioteca}
                >
                  {cargandoBiblioteca ? 'Cargando...' : '+ Agregar Ejercicio'}
                </button>
              </div>

              {/* Selector de biblioteca (overlay interno) */}
              {mostrarBiblioteca && (
                <div style={styles.bibliotecaOverlay}>
                  <div style={styles.bibliotecaBox}>
                    <div style={styles.bibliotecaHeader}>
                      <h3 style={styles.bibliotecaTitulo}>Biblioteca de Ejercicios</h3>
                      <button
                        style={styles.closeBtn}
                        onClick={() => {
                          setMostrarBiblioteca(false);
                          setBusquedaEjercicio('');
                        }}
                      >
                        &times;
                      </button>
                    </div>
                    <input
                      type="text"
                      style={styles.inputBusqueda}
                      placeholder="Buscar por nombre o grupo muscular..."
                      value={busquedaEjercicio}
                      onChange={e => setBusquedaEjercicio(e.target.value)}
                      autoFocus
                    />
                    <div style={styles.bibliotecaLista}>
                      {ejerciciosFiltrados.length === 0 ? (
                        <p style={styles.sinResultados}>No se encontraron ejercicios</p>
                      ) : (
                        ejerciciosFiltrados.map(ejLib => (
                          <div
                            key={ejLib._id}
                            style={styles.bibliotecaItem}
                            onClick={() => agregarEjercicioManual(ejLib)}
                            onMouseEnter={e => {
                              e.currentTarget.style.backgroundColor = '#f0fdf0';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <span style={styles.bibliotecaNombre}>{ejLib.nombre}</span>
                            {ejLib.grupoMuscular && (
                              <span style={{
                                ...styles.grupoBadgeSmall,
                                backgroundColor: getGrupoColor(ejLib.grupoMuscular)
                              }}>
                                {formatearGrupo(ejLib.grupoMuscular)}
                              </span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Campos generales del entrenamiento */}
              {ejercicios.length > 0 && (
                <div style={styles.camposGenerales}>
                  <div style={styles.separador} />

                  <div style={styles.camposRow}>
                    <div style={styles.campoGroup}>
                      <label style={styles.label}>Fecha</label>
                      <input
                        type="date"
                        style={styles.inputCampo}
                        value={fecha}
                        onChange={e => setFecha(e.target.value)}
                      />
                    </div>
                    <div style={styles.campoGroup}>
                      <label style={styles.label}>Duracion (min)</label>
                      <input
                        type="number"
                        style={styles.inputCampo}
                        value={duracionMinutos}
                        onChange={e => setDuracionMinutos(e.target.value)}
                        placeholder="60"
                        min="1"
                      />
                    </div>
                  </div>

                  <div style={styles.campoGroupFull}>
                    <label style={styles.label}>Notas de la sesion</label>
                    <textarea
                      style={styles.textarea}
                      value={notas}
                      onChange={e => setNotas(e.target.value)}
                      placeholder="Observaciones generales del entrenamiento..."
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {(!cargandoRutina && (diaSeleccionado || modoManual)) && (
          <div style={styles.footer}>
            <button style={styles.btnCancelar} onClick={onClose} disabled={guardando}>
              Cancelar
            </button>
            <button
              style={{
                ...styles.btnGuardar,
                ...(guardando || ejercicios.length === 0 ? styles.btnDisabled : {})
              }}
              onClick={handleGuardar}
              disabled={guardando || ejercicios.length === 0}
            >
              {guardando ? 'Guardando...' : 'Guardar Entrenamiento'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ============ ESTILOS ============

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
    zIndex: 1000,
    padding: '20px'
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '700px',
    maxHeight: '92vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
  },
  header: {
    padding: '20px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  titulo: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 700,
    color: '#1a1a2e'
  },
  subtitulo: {
    margin: '4px 0 0',
    color: '#6b7280',
    fontSize: '14px'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '28px',
    cursor: 'pointer',
    color: '#6b7280',
    padding: '0 4px',
    lineHeight: 1,
    flexShrink: 0
  },
  errorMsg: {
    margin: '12px 20px 0',
    padding: '10px 14px',
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    borderRadius: '8px',
    fontSize: '13px'
  },
  exitoMsg: {
    margin: '12px 20px 0',
    padding: '10px 14px',
    backgroundColor: '#d1fae5',
    color: '#065f46',
    borderRadius: '8px',
    fontSize: '13px'
  },
  body: {
    padding: '20px',
    overflowY: 'auto',
    flex: 1
  },

  // Estado: cargando
  cargando: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    color: '#6b7280',
    fontSize: '14px'
  },
  spinner: {
    width: '36px',
    height: '36px',
    border: '3px solid #e5e7eb',
    borderTopColor: '#75b760',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    marginBottom: '16px'
  },

  // ===== Selector de dia =====
  seccionLabel: {
    margin: '0 0 6px',
    fontSize: '14px',
    color: '#4b5563'
  },
  instrucciones: {
    margin: '0 0 14px',
    fontSize: '13px',
    color: '#6b7280'
  },
  diasGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: '10px'
  },
  diaBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    padding: '14px 12px',
    backgroundColor: '#f0fdf0',
    border: '2px solid #75b760',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontSize: '14px',
    color: '#1a1a2e'
  },
  diaNombre: {
    fontWeight: 600,
    fontSize: '14px'
  },
  diaEjercicios: {
    fontSize: '12px',
    color: '#6b7280'
  },
  btnTexto: {
    background: 'none',
    border: 'none',
    color: '#007bff',
    fontSize: '13px',
    cursor: 'pointer',
    textDecoration: 'underline',
    padding: '4px'
  },

  // ===== Formulario =====
  volverRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px'
  },
  btnVolver: {
    background: 'none',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '13px',
    color: '#374151',
    cursor: 'pointer'
  },
  diaActual: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#1a1a2e'
  },
  sinEjercicios: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: '14px',
    padding: '30px 0'
  },

  // ===== Card de ejercicio =====
  ejercicioCard: {
    backgroundColor: '#f9fafb',
    borderRadius: '10px',
    padding: '14px',
    marginBottom: '14px',
    border: '1px solid #e5e7eb'
  },
  ejercicioHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  ejercicioTitulo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap'
  },
  ejercicioNombre: {
    fontSize: '14px',
    color: '#1a1a2e'
  },
  grupoBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 600,
    color: '#fff'
  },
  btnEliminarEj: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    color: '#dc3545',
    cursor: 'pointer',
    padding: '0 4px',
    lineHeight: 1
  },

  // ===== Tabla de series =====
  tablaContainer: {
    overflowX: 'auto'
  },
  tabla: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px'
  },
  th: {
    textAlign: 'left',
    padding: '6px 8px',
    borderBottom: '2px solid #e5e7eb',
    color: '#6b7280',
    fontSize: '12px',
    fontWeight: 600,
    whiteSpace: 'nowrap'
  },
  td: {
    padding: '4px 8px',
    borderBottom: '1px solid #f3f4f6',
    verticalAlign: 'middle'
  },
  serieNum: {
    fontWeight: 600,
    color: '#6b7280',
    fontSize: '12px'
  },
  inputSerie: {
    width: '64px',
    padding: '6px 8px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '13px',
    textAlign: 'center',
    outline: 'none',
    backgroundColor: '#fff'
  },
  checkbox: {
    width: '16px',
    height: '16px',
    cursor: 'pointer',
    accentColor: '#75b760'
  },
  serieNoCompletada: {
    opacity: 0.5
  },
  seriesBotones: {
    display: 'flex',
    gap: '8px',
    marginTop: '8px'
  },
  btnAgregarSerie: {
    padding: '4px 12px',
    backgroundColor: 'transparent',
    color: '#007bff',
    border: '1px dashed #007bff',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer'
  },
  btnQuitarSerie: {
    padding: '4px 12px',
    backgroundColor: 'transparent',
    color: '#dc3545',
    border: '1px dashed #dc3545',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer'
  },
  inputNotasEj: {
    width: '100%',
    padding: '6px 10px',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
    fontSize: '12px',
    marginTop: '8px',
    outline: 'none',
    backgroundColor: '#fff',
    boxSizing: 'border-box'
  },

  // ===== Agregar ejercicio =====
  agregarEjContainer: {
    textAlign: 'center',
    padding: '10px 0'
  },
  btnAgregarEjercicio: {
    padding: '10px 20px',
    backgroundColor: '#75b760',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer'
  },

  // ===== Biblioteca overlay =====
  bibliotecaOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1100
  },
  bibliotecaBox: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '480px',
    maxHeight: '70vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
  },
  bibliotecaHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #e5e7eb'
  },
  bibliotecaTitulo: {
    margin: 0,
    fontSize: '16px',
    color: '#1a1a2e'
  },
  inputBusqueda: {
    margin: '12px 20px',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    outline: 'none'
  },
  bibliotecaLista: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 20px 16px'
  },
  sinResultados: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: '14px',
    padding: '20px 0'
  },
  bibliotecaItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
    borderBottom: '1px solid #f3f4f6'
  },
  bibliotecaNombre: {
    fontSize: '14px',
    color: '#1f2937'
  },
  grupoBadgeSmall: {
    display: 'inline-block',
    padding: '2px 6px',
    borderRadius: '10px',
    fontSize: '10px',
    fontWeight: 600,
    color: '#fff',
    whiteSpace: 'nowrap'
  },

  // ===== Campos generales =====
  camposGenerales: {
    marginTop: '8px'
  },
  separador: {
    height: '1px',
    backgroundColor: '#e5e7eb',
    margin: '16px 0'
  },
  camposRow: {
    display: 'flex',
    gap: '14px',
    marginBottom: '14px',
    flexWrap: 'wrap'
  },
  campoGroup: {
    flex: '1 1 140px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  campoGroupFull: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  label: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#4b5563'
  },
  inputCampo: {
    padding: '8px 10px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#fff'
  },
  textarea: {
    padding: '8px 10px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
    backgroundColor: '#fff'
  },

  // ===== Footer =====
  footer: {
    padding: '16px 20px',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px'
  },
  btnCancelar: {
    padding: '10px 20px',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer'
  },
  btnGuardar: {
    padding: '10px 24px',
    backgroundColor: '#75b760',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  btnDisabled: {
    backgroundColor: '#9ca3af',
    cursor: 'not-allowed'
  }
};

// Inyectar keyframe de animacion para el spinner
if (typeof document !== 'undefined') {
  const styleEl = document.getElementById('registrar-entrenamiento-keyframes');
  if (!styleEl) {
    const style = document.createElement('style');
    style.id = 'registrar-entrenamiento-keyframes';
    style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
    document.head.appendChild(style);
  }
}

export default RegistrarEntrenamiento;
