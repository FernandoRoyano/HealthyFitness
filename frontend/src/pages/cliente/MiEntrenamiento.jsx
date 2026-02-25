import { useState, useEffect } from 'react';
import { useClienteAuth } from '../../context/ClienteAuthContext';
import { clientePortalAPI } from '../../services/api';
import { ClipboardList, Dumbbell } from 'lucide-react';

function MiEntrenamiento() {
  const { cliente } = useClienteAuth();
  const [rutina, setRutina] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [records, setRecords] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [diaExpandido, setDiaExpandido] = useState(null);

  useEffect(() => {
    if (cliente?._id) {
      cargarDatos();
    }
  }, [cliente]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError('');
      const [rutinaRes, historialRes, recordsRes] = await Promise.all([
        clientePortalAPI.obtenerMiRutina(),
        clientePortalAPI.obtenerMiHistorial(),
        clientePortalAPI.obtenerMisRecords()
      ]);

      setRutina(rutinaRes.data);
      setHistorial(historialRes.data || []);
      setRecords(recordsRes.data || []);
    } catch (err) {
      console.error('Error al cargar datos de entrenamiento:', err);
      setError('No se pudieron cargar los datos de entrenamiento.');
    } finally {
      setCargando(false);
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const coloresGrupo = {
    pecho: '#e74c3c',
    espalda: '#3498db',
    hombros: '#FF6F00',
    biceps: '#9b59b6',
    triceps: '#e67e22',
    piernas: '#2ecc71',
    gluteos: '#e91e63',
    core: '#00bcd4',
    cardio: '#ff5722',
    cuerpo_completo: '#607d8b'
  };

  if (cargando) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Cargando datos...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Mi Entrenamiento</h1>
          <p style={styles.subtitle}>Tu rutina, historial y records personales</p>
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {/* Rutina activa */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Mi Rutina</h2>

        {rutina ? (
          <div style={styles.rutinaCard}>
            <div style={styles.rutinaHeader}>
              <div>
                <h3 style={styles.rutinaNombre}>{rutina.nombre}</h3>
                {rutina.objetivo && (
                  <span style={styles.rutinaObjetivo}>
                    {rutina.objetivo.replace(/_/g, ' ')}
                  </span>
                )}
              </div>
              <span style={styles.rutinaBadge}>
                {rutina.diasPorSemana} dias/semana
              </span>
            </div>

            {rutina.descripcion && (
              <p style={styles.rutinaDescripcion}>{rutina.descripcion}</p>
            )}

            {/* Dias de la rutina */}
            <div style={styles.diasList}>
              {rutina.dias?.map((dia, idx) => (
                <div key={idx} style={styles.diaCard}>
                  <button
                    style={{
                      ...styles.diaHeader,
                      backgroundColor: diaExpandido === idx ? '#f0f9ee' : '#f9fafb'
                    }}
                    onClick={() => setDiaExpandido(diaExpandido === idx ? null : idx)}
                  >
                    <span style={styles.diaNombre}>{dia.nombre}</span>
                    <span style={styles.diaInfo}>
                      {dia.ejercicios?.length || 0} ejercicios
                      <span style={styles.chevron}>{diaExpandido === idx ? ' \u25BC' : ' \u25B6'}</span>
                    </span>
                  </button>

                  {diaExpandido === idx && dia.ejercicios && (
                    <div style={styles.ejerciciosList}>
                      {dia.ejercicios.map((ej, ejIdx) => (
                        <div key={ejIdx} style={styles.ejercicioItem}>
                          <div style={styles.ejercicioMain}>
                            <span style={styles.ejercicioOrden}>{ejIdx + 1}</span>
                            <div style={styles.ejercicioInfo}>
                              <span style={styles.ejercicioNombre}>
                                {ej.ejercicio?.nombre || 'Ejercicio'}
                              </span>
                              <span style={{
                                ...styles.ejercicioGrupo,
                                backgroundColor: coloresGrupo[ej.ejercicio?.grupoMuscular] || '#607d8b'
                              }}>
                                {ej.ejercicio?.grupoMuscular?.replace(/_/g, ' ') || ''}
                              </span>
                            </div>
                          </div>
                          <div style={styles.ejercicioDetalles}>
                            <span style={styles.ejercicioDetalle}>
                              {ej.series} x {ej.repeticiones}
                            </span>
                            {ej.peso && (
                              <span style={styles.ejercicioDetalle}>{ej.peso} kg</span>
                            )}
                            {ej.descansoSegundos && (
                              <span style={styles.ejercicioDetalle}>
                                {ej.descansoSegundos}s descanso
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}><ClipboardList size={48} /></span>
            <h3 style={styles.emptyTitle}>Sin rutina asignada</h3>
            <p style={styles.emptyText}>
              Tu entrenador te asignara una rutina de entrenamiento personalizada.
            </p>
          </div>
        )}
      </div>

      {/* Records personales */}
      {records.length > 0 && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Mis Records Personales</h2>
          <div style={styles.recordsGrid}>
            {records.map((pr, idx) => (
              <div key={idx} style={styles.recordCard}>
                <div style={styles.recordNombre}>
                  {pr.ejercicio?.nombre || 'Ejercicio'}
                </div>
                <div style={styles.recordPeso}>{pr.pesoMaximo} kg</div>
                <div style={styles.recordDetalles}>
                  {pr.repeticiones && (
                    <span>{pr.repeticiones} reps</span>
                  )}
                  {pr.fecha && (
                    <span style={styles.recordFecha}>
                      {formatearFecha(pr.fecha)}
                    </span>
                  )}
                </div>
                {pr.ejercicio?.grupoMuscular && (
                  <span style={{
                    ...styles.recordGrupo,
                    backgroundColor: coloresGrupo[pr.ejercicio.grupoMuscular] || '#607d8b'
                  }}>
                    {pr.ejercicio.grupoMuscular.replace(/_/g, ' ')}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historial de entrenamientos */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Historial de Entrenamientos</h2>

        {historial.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}><Dumbbell size={48} /></span>
            <h3 style={styles.emptyTitle}>Sin entrenamientos registrados</h3>
            <p style={styles.emptyText}>
              Tu entrenador registrara tus sesiones de entrenamiento aqui.
            </p>
          </div>
        ) : (
          <div style={styles.historialList}>
            {historial.map((registro) => (
              <div key={registro._id} style={styles.historialCard}>
                <div style={styles.historialHeader}>
                  <div style={styles.historialFecha}>
                    {formatearFecha(registro.fecha)}
                  </div>
                  <span style={{
                    ...styles.historialEstado,
                    backgroundColor: registro.completado ? '#10b981' : '#ff9800'
                  }}>
                    {registro.completado ? 'Completado' : 'Parcial'}
                  </span>
                </div>

                {registro.diaRutina && (
                  <div style={styles.historialDia}>{registro.diaRutina}</div>
                )}

                <div style={styles.historialResumen}>
                  <div style={styles.resumenItem}>
                    <span style={styles.resumenLabel}>Ejercicios</span>
                    <span style={styles.resumenValor}>{registro.ejercicios?.length || 0}</span>
                  </div>
                  {registro.duracionMinutos && (
                    <div style={styles.resumenItem}>
                      <span style={styles.resumenLabel}>Duracion</span>
                      <span style={styles.resumenValor}>{registro.duracionMinutos} min</span>
                    </div>
                  )}
                  <div style={styles.resumenItem}>
                    <span style={styles.resumenLabel}>Series totales</span>
                    <span style={styles.resumenValor}>
                      {registro.ejercicios?.reduce((sum, ej) => sum + (ej.series?.length || 0), 0) || 0}
                    </span>
                  </div>
                </div>

                {/* Ejercicios del registro */}
                <div style={styles.registroEjercicios}>
                  {registro.ejercicios?.map((ej, idx) => (
                    <div key={idx} style={styles.registroEjercicio}>
                      <span style={styles.registroEjNombre}>
                        {ej.ejercicio?.nombre || 'Ejercicio'}
                      </span>
                      <span style={styles.registroEjSeries}>
                        {ej.series?.map(s =>
                          `${s.peso || 0}kg x ${s.repeticiones || 0}`
                        ).join(' | ')}
                      </span>
                    </div>
                  ))}
                </div>

                {registro.notas && (
                  <div style={styles.historialNotas}>{registro.notas}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1000px',
    margin: '0 auto'
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '300px',
    fontSize: '18px',
    color: '#666'
  },
  header: {
    marginBottom: '24px'
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: '8px',
    fontFamily: 'Inter, sans-serif'
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    fontFamily: 'Inter, sans-serif'
  },
  error: {
    padding: '14px',
    backgroundColor: '#fee',
    color: '#c00',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px'
  },

  // Secciones
  section: {
    marginBottom: '32px'
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: '16px',
    fontFamily: 'Inter, sans-serif'
  },

  // Rutina
  rutinaCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
    border: '1px solid #e4e4e9',
    overflow: 'hidden'
  },
  rutinaHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '20px',
    borderBottom: '1px solid #f0f0f0'
  },
  rutinaNombre: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1a1a2e',
    margin: '0 0 6px'
  },
  rutinaObjetivo: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
    backgroundColor: '#e8f5e3',
    color: '#2d5a1e',
    textTransform: 'capitalize'
  },
  rutinaBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    backgroundColor: '#10b981',
    color: '#fff',
    whiteSpace: 'nowrap'
  },
  rutinaDescripcion: {
    padding: '12px 20px 0',
    fontSize: '14px',
    color: '#666',
    margin: 0
  },
  diasList: {
    padding: '12px 20px 20px'
  },
  diaCard: {
    borderRadius: '8px',
    overflow: 'hidden',
    border: '1px solid #e4e4e9',
    marginBottom: '8px'
  },
  diaHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: '12px 16px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    color: '#1a1a2e',
    transition: 'background-color 0.2s'
  },
  diaNombre: {
    fontWeight: '600'
  },
  diaInfo: {
    fontSize: '13px',
    color: '#6b7280',
    fontWeight: '400'
  },
  chevron: {
    fontSize: '10px',
    marginLeft: '4px'
  },
  ejerciciosList: {
    padding: '0 16px 12px',
    backgroundColor: '#fff'
  },
  ejercicioItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid #f3f4f6',
    flexWrap: 'wrap',
    gap: '8px'
  },
  ejercicioMain: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  ejercicioOrden: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: '#e8f5e3',
    color: '#2d5a1e',
    fontSize: '12px',
    fontWeight: '600',
    flexShrink: 0
  },
  ejercicioInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap'
  },
  ejercicioNombre: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#1a1a2e'
  },
  ejercicioGrupo: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '10px',
    color: '#fff',
    fontWeight: '600',
    textTransform: 'capitalize'
  },
  ejercicioDetalles: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center'
  },
  ejercicioDetalle: {
    fontSize: '13px',
    color: '#6b7280',
    fontWeight: '500'
  },

  // Records
  recordsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '12px'
  },
  recordCard: {
    backgroundColor: 'white',
    padding: '16px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    border: '1px solid #e4e4e9',
    borderLeft: '4px solid #FF6F00'
  },
  recordNombre: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: '6px'
  },
  recordPeso: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#FF6F00',
    marginBottom: '4px'
  },
  recordDetalles: {
    display: 'flex',
    gap: '8px',
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '8px'
  },
  recordFecha: {
    color: '#9ca3af'
  },
  recordGrupo: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '10px',
    color: '#fff',
    fontWeight: '600',
    textTransform: 'capitalize'
  },

  // Historial
  historialList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  historialCard: {
    backgroundColor: 'white',
    padding: '16px 20px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    border: '1px solid #e4e4e9'
  },
  historialHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  historialFecha: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#10b981'
  },
  historialEstado: {
    padding: '3px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#fff'
  },
  historialDia: {
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '10px',
    fontWeight: '500'
  },
  historialResumen: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    marginBottom: '12px',
    padding: '10px 14px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px'
  },
  resumenItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  resumenLabel: {
    fontSize: '11px',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: '0.3px'
  },
  resumenValor: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1a1a2e'
  },
  registroEjercicios: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  registroEjercicio: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 0',
    borderBottom: '1px solid #f3f4f6',
    flexWrap: 'wrap',
    gap: '4px'
  },
  registroEjNombre: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#374151'
  },
  registroEjSeries: {
    fontSize: '12px',
    color: '#6b7280'
  },
  historialNotas: {
    marginTop: '12px',
    padding: '10px 14px',
    backgroundColor: '#f8fdf6',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#666',
    borderLeft: '3px solid #10b981'
  },

  // Empty states
  emptyState: {
    textAlign: 'center',
    padding: '48px 24px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)'
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
    display: 'block'
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: '8px'
  },
  emptyText: {
    fontSize: '14px',
    color: '#666'
  }
};

export default MiEntrenamiento;
