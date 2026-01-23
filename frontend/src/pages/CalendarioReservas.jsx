import { useState, useEffect, useCallback } from 'react';
import { reservasAPI, usersAPI } from '../services/api';

// Formatear fecha local sin problemas de zona horaria
const formatearFechaLocal = (fecha) => {
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, '0');
  const day = String(fecha.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function CalendarioReservas() {
  const [vista, setVista] = useState('diaria'); // 'individual', 'diaria', 'semanal'
  const [entrenadores, setEntrenadores] = useState([]);
  const [entrenadorSeleccionado, setEntrenadorSeleccionado] = useState('');
  const [reservas, setReservas] = useState([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    formatearFechaLocal(new Date())
  );
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Horarios de 7am a 22pm (7:00 - 22:00)
  const horarios = [];
  for (let hora = 7; hora <= 22; hora++) {
    horarios.push(`${hora.toString().padStart(2, '0')}:00`);
  }

  const cargarEntrenadores = useCallback(async () => {
    try {
      const res = await usersAPI.obtenerEntrenadores();
      setEntrenadores(res.data);
      if (res.data.length > 0 && !entrenadorSeleccionado) {
        setEntrenadorSeleccionado(res.data[0]._id);
      }
    } catch {
      setError('Error al cargar entrenadores');
    } finally {
      setCargando(false);
    }
  }, [entrenadorSeleccionado]);

  const cargarReservas = useCallback(async () => {
    try {
      setCargando(true);
      let params = {};

      if (vista === 'diaria') {
        params = { fecha: fechaSeleccionada };
      }
      // Para vista semanal, cargar todas las reservas sin filtro de fecha

      const res = await reservasAPI.obtenerTodas(params);
      setReservas(res.data);
      setError(''); // Limpiar error si la carga fue exitosa
    } catch (err) {
      console.error('❌ Error al cargar reservas:', err);
      setError('Error al cargar reservas: ' + (err.response?.data?.mensaje || err.message));
    } finally {
      setCargando(false);
    }
  }, [vista, fechaSeleccionada]);

  const cargarReservasPorEntrenador = useCallback(async () => {
    try {
      setCargando(true);
      const res = await reservasAPI.obtenerTodas({
        entrenador: entrenadorSeleccionado,
        fecha: fechaSeleccionada
      });
      setReservas(res.data);
      setError(''); // Limpiar error si la carga fue exitosa
    } catch (err) {
      setError('Error al cargar reservas: ' + (err.response?.data?.mensaje || err.message));
    } finally {
      setCargando(false);
    }
  }, [entrenadorSeleccionado, fechaSeleccionada]);

  useEffect(() => {
    cargarEntrenadores();
  }, [cargarEntrenadores]);

  useEffect(() => {
    if (vista === 'individual' && entrenadorSeleccionado) {
      cargarReservasPorEntrenador();
    } else if (vista !== 'individual') {
      cargarReservas();
    }
  }, [vista, entrenadorSeleccionado, fechaSeleccionada, cargarReservas, cargarReservasPorEntrenador]);

  const obtenerReservasEnHorario = (entrenadorId, hora) => {
    return reservas.filter((reserva) => {
      const reservaEntrenador = reserva.entrenador?._id || reserva.entrenador;
      const horaNum = parseInt(hora.split(':')[0]);
      const horaInicioNum = parseInt(reserva.horaInicio.split(':')[0]);
      const horaFinNum = parseInt(reserva.horaFin.split(':')[0]);

      return reservaEntrenador === entrenadorId &&
        horaNum >= horaInicioNum &&
        horaNum < horaFinNum;
    });
  };

  const obtenerDiasSemana = () => {
    // Usar la fecha sin conversión de zona horaria
    const [year, month, day] = fechaSeleccionada.split('-').map(Number);
    const fecha = new Date(year, month - 1, day);
    const diaSemana = fecha.getDay();
    const lunes = new Date(fecha);
    lunes.setDate(fecha.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1));

    const dias = [];
    for (let i = 0; i < 7; i++) {
      const dia = new Date(lunes);
      dia.setDate(lunes.getDate() + i);
      dias.push(dia);
    }
    return dias;
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  const esTurnoManana = (hora) => {
    const horaNum = parseInt(hora.split(':')[0]);
    return horaNum < 14; // Antes de las 14:00
  };

  const cambiarDia = (dias) => {
    const fecha = new Date(fechaSeleccionada);
    fecha.setDate(fecha.getDate() + dias);
    setFechaSeleccionada(formatearFechaLocal(fecha));
  };

  const renderVistaIndividual = () => {
    const entrenador = entrenadores.find((e) => e._id === entrenadorSeleccionado);
    if (!entrenador) return null;

    return (
      <div style={styles.calendarioContainer}>
        <div style={styles.calendarioHeader}>
          <div style={styles.navegacionFecha}>
            <button onClick={() => cambiarDia(-1)} style={styles.buttonNav}>
              ← Día Anterior
            </button>
            <input
              type="date"
              value={fechaSeleccionada}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
              style={styles.inputFecha}
            />
            <button onClick={() => cambiarDia(1)} style={styles.buttonNav}>
              Día Siguiente →
            </button>
          </div>
          <h3 style={styles.entrenadorNombre}>{entrenador.nombre}</h3>
        </div>

        <div style={styles.gridIndividual}>
          <div style={styles.headerHorario}>Horario</div>
          <div style={styles.headerColumna}>Sesiones</div>

          {horarios.map((hora) => {
            const reservasHora = obtenerReservasEnHorario(entrenadorSeleccionado, hora);
            const esManana = esTurnoManana(hora);

            return (
              <div key={`row-${hora}`} style={{ display: 'contents' }}>
                <div
                  style={{
                    ...styles.celdaHorario,
                    backgroundColor: esManana ? '#fff9e6' : '#e6f3ff'
                  }}
                >
                  <strong>{hora}</strong>
                  <span style={styles.turnoLabel}>
                    {esManana ? '☀️' : '🌙'}
                  </span>
                </div>
                <div style={styles.celdaSesion}>
                  {reservasHora.map((reserva) => (
                    <div key={reserva._id} style={styles.reservaCard}>
                      <strong>
                        {reserva.cliente.nombre} {reserva.cliente.apellido}
                      </strong>
                      <div style={styles.reservaDetalle}>
                        {reserva.horaInicio} - {reserva.horaFin}
                      </div>
                      <div style={styles.reservaTipo}>{reserva.tipoSesion}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderVistaDiaria = () => {
    return (
      <div style={styles.calendarioContainer}>
        <div style={styles.calendarioHeader}>
          <div style={styles.navegacionFecha}>
            <button onClick={() => cambiarDia(-1)} style={styles.buttonNav}>
              ← Día Anterior
            </button>
            <input
              type="date"
              value={fechaSeleccionada}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
              style={styles.inputFecha}
            />
            <button onClick={() => cambiarDia(1)} style={styles.buttonNav}>
              Día Siguiente →
            </button>
          </div>
        </div>

        <div style={styles.infoTurnos}>
          <span style={styles.turnoInfo}>
            <span style={styles.turnoIcono}>☀️</span> Mañana (7-14h): ~2 entrenadores
          </span>
          <span style={styles.turnoInfo}>
            <span style={styles.turnoIcono}>🌙</span> Tarde (14-22h): ~4 entrenadores
          </span>
        </div>

        <div
          style={{
            ...styles.gridDiaria,
            gridTemplateColumns: `100px repeat(${entrenadores.length}, 1fr)`
          }}
        >
          <div style={styles.headerHorario}>Horario</div>
          {entrenadores.map((entrenador) => (
            <div key={entrenador._id} style={styles.headerColumna}>
              {entrenador.nombre}
            </div>
          ))}

          {horarios.map((hora) => {
            const esManana = esTurnoManana(hora);
            return (
              <div key={`row-diaria-${hora}`} style={{ display: 'contents' }}>
                <div
                  style={{
                    ...styles.celdaHorario,
                    backgroundColor: esManana ? '#fff9e6' : '#e6f3ff'
                  }}
                >
                  <strong>{hora}</strong>
                  <span style={styles.turnoLabel}>
                    {esManana ? '☀️' : '🌙'}
                  </span>
                </div>
                {entrenadores.map((entrenador) => {
                  const reservasHora = obtenerReservasEnHorario(entrenador._id, hora);
                  return (
                    <div
                      key={`celda-${hora}-${entrenador._id}`}
                      style={{
                        ...styles.celdaSesion,
                        backgroundColor: esManana ? '#fffef8' : '#f8fcff'
                      }}
                    >
                      {reservasHora.map((reserva) => (
                        <div key={reserva._id} style={styles.reservaCardCompacta}>
                          <strong style={styles.clienteNombre}>
                            {reserva.cliente.nombre} {reserva.cliente.apellido}
                          </strong>
                          <div style={styles.reservaHorario}>
                            {reserva.horaInicio} - {reserva.horaFin}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderVistaSemanal = () => {
    const diasSemana = obtenerDiasSemana();

    return (
      <div style={styles.calendarioContainer}>
        <div style={styles.calendarioHeader}>
          <div style={styles.navegacionFecha}>
            <button onClick={() => cambiarDia(-7)} style={styles.buttonNav}>
              ← Semana Anterior
            </button>
            <span style={styles.rangoSemana}>
              {formatearFecha(diasSemana[0])} - {formatearFecha(diasSemana[6])}
            </span>
            <button onClick={() => cambiarDia(7)} style={styles.buttonNav}>
              Semana Siguiente →
            </button>
          </div>
        </div>

        <div style={styles.infoTurnos}>
          <span style={styles.turnoInfo}>
            <span style={styles.turnoIcono}>☀️</span> Mañana: ~2 entrenadores
          </span>
          <span style={styles.turnoInfo}>
            <span style={styles.turnoIcono}>🌙</span> Tarde: ~4 entrenadores
          </span>
        </div>

        <div
          style={{
            ...styles.gridSemanal,
            gridTemplateColumns: `120px repeat(${diasSemana.length}, 1fr)`
          }}
        >
          <div style={styles.headerHorario}>Entrenador</div>
          {diasSemana.map((dia, index) => (
            <div key={index} style={styles.headerDia}>
              {formatearFecha(dia)}
            </div>
          ))}

          {entrenadores.map((entrenador) => (
            <div key={`row-semanal-${entrenador._id}`} style={{ display: 'contents' }}>
              <div style={styles.celdaEntrenador}>
                {entrenador.nombre}
              </div>
              {diasSemana.map((dia, diaIndex) => {
                // Formatear la fecha del día sin problemas de zona horaria
                const year = dia.getFullYear();
                const month = String(dia.getMonth() + 1).padStart(2, '0');
                const day = String(dia.getDate()).padStart(2, '0');
                const fechaDia = `${year}-${month}-${day}`;

                const reservasDia = reservas.filter((r) => {
                  const reservaEntrenador = r.entrenador?._id || r.entrenador;
                  // Extraer solo la parte de fecha de la reserva
                  const reservaFecha = r.fecha.split('T')[0];
                  return reservaEntrenador === entrenador._id && reservaFecha === fechaDia;
                });

                return (
                  <div
                    key={`celda-${entrenador._id}-${diaIndex}`}
                    style={styles.celdaDia}
                  >
                    <div style={styles.contadorSesiones}>
                      {reservasDia.length > 0 ? `${reservasDia.length} sesiones` : '-'}
                    </div>
                    {reservasDia.slice(0, 3).map((reserva) => (
                      <div key={reserva._id} style={styles.reservaMini}>
                        {reserva.horaInicio}
                      </div>
                    ))}
                    {reservasDia.length > 3 && (
                      <div style={styles.reservaMas}>+{reservasDia.length - 3}</div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (cargando && entrenadores.length === 0) {
    return <div style={styles.container}>Cargando...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Calendario de Sesiones</h1>
          <p style={styles.subtitle}>
            Vista estilo Excel de las sesiones programadas
          </p>
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {!cargando && reservas.length > 0 && (
        <div style={styles.infoReservas}>
          ℹ️ {reservas.length} reserva{reservas.length !== 1 ? 's' : ''} cargada{reservas.length !== 1 ? 's' : ''}
        </div>
      )}

      {!cargando && reservas.length === 0 && !error && (
        <div style={styles.infoReservas}>
          ⚠️ No hay reservas para mostrar
        </div>
      )}

      <div style={styles.controles}>
        <div style={styles.selectorVista}>
          <button
            onClick={() => setVista('individual')}
            style={{
              ...styles.botonVista,
              ...(vista === 'individual' && styles.botonVistaActivo)
            }}
          >
            📋 Individual
          </button>
          <button
            onClick={() => setVista('diaria')}
            style={{
              ...styles.botonVista,
              ...(vista === 'diaria' && styles.botonVistaActivo)
            }}
          >
            📅 Vista Diaria
          </button>
          <button
            onClick={() => setVista('semanal')}
            style={{
              ...styles.botonVista,
              ...(vista === 'semanal' && styles.botonVistaActivo)
            }}
          >
            📆 Vista Semanal
          </button>
        </div>

        {vista === 'individual' && (
          <div style={styles.selectorEntrenador}>
            <label style={styles.label}>Seleccionar Entrenador:</label>
            <select
              value={entrenadorSeleccionado}
              onChange={(e) => setEntrenadorSeleccionado(e.target.value)}
              style={styles.select}
            >
              {entrenadores.map((entrenador) => (
                <option key={entrenador._id} value={entrenador._id}>
                  {entrenador.nombre}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {vista === 'individual' && renderVistaIndividual()}
      {vista === 'diaria' && renderVistaDiaria()}
      {vista === 'semanal' && renderVistaSemanal()}
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '100%',
    margin: '0 auto',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh'
  },
  header: {
    marginBottom: '20px'
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
    padding: '10px',
    backgroundColor: '#fee',
    color: '#c00',
    borderRadius: '4px',
    marginBottom: '20px'
  },
  infoReservas: {
    padding: '10px',
    backgroundColor: '#e7f3ff',
    color: '#007bff',
    borderRadius: '4px',
    marginBottom: '15px',
    fontSize: '14px',
    fontWeight: '500',
    textAlign: 'center'
  },
  controles: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '15px'
  },
  selectorVista: {
    display: 'flex',
    gap: '10px'
  },
  botonVista: {
    padding: '10px 20px',
    fontSize: '14px',
    border: '2px solid #ddd',
    borderRadius: '6px',
    backgroundColor: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  botonVistaActivo: {
    backgroundColor: '#007bff',
    color: 'white',
    borderColor: '#007bff'
  },
  selectorEntrenador: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#333'
  },
  select: {
    padding: '8px 12px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    outline: 'none',
    minWidth: '200px'
  },
  calendarioContainer: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    overflow: 'auto'
  },
  calendarioHeader: {
    padding: '20px',
    borderBottom: '2px solid #eee'
  },
  navegacionFecha: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '15px',
    marginBottom: '10px'
  },
  buttonNav: {
    padding: '8px 16px',
    fontSize: '14px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  inputFecha: {
    padding: '8px 12px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    outline: 'none'
  },
  rangoSemana: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#333'
  },
  entrenadorNombre: {
    textAlign: 'center',
    fontSize: '20px',
    color: '#007bff',
    margin: '10px 0 0 0'
  },
  infoTurnos: {
    display: 'flex',
    justifyContent: 'center',
    gap: '30px',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderBottom: '1px solid #ddd'
  },
  turnoInfo: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#555'
  },
  turnoIcono: {
    fontSize: '18px',
    marginRight: '5px'
  },
  gridIndividual: {
    display: 'grid',
    gridTemplateColumns: '100px 1fr',
    minWidth: '600px'
  },
  gridDiaria: {
    display: 'grid',
    minWidth: '1200px'
  },
  gridSemanal: {
    display: 'grid',
    minWidth: '1000px'
  },
  headerHorario: {
    padding: '15px',
    backgroundColor: '#343a40',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '14px',
    textAlign: 'center',
    borderRight: '1px solid #ddd',
    position: 'sticky',
    left: 0,
    zIndex: 10
  },
  headerColumna: {
    padding: '15px',
    backgroundColor: '#007bff',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '14px',
    textAlign: 'center',
    borderRight: '1px solid #ddd'
  },
  headerDia: {
    padding: '15px',
    backgroundColor: '#17a2b8',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '13px',
    textAlign: 'center',
    borderRight: '1px solid #ddd',
    textTransform: 'capitalize'
  },
  celdaHorario: {
    padding: '12px',
    borderRight: '2px solid #ddd',
    borderBottom: '1px solid #ddd',
    fontWeight: '500',
    fontSize: '14px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    position: 'sticky',
    left: 0,
    zIndex: 5
  },
  turnoLabel: {
    fontSize: '12px'
  },
  celdaSesion: {
    padding: '8px',
    borderRight: '1px solid #ddd',
    borderBottom: '1px solid #ddd',
    minHeight: '60px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  celdaEntrenador: {
    padding: '12px',
    backgroundColor: '#f8f9fa',
    borderRight: '2px solid #ddd',
    borderBottom: '1px solid #ddd',
    fontWeight: '500',
    fontSize: '13px',
    position: 'sticky',
    left: 0,
    zIndex: 5
  },
  celdaDia: {
    padding: '8px',
    borderRight: '1px solid #ddd',
    borderBottom: '1px solid #ddd',
    minHeight: '80px',
    backgroundColor: '#fafafa'
  },
  reservaCard: {
    padding: '10px',
    backgroundColor: '#e7f3ff',
    borderLeft: '4px solid #007bff',
    borderRadius: '4px',
    fontSize: '13px'
  },
  reservaDetalle: {
    fontSize: '12px',
    color: '#666',
    marginTop: '4px'
  },
  reservaTipo: {
    fontSize: '11px',
    color: '#888',
    textTransform: 'capitalize',
    marginTop: '2px'
  },
  reservaCardCompacta: {
    padding: '6px 8px',
    backgroundColor: '#e7f3ff',
    borderLeft: '3px solid #007bff',
    borderRadius: '3px',
    fontSize: '12px'
  },
  clienteNombre: {
    display: 'block',
    fontSize: '12px',
    marginBottom: '3px'
  },
  reservaHorario: {
    fontSize: '11px',
    color: '#666'
  },
  contadorSesiones: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#007bff',
    marginBottom: '6px',
    textAlign: 'center'
  },
  reservaMini: {
    fontSize: '11px',
    padding: '4px',
    backgroundColor: '#e7f3ff',
    borderRadius: '3px',
    textAlign: 'center',
    marginBottom: '4px'
  },
  reservaMas: {
    fontSize: '11px',
    padding: '4px',
    backgroundColor: '#ffc107',
    color: '#333',
    borderRadius: '3px',
    textAlign: 'center',
    fontWeight: '600'
  }
};

export default CalendarioReservas;
