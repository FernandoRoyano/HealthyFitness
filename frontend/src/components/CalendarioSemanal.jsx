import { useState, useEffect } from 'react';
import './CalendarioSemanal.css';

function CalendarioSemanal({ reservas, onAgregarReserva, onEditarReserva, onMoverReserva, soloLectura = false }) {
  const [semanaActual, setSemanaActual] = useState(new Date());
  const [diaSeleccionado, setDiaSeleccionado] = useState(0); // 0=Lunes, 4=Viernes

  // Estados para drag & drop
  const [arrastrando, setArrastrando] = useState(null);
  const [celdaHover, setCeldaHover] = useState(null);

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
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
    '20:00', '20:30', '21:00'
  ];

  // Obtener reserva que INICIA en este horario exacto
  const obtenerReservaParaHorario = (fecha, hora) => {
    return reservas.find(reserva => {
      const fechaReserva = new Date(reserva.fecha).toDateString();
      const fechaDia = fecha.toDateString();
      return fechaReserva === fechaDia && reserva.horaInicio === hora;
    });
  };

  // Verificar si este slot está ocupado por una reserva que empezó antes
  const slotOcupadoPorReservaAnterior = (fecha, hora) => {
    const minutoSlot = horaAMinutos(hora);
    return reservas.find(reserva => {
      const fechaReserva = new Date(reserva.fecha).toDateString();
      const fechaDia = fecha.toDateString();
      if (fechaReserva !== fechaDia) return false;

      const inicioReserva = horaAMinutos(reserva.horaInicio);
      const finReserva = horaAMinutos(reserva.horaFin);

      // Este slot está ocupado si está dentro del rango de la reserva (pero no es el inicio)
      return minutoSlot > inicioReserva && minutoSlot < finReserva;
    });
  };

  // Calcular cuántas filas (slots de 30 min) debe ocupar una reserva
  const calcularRowSpan = (reserva) => {
    const duracion = calcularDuracion(reserva.horaInicio, reserva.horaFin);
    return Math.ceil(duracion / 30);
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

  // Convertir hora string a minutos totales
  const horaAMinutos = (hora) => {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
  };

  // Convertir minutos totales a hora string
  const minutosAHora = (minutos) => {
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  // Calcular hora fin manteniendo la duración original
  const calcularHoraFin = (horaInicio, duracionOriginal) => {
    const minutosInicio = horaAMinutos(horaInicio);
    return minutosAHora(minutosInicio + duracionOriginal);
  };

  // Calcular duración en minutos
  const calcularDuracion = (horaInicio, horaFin) => {
    return horaAMinutos(horaFin) - horaAMinutos(horaInicio);
  };

  // Verificar si hay conflicto con otra reserva (considerando duración)
  const hayConflicto = (fecha, hora, reservaId) => {
    // Obtener la reserva que se está moviendo para conocer su duración
    const reservaMoviendo = reservas.find(r => r._id === reservaId);
    const duracionMoviendo = reservaMoviendo ? calcularDuracion(reservaMoviendo.horaInicio, reservaMoviendo.horaFin) : 60;

    const inicioNuevo = horaAMinutos(hora);
    const finNuevo = inicioNuevo + duracionMoviendo;

    return reservas.some(r => {
      if (r._id === reservaId) return false;
      const fechaReserva = new Date(r.fecha).toDateString();
      const fechaDia = fecha.toDateString();
      if (fechaReserva !== fechaDia) return false;

      // Verificar solapamiento de horarios
      const inicioExistente = horaAMinutos(r.horaInicio);
      const finExistente = horaAMinutos(r.horaFin);

      // Hay conflicto si los rangos se solapan
      return inicioNuevo < finExistente && finNuevo > inicioExistente;
    });
  };

  // Handlers de Drag & Drop
  const handleDragStart = (e, reserva) => {
    if (soloLectura) return;
    setArrastrando(reserva);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('reservaId', reserva._id);
    // Agregar imagen fantasma personalizada
    const dragImage = e.target.cloneNode(true);
    dragImage.style.opacity = '0.8';
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 50, 25);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  const handleDragEnd = () => {
    setArrastrando(null);
    setCeldaHover(null);
  };

  const handleDragOver = (e, fecha, hora) => {
    e.preventDefault();
    if (!arrastrando) return;

    const tieneConflicto = hayConflicto(fecha, hora, arrastrando._id);
    e.dataTransfer.dropEffect = tieneConflicto ? 'none' : 'move';

    const fechaStr = fecha.toDateString();
    if (celdaHover?.fecha !== fechaStr || celdaHover?.hora !== hora) {
      setCeldaHover({ fecha: fechaStr, hora, conflicto: tieneConflicto });
    }
  };

  const handleDragLeave = (e) => {
    // Solo limpiar si realmente salimos de la celda
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setCeldaHover(null);
    }
  };

  const handleDrop = async (e, fecha, hora) => {
    e.preventDefault();

    if (!arrastrando || !onMoverReserva) {
      setArrastrando(null);
      setCeldaHover(null);
      return;
    }

    // Verificar conflictos
    if (hayConflicto(fecha, hora, arrastrando._id)) {
      setArrastrando(null);
      setCeldaHover(null);
      return;
    }

    // Calcular nueva hora fin manteniendo la duración
    const duracion = calcularDuracion(arrastrando.horaInicio, arrastrando.horaFin);
    const nuevaHoraFin = calcularHoraFin(hora, duracion);

    // Llamar al callback para mover la reserva
    await onMoverReserva(arrastrando._id, fecha, hora, nuevaHoraFin);

    setArrastrando(null);
    setCeldaHover(null);
  };

  // Obtener clase CSS de la celda
  const obtenerClaseCelda = (fecha, hora) => {
    let clases = 'calendario-celda';

    if (celdaHover && celdaHover.fecha === fecha.toDateString() && celdaHover.hora === hora) {
      clases += celdaHover.conflicto ? ' drop-target-invalid' : ' drop-target';
    }

    return clases;
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
                const ocupadoPorOtra = !reserva && slotOcupadoPorReservaAnterior(dia, hora);
                const rowSpan = reserva ? calcularRowSpan(reserva) : 1;

                return (
                  <div
                    key={hora}
                    className={`${obtenerClaseCelda(dia, hora)}${ocupadoPorOtra ? ' celda-ocupada' : ''}`}
                    onDragOver={(e) => handleDragOver(e, dia, hora)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, dia, hora)}
                  >
                    {reserva ? (
                      <div
                        className={`calendario-reserva ${arrastrando?._id === reserva._id ? 'arrastrando' : ''} span-${rowSpan}`}
                        draggable={!soloLectura && !!onMoverReserva}
                        onDragStart={(e) => handleDragStart(e, reserva)}
                        onDragEnd={handleDragEnd}
                        onClick={() => !soloLectura && onEditarReserva && onEditarReserva(reserva)}
                        style={{ '--row-span': rowSpan }}
                      >
                        <div className="calendario-reserva-nombre">
                          {reserva.cliente?.nombre} {reserva.cliente?.apellido}
                        </div>
                        <div className="calendario-reserva-hora">
                          {reserva.horaInicio} - {reserva.horaFin}
                        </div>
                        <div className="calendario-reserva-tipo">{reserva.tipoSesion}</div>
                        {reserva.entrenador && (
                          <div className="calendario-reserva-entrenador">
                            {reserva.entrenador.nombre}
                          </div>
                        )}
                      </div>
                    ) : ocupadoPorOtra ? null : (
                      !soloLectura && !arrastrando && (
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
            const ocupadoPorOtra = !reserva && slotOcupadoPorReservaAnterior(diaActual, hora);

            return (
              <div key={hora} className={`calendario-dia-fila${ocupadoPorOtra ? ' fila-ocupada' : ''}`}>
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
                      {reserva.entrenador && (
                        <div className="calendario-dia-reserva-entrenador">
                          {reserva.entrenador.nombre}
                        </div>
                      )}
                    </div>
                  ) : ocupadoPorOtra ? (
                    <div className="calendario-dia-ocupado"></div>
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
