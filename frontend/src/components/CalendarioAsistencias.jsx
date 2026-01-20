import { useState, useEffect } from 'react';
import './CalendarioAsistencias.css';

const DIAS_SEMANA_CORTOS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

function CalendarioAsistencias({ mes, anio, diasSeleccionados = [], onChange, diasDeshabilitados = [] }) {
  const [calendario, setCalendario] = useState([]);

  useEffect(() => {
    generarCalendario();
  }, [mes, anio]);

  const generarCalendario = () => {
    const primerDia = new Date(anio, mes - 1, 1);
    const ultimoDia = new Date(anio, mes, 0);
    const diasEnMes = ultimoDia.getDate();

    // Ajustar el día de inicio (0 = Domingo, queremos que 0 = Lunes)
    let diaInicio = primerDia.getDay() - 1;
    if (diaInicio < 0) diaInicio = 6;

    const semanas = [];
    let semanaActual = [];

    // Días vacíos al inicio
    for (let i = 0; i < diaInicio; i++) {
      semanaActual.push(null);
    }

    // Días del mes
    for (let dia = 1; dia <= diasEnMes; dia++) {
      semanaActual.push(dia);

      if (semanaActual.length === 7) {
        semanas.push(semanaActual);
        semanaActual = [];
      }
    }

    // Completar última semana
    while (semanaActual.length > 0 && semanaActual.length < 7) {
      semanaActual.push(null);
    }
    if (semanaActual.length > 0) {
      semanas.push(semanaActual);
    }

    setCalendario(semanas);
  };

  const toggleDia = (dia) => {
    if (!dia || diasDeshabilitados.includes(dia)) return;

    const nuevaSeleccion = [...diasSeleccionados];
    const index = nuevaSeleccion.indexOf(dia);

    if (index > -1) {
      nuevaSeleccion.splice(index, 1);
    } else {
      nuevaSeleccion.push(dia);
    }

    onChange(nuevaSeleccion.sort((a, b) => a - b));
  };

  const esFinDeSemana = (dia) => {
    if (!dia) return false;
    const fecha = new Date(anio, mes - 1, dia);
    const diaSemana = fecha.getDay();
    return diaSemana === 0 || diaSemana === 6;
  };

  const esFuturo = (dia) => {
    if (!dia) return false;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fecha = new Date(anio, mes - 1, dia);
    return fecha > hoy;
  };

  const esHoy = (dia) => {
    if (!dia) return false;
    const hoy = new Date();
    return dia === hoy.getDate() &&
           mes === hoy.getMonth() + 1 &&
           anio === hoy.getFullYear();
  };

  return (
    <div className="calendario-asistencias">
      <div className="calendario-header">
        <span className="calendario-titulo">{MESES[mes - 1]} {anio}</span>
        <span className="calendario-contador">
          <strong>{diasSeleccionados.length}</strong> sesiones marcadas
        </span>
      </div>

      <div className="calendario-grid">
        {/* Encabezados de días */}
        {DIAS_SEMANA_CORTOS.map((dia, i) => (
          <div key={i} className={`calendario-dia-header ${i >= 5 ? 'fin-semana' : ''}`}>
            {dia}
          </div>
        ))}

        {/* Días del mes */}
        {calendario.map((semana, semanaIdx) => (
          semana.map((dia, diaIdx) => {
            const seleccionado = dia && diasSeleccionados.includes(dia);
            const deshabilitado = dia && (diasDeshabilitados.includes(dia) || esFuturo(dia));
            const finDeSemana = esFinDeSemana(dia);
            const hoy = esHoy(dia);

            return (
              <div
                key={`${semanaIdx}-${diaIdx}`}
                className={`calendario-dia
                  ${!dia ? 'vacio' : ''}
                  ${seleccionado ? 'seleccionado' : ''}
                  ${deshabilitado ? 'deshabilitado' : ''}
                  ${finDeSemana ? 'fin-semana' : ''}
                  ${hoy ? 'hoy' : ''}`}
                onClick={() => !deshabilitado && toggleDia(dia)}
                title={seleccionado ? 'Quitar asistencia' : 'Marcar asistencia'}
              >
                {dia}
                {seleccionado && <span className="check-mark">✓</span>}
              </div>
            );
          })
        ))}
      </div>

      <div className="calendario-leyenda">
        <div className="leyenda-item">
          <span className="leyenda-color seleccionado"></span>
          <span>Asistió</span>
        </div>
        <div className="leyenda-item">
          <span className="leyenda-color fin-semana"></span>
          <span>Fin de semana</span>
        </div>
        <div className="leyenda-item">
          <span className="leyenda-color hoy"></span>
          <span>Hoy</span>
        </div>
      </div>
    </div>
  );
}

export default CalendarioAsistencias;
