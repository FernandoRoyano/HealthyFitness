import { useState, useEffect } from 'react';
import './CalendarioSemanal.css';

function CalendarioSemanal({ reservas, onAgregarReserva, onEditarReserva, soloLectura = false }) {
  const [semanaActual, setSemanaActual] = useState(new Date());
  const [diaSeleccionado, setDiaSeleccionado] = useState(0); // 0=Lunes, 4=Viernes

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

  const formatearFechaCorta = (fecha) => {
    return fecha.toLocaleDateString('es-ES', {
      day: '2-digit'
    });
  };

  const formatearNombreDia = (fecha) => {
    return fecha.toLocaleDateString('es-ES', { weekday: 'long' });
  };

  const formatearNombreDiaCorto = (fecha) => {
    return fecha.toLocaleDateString('es-ES', { weekday: 'short' }).substring(0, 2).toUpperCase();
  };

  const esHoy = (fecha) => {
    const hoy = new Date();
    return fecha.toDateString() === hoy.toDateString();
  };

  const diasSemana = obtenerDiasDeLaSemana();
  const mesAño = semanaActual.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const diaActual = diasSemana[diaSeleccionado];

  // Seleccionar automáticamente el día de hoy si está en la semana actual
  useEffect(() => {
    const hoy = new Date();
    const indiceHoy = diasSemana.findIndex(dia => dia.toDateString() === hoy.toDateString());
    if (indiceHoy !== -1) {
      setDiaSeleccionado(indiceHoy);
    }
  }, [semanaActual]);

  return (
    <div className="calendario-container">
      {/* Header con navegación */}
      <div className="calendario-header">
        <h3 className="calendario-mes-anio">{mesAño}</h3>
        <button onClick={() => cambiarSemana(-1)} className="calendario-nav-btn">
          ← Anterior
        </button>
        <button onClick={() => cambiarSemana(1)} className="calendario-nav-btn">
          Siguiente →
        </button>
      </div>

      {/* Tabs de días (solo móvil) */}
      <div className="calendario-dia-tabs">
        {diasSemana.map((dia, index) => (
          <button
            key={index}
            className={`calendario-dia-tab ${diaSeleccionado === index ? 'activo' : ''} ${esHoy(dia) ? 'hoy' : ''}`}
            onClick={() => setDiaSeleccionado(index)}
          >
            {formatearNombreDiaCorto(dia)}
            <span className="calendario-dia-tab-fecha">{formatearFechaCorta(dia)}</span>
          </button>
        ))}
      </div>

      {/* Título del día seleccionado (solo móvil) */}
      <div className="calendario-dia-titulo">
        {formatearNombreDia(diaActual)} {formatearFecha(diaActual)}
      </div>

      {/* Vista semanal (desktop) */}
      <div className="calendario-wrapper">
        <div className="calendario-grid">
          {/* Columna de horas */}
          <div className="calendario-columna-horas">
            <div className="calendario-header-celda"></div>
            {horariosDisponibles.map(hora => (
              <div key={hora} className="calendario-hora-celda">{hora}</div>
            ))}
          </div>

          {/* Columnas de días */}
          {diasSemana.map((dia, index) => (
            <div key={index} className="calendario-columna-dia">
              <div className={`calendario-header-celda ${esHoy(dia) ? 'hoy' : ''}`}>
                <div className="calendario-nombre-dia">{formatearNombreDia(dia)}</div>
                <div className="calendario-fecha-dia">{formatearFecha(dia)}</div>
              </div>

              {horariosDisponibles.map(hora => {
                const reserva = obtenerReservaParaHorario(dia, hora);
                return (
                  <div key={hora} className="calendario-celda">
                    {reserva ? (
                      <div
                        className="calendario-reserva"
                        onClick={() => !soloLectura && onEditarReserva && onEditarReserva(reserva)}
                      >
                        <div className="calendario-reserva-nombre">
                          {reserva.cliente?.nombre} {reserva.cliente?.apellido}
                        </div>
                        <div className="calendario-reserva-hora">
                          {reserva.horaInicio} - {reserva.horaFin}
                        </div>
                        <div className="calendario-reserva-tipo">{reserva.tipoSesion}</div>
                      </div>
                    ) : (
                      !soloLectura && (
                        <button
                          className="calendario-btn-agregar"
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

      {/* Vista de día único (móvil) */}
      <div className="calendario-vista-dia">
        <div className="calendario-dia-lista">
          {horariosDisponibles.map(hora => {
            const reserva = obtenerReservaParaHorario(diaActual, hora);
            return (
              <div key={hora} className="calendario-dia-fila">
                <div className="calendario-dia-hora">{hora}</div>
                <div className="calendario-dia-contenido">
                  {reserva ? (
                    <div
                      className="calendario-dia-reserva"
                      onClick={() => !soloLectura && onEditarReserva && onEditarReserva(reserva)}
                    >
                      <div className="calendario-dia-reserva-nombre">
                        {reserva.cliente?.nombre} {reserva.cliente?.apellido}
                      </div>
                      <div className="calendario-dia-reserva-info">
                        {reserva.horaInicio} - {reserva.horaFin} • {reserva.tipoSesion}
                      </div>
                    </div>
                  ) : (
                    !soloLectura && (
                      <button
                        className="calendario-dia-btn-agregar"
                        onClick={() => onAgregarReserva && onAgregarReserva(diaActual, hora)}
                      >
                        +
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default CalendarioSemanal;
