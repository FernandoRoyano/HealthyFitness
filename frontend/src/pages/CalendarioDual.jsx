import { useState, useEffect } from 'react';
import { plantillasAPI, reservasAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CalendarioDual = () => {
  const { user } = useAuth();
  const [plantillaBase, setPlantillaBase] = useState(null);
  const [reservasReales, setReservasReales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [vistaActiva, setVistaActiva] = useState('comparativa'); // 'base', 'real', 'comparativa'

  // Fecha actual
  const [mesActual, setMesActual] = useState(new Date().getMonth() + 1);
  const [añoActual, setAñoActual] = useState(new Date().getFullYear());
  const [semanaActual, setSemanaActual] = useState(obtenerLunesDeSemana(new Date()));

  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  const horas = [];
  for (let h = 8; h <= 20; h++) {
    horas.push(`${h.toString().padStart(2, '0')}:00`);
  }

  function obtenerLunesDeSemana(fecha) {
    const d = new Date(fecha);
    const dia = d.getDay();
    const diff = d.getDate() - dia + (dia === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  useEffect(() => {
    cargarDatos();
  }, [mesActual, añoActual, semanaActual]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError('');

      // Cargar plantilla base del mes
      try {
        const plantillaRes = await plantillasAPI.obtenerPlantillaBase(mesActual, añoActual);
        setPlantillaBase(plantillaRes.data);
      } catch (err) {
        if (err.response?.status !== 404) {
          console.error('Error cargando plantilla:', err);
        }
        setPlantillaBase(null);
      }

      // Cargar reservas reales de la semana
      const inicioSemana = new Date(semanaActual);
      const finSemana = new Date(semanaActual);
      finSemana.setDate(finSemana.getDate() + 4); // Viernes

      const reservasRes = await reservasAPI.obtenerTodas({
        fechaInicio: inicioSemana.toISOString(),
        fechaFin: finSemana.toISOString(),
        entrenador: user.rol === 'entrenador' ? user._id : undefined
      });

      setReservasReales(reservasRes.data);
    } catch (err) {
      setError('Error al cargar datos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const cambiarSemana = (direccion) => {
    const nuevaSemana = new Date(semanaActual);
    nuevaSemana.setDate(nuevaSemana.getDate() + (direccion * 7));
    setSemanaActual(nuevaSemana);
    setMesActual(nuevaSemana.getMonth() + 1);
    setAñoActual(nuevaSemana.getFullYear());
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  const obtenerFechaDia = (indiceDia) => {
    const fecha = new Date(semanaActual);
    fecha.setDate(fecha.getDate() + indiceDia);
    return fecha;
  };

  // Obtener sesiones de plantilla base para un día y hora específicos
  const getSesionPlantilla = (diaSemana, hora) => {
    if (!plantillaBase) return null;

    return plantillaBase.sesiones.find(s =>
      s.diaSemana === diaSemana &&
      s.horaInicio === hora &&
      (user.rol === 'gerente' || s.entrenador?._id === user._id || s.entrenador === user._id)
    );
  };

  // Obtener reserva real para un día y hora específicos
  const getReservaReal = (fecha, hora) => {
    const fechaStr = fecha.toISOString().split('T')[0];

    return reservasReales.find(r => {
      const reservaFecha = new Date(r.fecha).toISOString().split('T')[0];
      return reservaFecha === fechaStr &&
             r.horaInicio === hora &&
             (user.rol === 'gerente' || r.entrenador?._id === user._id || r.entrenador === user._id);
    });
  };

  // Determinar el estado de comparación
  const getEstadoComparacion = (diaSemana, fecha, hora) => {
    const sesionPlantilla = getSesionPlantilla(diaSemana, hora);
    const reservaReal = getReservaReal(fecha, hora);

    if (sesionPlantilla && reservaReal) {
      // Ambas existen - verificar si coinciden
      if (reservaReal.estado === 'cancelada') {
        return 'cancelada'; // Estaba en plantilla pero se canceló
      }
      return 'coincide'; // Coincide con la plantilla
    } else if (sesionPlantilla && !reservaReal) {
      return 'falta'; // Está en plantilla pero no hay reserva
    } else if (!sesionPlantilla && reservaReal) {
      if (reservaReal.estado === 'cancelada') {
        return null;
      }
      return 'extra'; // No está en plantilla pero hay reserva
    }
    return null;
  };

  const getColorEstado = (estado) => {
    switch (estado) {
      case 'coincide': return { bg: '#d4edda', border: '#28a745', text: '#155724' };
      case 'falta': return { bg: '#fff3cd', border: '#ffc107', text: '#856404' };
      case 'extra': return { bg: '#cce5ff', border: '#007bff', text: '#004085' };
      case 'cancelada': return { bg: '#f8d7da', border: '#dc3545', text: '#721c24' };
      default: return { bg: '#fff', border: '#ddd', text: '#333' };
    }
  };

  const getEstadoReservaBadge = (estado) => {
    const colores = {
      pendiente: { bg: '#fff3cd', text: '#856404' },
      confirmada: { bg: '#d4edda', text: '#155724' },
      completada: { bg: '#e9ecef', text: '#495057' },
      cancelada: { bg: '#f8d7da', text: '#721c24' }
    };
    return colores[estado] || colores.pendiente;
  };

  if (loading) {
    return <div style={styles.loading}>Cargando calendario...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Calendario Dual</h1>
        <p style={styles.subtitle}>Plantilla Base vs Horario Real</p>
      </div>

      {error && (
        <div style={styles.error}>
          {error}
          <button onClick={() => setError('')} style={styles.closeAlert}>×</button>
        </div>
      )}

      {/* Controles de navegación */}
      <div style={styles.controles}>
        <div style={styles.navegacionSemana}>
          <button onClick={() => cambiarSemana(-1)} style={styles.navButton}>
            ← Semana Anterior
          </button>
          <span style={styles.semanaActual}>
            Semana del {formatearFecha(semanaActual)} al {formatearFecha(obtenerFechaDia(4))}
          </span>
          <button onClick={() => cambiarSemana(1)} style={styles.navButton}>
            Semana Siguiente →
          </button>
        </div>

        <div style={styles.vistaSelector}>
          <button
            onClick={() => setVistaActiva('base')}
            style={{
              ...styles.vistaButton,
              ...(vistaActiva === 'base' ? styles.vistaButtonActiva : {})
            }}
          >
            Plantilla Base
          </button>
          <button
            onClick={() => setVistaActiva('real')}
            style={{
              ...styles.vistaButton,
              ...(vistaActiva === 'real' ? styles.vistaButtonActiva : {})
            }}
          >
            Horario Real
          </button>
          <button
            onClick={() => setVistaActiva('comparativa')}
            style={{
              ...styles.vistaButton,
              ...(vistaActiva === 'comparativa' ? styles.vistaButtonActiva : {})
            }}
          >
            Comparativa
          </button>
        </div>
      </div>

      {/* Leyenda */}
      {vistaActiva === 'comparativa' && (
        <div style={styles.leyenda}>
          <div style={styles.leyendaItem}>
            <span style={{ ...styles.leyendaColor, backgroundColor: '#d4edda' }}></span>
            Coincide con plantilla
          </div>
          <div style={styles.leyendaItem}>
            <span style={{ ...styles.leyendaColor, backgroundColor: '#fff3cd' }}></span>
            Falta (en plantilla, sin reserva)
          </div>
          <div style={styles.leyendaItem}>
            <span style={{ ...styles.leyendaColor, backgroundColor: '#cce5ff' }}></span>
            Extra (fuera de plantilla)
          </div>
          <div style={styles.leyendaItem}>
            <span style={{ ...styles.leyendaColor, backgroundColor: '#f8d7da' }}></span>
            Cancelada
          </div>
        </div>
      )}

      {/* Calendario */}
      <div style={styles.calendarioContainer}>
        <div style={styles.calendario}>
          {/* Cabecera de días */}
          <div style={styles.headerRow}>
            <div style={styles.horaHeader}>Hora</div>
            {diasSemana.map((dia, index) => (
              <div key={index} style={styles.diaHeader}>
                <div>{dia}</div>
                <div style={styles.fechaDia}>{formatearFecha(obtenerFechaDia(index))}</div>
              </div>
            ))}
          </div>

          {/* Filas de horas */}
          {horas.map((hora) => (
            <div key={hora} style={styles.horaRow}>
              <div style={styles.horaCell}>{hora}</div>
              {diasSemana.map((_, diaIndex) => {
                const diaSemana = diaIndex + 1;
                const fecha = obtenerFechaDia(diaIndex);
                const sesionPlantilla = getSesionPlantilla(diaSemana, hora);
                const reservaReal = getReservaReal(fecha, hora);
                const estadoComparacion = getEstadoComparacion(diaSemana, fecha, hora);
                const colores = getColorEstado(estadoComparacion);

                // Vista Base
                if (vistaActiva === 'base') {
                  return (
                    <div key={diaIndex} style={styles.celda}>
                      {sesionPlantilla && (
                        <div style={styles.sesionBase}>
                          <div style={styles.sesionEntrenador}>
                            {sesionPlantilla.entrenador?.nombre || 'Sin asignar'}
                          </div>
                          <div style={styles.sesionCliente}>
                            {sesionPlantilla.cliente
                              ? `${sesionPlantilla.cliente.nombre} ${sesionPlantilla.cliente.apellido}`
                              : 'Slot vacío'}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                // Vista Real
                if (vistaActiva === 'real') {
                  return (
                    <div key={diaIndex} style={styles.celda}>
                      {reservaReal && (
                        <div style={{
                          ...styles.reservaReal,
                          backgroundColor: getEstadoReservaBadge(reservaReal.estado).bg
                        }}>
                          <div style={styles.sesionEntrenador}>
                            {reservaReal.entrenador?.nombre || 'Sin asignar'}
                          </div>
                          <div style={styles.sesionCliente}>
                            {reservaReal.cliente?.nombre} {reservaReal.cliente?.apellido}
                          </div>
                          <span style={{
                            ...styles.estadoBadge,
                            color: getEstadoReservaBadge(reservaReal.estado).text
                          }}>
                            {reservaReal.estado}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                }

                // Vista Comparativa
                return (
                  <div
                    key={diaIndex}
                    style={{
                      ...styles.celda,
                      backgroundColor: estadoComparacion ? colores.bg : '#fff',
                      borderColor: estadoComparacion ? colores.border : '#eee'
                    }}
                  >
                    {estadoComparacion === 'coincide' && reservaReal && (
                      <div style={styles.sesionComparativa}>
                        <div style={styles.sesionEntrenador}>
                          {reservaReal.entrenador?.nombre}
                        </div>
                        <div style={styles.sesionCliente}>
                          {reservaReal.cliente?.nombre} {reservaReal.cliente?.apellido}
                        </div>
                        <span style={{ ...styles.estadoTag, color: colores.text }}>
                          {reservaReal.estado}
                        </span>
                      </div>
                    )}

                    {estadoComparacion === 'falta' && sesionPlantilla && (
                      <div style={styles.sesionComparativa}>
                        <div style={styles.sesionEntrenador}>
                          {sesionPlantilla.entrenador?.nombre}
                        </div>
                        <div style={styles.sesionCliente}>
                          {sesionPlantilla.cliente
                            ? `${sesionPlantilla.cliente.nombre} ${sesionPlantilla.cliente.apellido}`
                            : 'Slot vacío'}
                        </div>
                        <span style={{ ...styles.estadoTag, color: colores.text }}>
                          Sin reservar
                        </span>
                      </div>
                    )}

                    {estadoComparacion === 'extra' && reservaReal && (
                      <div style={styles.sesionComparativa}>
                        <div style={styles.sesionEntrenador}>
                          {reservaReal.entrenador?.nombre}
                        </div>
                        <div style={styles.sesionCliente}>
                          {reservaReal.cliente?.nombre} {reservaReal.cliente?.apellido}
                        </div>
                        <span style={{ ...styles.estadoTag, color: colores.text }}>
                          Fuera plantilla
                        </span>
                      </div>
                    )}

                    {estadoComparacion === 'cancelada' && (
                      <div style={styles.sesionComparativa}>
                        <div style={styles.sesionEntrenador}>
                          {sesionPlantilla?.entrenador?.nombre || reservaReal?.entrenador?.nombre}
                        </div>
                        <span style={{ ...styles.estadoTag, color: colores.text }}>
                          Cancelada
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Mensaje si no hay plantilla base */}
      {!plantillaBase && (
        <div style={styles.noPlantilla}>
          No hay plantilla base definida para {new Date(añoActual, mesActual - 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}.
          {user.rol === 'gerente' && ' Crea una desde la sección de Plantillas Semanales.'}
        </div>
      )}

      {/* Resumen estadísticas */}
      <div style={styles.resumen}>
        <h3>Resumen de la Semana</h3>
        <div style={styles.estadisticas}>
          <div style={styles.estadistica}>
            <span style={styles.estadisticaNumero}>
              {reservasReales.filter(r => r.estado === 'confirmada' || r.estado === 'completada').length}
            </span>
            <span style={styles.estadisticaLabel}>Sesiones Confirmadas</span>
          </div>
          <div style={styles.estadistica}>
            <span style={styles.estadisticaNumero}>
              {reservasReales.filter(r => r.estado === 'pendiente').length}
            </span>
            <span style={styles.estadisticaLabel}>Pendientes</span>
          </div>
          <div style={styles.estadistica}>
            <span style={styles.estadisticaNumero}>
              {reservasReales.filter(r => r.estado === 'cancelada').length}
            </span>
            <span style={styles.estadisticaLabel}>Canceladas</span>
          </div>
          {plantillaBase && (
            <div style={styles.estadistica}>
              <span style={styles.estadisticaNumero}>
                {plantillaBase.sesiones.filter(s =>
                  user.rol === 'gerente' || s.entrenador?._id === user._id || s.entrenador === user._id
                ).length}
              </span>
              <span style={styles.estadisticaLabel}>En Plantilla Base</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1400px',
    margin: '0 auto'
  },
  header: {
    marginBottom: '20px'
  },
  title: {
    margin: 0,
    color: '#1a365d'
  },
  subtitle: {
    color: '#666',
    marginTop: '5px'
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '16px'
  },
  error: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
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
    fontSize: '20px',
    cursor: 'pointer'
  },
  controles: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    marginBottom: '20px'
  },
  navegacionSemana: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '20px',
    flexWrap: 'wrap'
  },
  navButton: {
    backgroundColor: '#f8f9fa',
    border: '1px solid #ddd',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  semanaActual: {
    fontWeight: '600',
    fontSize: '16px'
  },
  vistaSelector: {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
    flexWrap: 'wrap'
  },
  vistaButton: {
    backgroundColor: '#fff',
    border: '2px solid #ddd',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s'
  },
  vistaButtonActiva: {
    backgroundColor: '#c41e3a',
    borderColor: '#c41e3a',
    color: '#fff'
  },
  leyenda: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    marginBottom: '20px',
    flexWrap: 'wrap',
    padding: '10px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px'
  },
  leyendaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px'
  },
  leyendaColor: {
    width: '20px',
    height: '20px',
    borderRadius: '4px',
    border: '1px solid #ddd'
  },
  calendarioContainer: {
    overflowX: 'auto',
    marginBottom: '20px'
  },
  calendario: {
    minWidth: '800px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    overflow: 'hidden'
  },
  headerRow: {
    display: 'grid',
    gridTemplateColumns: '80px repeat(5, 1fr)',
    backgroundColor: '#1a365d',
    color: '#fff'
  },
  horaHeader: {
    padding: '15px 10px',
    fontWeight: '600',
    textAlign: 'center',
    borderRight: '1px solid rgba(255,255,255,0.2)'
  },
  diaHeader: {
    padding: '10px',
    textAlign: 'center',
    borderRight: '1px solid rgba(255,255,255,0.2)'
  },
  fechaDia: {
    fontSize: '12px',
    opacity: 0.8,
    marginTop: '3px'
  },
  horaRow: {
    display: 'grid',
    gridTemplateColumns: '80px repeat(5, 1fr)',
    borderBottom: '1px solid #eee'
  },
  horaCell: {
    padding: '10px',
    textAlign: 'center',
    fontWeight: '500',
    backgroundColor: '#f8f9fa',
    borderRight: '1px solid #eee',
    fontSize: '13px'
  },
  celda: {
    padding: '5px',
    minHeight: '60px',
    borderRight: '1px solid #eee',
    transition: 'background-color 0.2s',
    border: '2px solid transparent'
  },
  sesionBase: {
    backgroundColor: '#e9ecef',
    padding: '8px',
    borderRadius: '6px',
    height: '100%'
  },
  reservaReal: {
    padding: '8px',
    borderRadius: '6px',
    height: '100%'
  },
  sesionComparativa: {
    padding: '5px',
    height: '100%'
  },
  sesionEntrenador: {
    fontWeight: '600',
    fontSize: '12px',
    color: '#333',
    marginBottom: '3px'
  },
  sesionCliente: {
    fontSize: '11px',
    color: '#666'
  },
  estadoBadge: {
    display: 'inline-block',
    fontSize: '10px',
    marginTop: '3px',
    fontWeight: '500'
  },
  estadoTag: {
    display: 'block',
    fontSize: '10px',
    marginTop: '3px',
    fontWeight: '600'
  },
  noPlantilla: {
    textAlign: 'center',
    padding: '20px',
    backgroundColor: '#fff3cd',
    borderRadius: '8px',
    marginBottom: '20px',
    color: '#856404'
  },
  resumen: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  estadisticas: {
    display: 'flex',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: '20px',
    marginTop: '15px'
  },
  estadistica: {
    textAlign: 'center'
  },
  estadisticaNumero: {
    display: 'block',
    fontSize: '32px',
    fontWeight: '700',
    color: '#c41e3a'
  },
  estadisticaLabel: {
    fontSize: '13px',
    color: '#666'
  }
};

export default CalendarioDual;
