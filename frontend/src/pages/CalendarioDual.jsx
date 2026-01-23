import { useState, useEffect } from 'react';
import { plantillasAPI, reservasAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './CalendarioDual.css';

// Formatear fecha local sin problemas de zona horaria
const formatearFechaLocal = (fecha) => {
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, '0');
  const day = String(fecha.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const CalendarioDual = () => {
  const { usuario } = useAuth();
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
    if (h < 20) {
      horas.push(`${h.toString().padStart(2, '0')}:30`);
    }
  }
  horas.push('21:00');

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
        entrenador: usuario.rol === 'entrenador' ? usuario._id : undefined
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
      (usuario.rol === 'gerente' || s.entrenador?._id === usuario._id || s.entrenador === usuario._id)
    );
  };

  // Obtener reserva real para un día y hora específicos
  const getReservaReal = (fecha, hora) => {
    const fechaStr = formatearFechaLocal(fecha);

    return reservasReales.find(r => {
      const reservaFecha = formatearFechaLocal(new Date(r.fecha));
      return reservaFecha === fechaStr &&
             r.horaInicio === hora &&
             (usuario.rol === 'gerente' || r.entrenador?._id === usuario._id || r.entrenador === usuario._id);
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

  // Obtener todas las sesiones de un día para la vista móvil
  const getSesionesDia = (diaIndex) => {
    const diaSemana = diaIndex + 1;
    const fecha = obtenerFechaDia(diaIndex);
    const sesiones = [];

    horas.forEach(hora => {
      const sesionPlantilla = getSesionPlantilla(diaSemana, hora);
      const reservaReal = getReservaReal(fecha, hora);
      const estadoComparacion = getEstadoComparacion(diaSemana, fecha, hora);

      if (vistaActiva === 'base' && sesionPlantilla) {
        sesiones.push({
          hora,
          tipo: 'base',
          entrenador: sesionPlantilla.entrenador?.nombre || 'Sin asignar',
          cliente: sesionPlantilla.cliente
            ? `${sesionPlantilla.cliente.nombre} ${sesionPlantilla.cliente.apellido}`
            : 'Slot vacío',
          estado: null
        });
      } else if (vistaActiva === 'real' && reservaReal) {
        sesiones.push({
          hora,
          tipo: 'real',
          entrenador: reservaReal.entrenador?.nombre || 'Sin asignar',
          cliente: `${reservaReal.cliente?.nombre} ${reservaReal.cliente?.apellido}`,
          estado: reservaReal.estado
        });
      } else if (vistaActiva === 'comparativa' && estadoComparacion) {
        const info = estadoComparacion === 'falta' ? sesionPlantilla : reservaReal;
        sesiones.push({
          hora,
          tipo: estadoComparacion,
          entrenador: info?.entrenador?.nombre || sesionPlantilla?.entrenador?.nombre,
          cliente: estadoComparacion === 'falta'
            ? (sesionPlantilla?.cliente ? `${sesionPlantilla.cliente.nombre} ${sesionPlantilla.cliente.apellido}` : 'Slot vacío')
            : (reservaReal?.cliente ? `${reservaReal.cliente.nombre} ${reservaReal.cliente.apellido}` : ''),
          estado: estadoComparacion
        });
      }
    });

    return sesiones;
  };

  if (loading) {
    return <div style={styles.loading}>Cargando calendario...</div>;
  }

  return (
    <div className="calendario-dual-container">
      <div className="calendario-dual-header">
        <h1>Comparar Horarios</h1>
        <p>Revisa qué se cumplió del horario base</p>
      </div>

      {error && (
        <div style={styles.error}>
          {error}
          <button onClick={() => setError('')} style={styles.closeAlert}>×</button>
        </div>
      )}

      {/* Controles de navegación */}
      <div className="calendario-dual-controles">
        <div className="navegacion-semana">
          <div className="nav-buttons">
            <button onClick={() => cambiarSemana(-1)} className="nav-btn">
              ← Anterior
            </button>
            <button onClick={() => cambiarSemana(1)} className="nav-btn">
              Siguiente →
            </button>
          </div>
          <span className="semana-label">
            {formatearFecha(semanaActual)} - {formatearFecha(obtenerFechaDia(4))}
          </span>
        </div>

        <div className="vista-selector">
          <button
            onClick={() => setVistaActiva('base')}
            className={`vista-btn ${vistaActiva === 'base' ? 'activa' : ''}`}
          >
            Base
          </button>
          <button
            onClick={() => setVistaActiva('real')}
            className={`vista-btn ${vistaActiva === 'real' ? 'activa' : ''}`}
          >
            Real
          </button>
          <button
            onClick={() => setVistaActiva('comparativa')}
            className={`vista-btn ${vistaActiva === 'comparativa' ? 'activa' : ''}`}
          >
            Comparar
          </button>
        </div>
      </div>

      {/* Leyenda */}
      {vistaActiva === 'comparativa' && (
        <div className="leyenda">
          <div className="leyenda-item">
            <span className="leyenda-color" style={{ backgroundColor: '#d4edda' }}></span>
            Coincide
          </div>
          <div className="leyenda-item">
            <span className="leyenda-color" style={{ backgroundColor: '#fff3cd' }}></span>
            Falta
          </div>
          <div className="leyenda-item">
            <span className="leyenda-color" style={{ backgroundColor: '#cce5ff' }}></span>
            Extra
          </div>
          <div className="leyenda-item">
            <span className="leyenda-color" style={{ backgroundColor: '#f8d7da' }}></span>
            Cancelada
          </div>
        </div>
      )}

      {/* Vista móvil: Cards por día */}
      <div className="mobile-view">
        <div className="dias-cards">
          {diasSemana.map((dia, diaIndex) => {
            const sesiones = getSesionesDia(diaIndex);
            return (
              <div key={diaIndex} className="dia-card">
                <div className="dia-card-header">
                  {dia} - {formatearFecha(obtenerFechaDia(diaIndex))}
                </div>
                <div className="dia-card-body">
                  {sesiones.length === 0 ? (
                    <div className="sin-sesiones">Sin sesiones</div>
                  ) : (
                    sesiones.map((sesion, idx) => (
                      <div key={idx} className={`sesion-mobile ${sesion.tipo}`}>
                        <div className="sesion-hora">{sesion.hora}</div>
                        <div className="sesion-entrenador">{sesion.entrenador}</div>
                        <div className="sesion-cliente">{sesion.cliente}</div>
                        {sesion.estado && (
                          <div className="sesion-estado">{sesion.estado}</div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Calendario Desktop */}
      <div className="desktop-view" style={styles.calendarioContainer}>
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
          {usuario.rol === 'gerente' && ' Crea una desde la sección de Plantillas Semanales.'}
        </div>
      )}

      {/* Resumen estadísticas */}
      <div className="resumen-semana">
        <h3>Resumen de la Semana</h3>
        <div className="estadisticas-grid">
          <div className="estadistica-item">
            <span className="estadistica-numero">
              {reservasReales.filter(r => r.estado === 'confirmada' || r.estado === 'completada').length}
            </span>
            <span className="estadistica-label">Confirmadas</span>
          </div>
          <div className="estadistica-item">
            <span className="estadistica-numero">
              {reservasReales.filter(r => r.estado === 'pendiente').length}
            </span>
            <span className="estadistica-label">Pendientes</span>
          </div>
          <div className="estadistica-item">
            <span className="estadistica-numero">
              {reservasReales.filter(r => r.estado === 'cancelada').length}
            </span>
            <span className="estadistica-label">Canceladas</span>
          </div>
          {plantillaBase && (
            <div className="estadistica-item">
              <span className="estadistica-numero">
                {plantillaBase.sesiones.filter(s =>
                  usuario.rol === 'gerente' || s.entrenador?._id === usuario._id || s.entrenador === usuario._id
                ).length}
              </span>
              <span className="estadistica-label">En Plantilla</span>
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
