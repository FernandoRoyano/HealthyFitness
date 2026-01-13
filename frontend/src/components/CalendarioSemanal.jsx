import { useState } from 'react';

function CalendarioSemanal({ reservas, onAgregarReserva, onEditarReserva, soloLectura = false }) {
  const [semanaActual, setSemanaActual] = useState(new Date());

  const obtenerLunesDeLaSemana = (fecha) => {
    const d = new Date(fecha);
    const dia = d.getDay();
    const diff = d.getDate() - dia + (dia === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const obtenerDiasDeLaSemana = () => {
    const lunes = obtenerLunesDeLaSemana(semanaActual);
    const dias = [];
    for (let i = 0; i < 5; i++) {
      const dia = new Date(lunes);
      dia.setDate(lunes.getDate() + i);
      dias.push(dia);
    }
    return dias;
  };

  const cambiarSemana = (direccion) => {
    const nuevaFecha = new Date(semanaActual);
    nuevaFecha.setDate(semanaActual.getDate() + (direccion * 7));
    setSemanaActual(nuevaFecha);
  };

  const horariosDisponibles = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00'
  ];

  const obtenerReservaParaHorario = (fecha, hora) => {
    return reservas.find(reserva => {
      const fechaReserva = new Date(reserva.fecha).toDateString();
      const fechaDia = fecha.toDateString();
      return fechaReserva === fechaDia && reserva.horaInicio === hora;
    });
  };

  const formatearFecha = (fecha) => {
    return fecha.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short'
    });
  };

  const formatearNombreDia = (fecha) => {
    return fecha.toLocaleDateString('es-ES', { weekday: 'long' });
  };

  const esHoy = (fecha) => {
    const hoy = new Date();
    return fecha.toDateString() === hoy.toDateString();
  };

  const diasSemana = obtenerDiasDeLaSemana();
  const mesAño = semanaActual.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => cambiarSemana(-1)} style={styles.navButton}>
          ← Semana Anterior
        </button>
        <h3 style={styles.mesAño}>{mesAño}</h3>
        <button onClick={() => cambiarSemana(1)} style={styles.navButton}>
          Semana Siguiente →
        </button>
      </div>

      <div style={styles.calendarioWrapper}>
        <div style={styles.calendario}>
          {/* Columna de horas */}
          <div style={styles.columnaHoras}>
            <div style={styles.headerCelda}></div>
            {horariosDisponibles.map(hora => (
              <div key={hora} style={styles.horaCelda}>{hora}</div>
            ))}
          </div>

          {/* Columnas de días */}
          {diasSemana.map((dia, index) => (
            <div key={index} style={styles.columnaDia}>
              <div style={{
                ...styles.headerCelda,
                ...(esHoy(dia) && styles.headerHoy)
              }}>
                <div style={styles.nombreDia}>{formatearNombreDia(dia)}</div>
                <div style={styles.fechaDia}>{formatearFecha(dia)}</div>
              </div>

              {horariosDisponibles.map(hora => {
                const reserva = obtenerReservaParaHorario(dia, hora);
                return (
                  <div key={hora} style={styles.celda}>
                    {reserva ? (
                      <div
                        style={styles.reserva}
                        onClick={() => !soloLectura && onEditarReserva && onEditarReserva(reserva)}
                      >
                        <div style={styles.clienteNombre}>
                          {reserva.cliente?.nombre} {reserva.cliente?.apellido}
                        </div>
                        <div style={styles.reservaHora}>
                          {reserva.horaInicio} - {reserva.horaFin}
                        </div>
                        <div style={styles.reservaTipo}>{reserva.tipoSesion}</div>
                      </div>
                    ) : (
                      !soloLectura && (
                        <button
                          style={styles.btnAgregar}
                          onClick={() => onAgregarReserva && onAgregarReserva(dia, hora)}
                        >
                          +
                        </button>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  navButton: {
    padding: '8px 16px',
    fontSize: '14px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  mesAño: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#333',
    textTransform: 'capitalize'
  },
  calendarioWrapper: {
    overflowX: 'auto'
  },
  calendario: {
    display: 'grid',
    gridTemplateColumns: '80px repeat(5, 1fr)',
    gap: '1px',
    backgroundColor: '#e0e0e0',
    border: '1px solid #e0e0e0',
    minWidth: '900px'
  },
  columnaHoras: {
    display: 'flex',
    flexDirection: 'column'
  },
  columnaDia: {
    display: 'flex',
    flexDirection: 'column'
  },
  headerCelda: {
    backgroundColor: '#f8f9fa',
    padding: '12px 8px',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: '14px',
    minHeight: '60px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerHoy: {
    backgroundColor: '#e3f2fd',
    color: '#1976d2'
  },
  nombreDia: {
    textTransform: 'capitalize',
    fontSize: '13px'
  },
  fechaDia: {
    fontSize: '12px',
    marginTop: '4px',
    fontWeight: 'normal'
  },
  horaCelda: {
    backgroundColor: '#fafafa',
    padding: '8px',
    textAlign: 'center',
    fontSize: '12px',
    fontWeight: '500',
    color: '#666',
    minHeight: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  celda: {
    backgroundColor: 'white',
    minHeight: '60px',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  reserva: {
    backgroundColor: '#4caf50',
    color: 'white',
    padding: '8px',
    borderRadius: '4px',
    width: '100%',
    cursor: 'pointer',
    transition: 'transform 0.2s',
    fontSize: '11px'
  },
  clienteNombre: {
    fontWeight: 'bold',
    marginBottom: '4px',
    fontSize: '12px'
  },
  reservaHora: {
    fontSize: '10px',
    opacity: 0.9
  },
  reservaTipo: {
    fontSize: '10px',
    marginTop: '2px',
    opacity: 0.8,
    textTransform: 'capitalize'
  },
  btnAgregar: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    border: '2px dashed #ccc',
    backgroundColor: 'transparent',
    color: '#999',
    fontSize: '18px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  }
};

export default CalendarioSemanal;
