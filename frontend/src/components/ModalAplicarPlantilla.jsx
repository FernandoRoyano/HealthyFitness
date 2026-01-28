import { useState, useEffect } from 'react';
import { plantillasAPI } from '../services/api';

const ModalAplicarPlantilla = ({ plantilla, mes, anio, onClose, onSuccess }) => {
  const [semanas, setSemanas] = useState([]);
  const [semanasSeleccionadas, setSemanasSeleccionadas] = useState({});
  const [cargando, setCargando] = useState(true);
  const [aplicando, setAplicando] = useState(false);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState(null);

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  useEffect(() => {
    calcularSemanasDelMes();
  }, [mes, anio]);

  const calcularSemanasDelMes = async () => {
    setCargando(true);
    setError('');

    try {
      // Calcular todas las semanas del mes
      const semanasDelMes = [];
      const primerDia = new Date(anio, mes - 1, 1);
      const ultimoDia = new Date(anio, mes, 0);

      // Encontrar el primer lunes del mes o antes
      let lunes = new Date(primerDia);
      const diaSemana = lunes.getDay();
      if (diaSemana === 0) {
        lunes.setDate(lunes.getDate() + 1);
      } else if (diaSemana > 1) {
        lunes.setDate(lunes.getDate() - (diaSemana - 1));
      }

      // Si el lunes es del mes anterior, avanzar una semana si queda muy atras
      if (lunes.getMonth() !== mes - 1 && lunes.getDate() > 7) {
        lunes.setDate(lunes.getDate() + 7);
      }

      let semanaNum = 1;
      while (lunes <= ultimoDia || lunes.getMonth() === mes - 1) {
        const viernes = new Date(lunes);
        viernes.setDate(lunes.getDate() + 4);

        // Solo incluir si al menos parte de la semana esta en el mes
        const lunesEnMes = lunes.getMonth() === mes - 1;
        const viernesEnMes = viernes.getMonth() === mes - 1;

        if (lunesEnMes || viernesEnMes) {
          const fechaLunesStr = formatearFecha(lunes);

          semanasDelMes.push({
            numero: semanaNum,
            fechaLunes: fechaLunesStr,
            fechaLunesDate: new Date(lunes),
            fechaViernes: new Date(viernes),
            preview: null,
            cargandoPreview: true
          });
          semanaNum++;
        }

        lunes.setDate(lunes.getDate() + 7);

        // Salir si ya pasamos el mes
        if (lunes.getMonth() > mes - 1 || (lunes.getMonth() === 0 && mes === 12)) {
          break;
        }
      }

      setSemanas(semanasDelMes);
      setCargando(false);

      // Cargar previews en paralelo para no bloquear
      const cargarPreview = async (semana) => {
        try {
          const { data } = await plantillasAPI.previewSemana(plantilla._id, semana.fechaLunes);
          setSemanas(prev => prev.map(s =>
            s.fechaLunes === semana.fechaLunes
              ? { ...s, preview: data, cargandoPreview: false }
              : s
          ));
        } catch (err) {
          setSemanas(prev => prev.map(s =>
            s.fechaLunes === semana.fechaLunes
              ? { ...s, preview: { error: true }, cargandoPreview: false }
              : s
          ));
        }
      };

      // Lanzar todas las cargas en paralelo
      Promise.all(semanasDelMes.map(cargarPreview));
      return; // Exit early, setCargando(false) already called
    } catch (err) {
      setError('Error al calcular semanas');
    } finally {
      setCargando(false);
    }
  };

  const formatearFecha = (fecha) => {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatearFechaCorta = (fecha) => {
    return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  const toggleSemana = (fechaLunes) => {
    setSemanasSeleccionadas(prev => ({
      ...prev,
      [fechaLunes]: !prev[fechaLunes]
    }));
  };

  const getResumen = () => {
    const seleccionadas = semanas.filter(s => semanasSeleccionadas[s.fechaLunes]);
    let totalReservas = 0;
    let totalConflictos = 0;

    seleccionadas.forEach(s => {
      if (s.preview && !s.preview.error) {
        totalReservas += s.preview.resumen?.sinConflicto || 0;
        totalConflictos += s.preview.resumen?.conConflicto || 0;
      }
    });

    return { semanas: seleccionadas.length, reservas: totalReservas, conflictos: totalConflictos };
  };

  const handleAplicar = async () => {
    const seleccionadas = semanas.filter(s => semanasSeleccionadas[s.fechaLunes]);
    if (seleccionadas.length === 0) {
      setError('Selecciona al menos una semana');
      return;
    }

    setAplicando(true);
    setError('');
    setResultado(null);

    const resultados = {
      exitosas: 0,
      reservasCreadas: 0,
      conflictosOmitidos: 0,
      errores: []
    };

    for (const semana of seleccionadas) {
      try {
        const { data } = await plantillasAPI.aplicarASemana(plantilla._id, {
          fechaLunes: semana.fechaLunes,
          omitirConflictos: true
        });
        resultados.exitosas++;
        resultados.reservasCreadas += data.reservasCreadas || 0;
        resultados.conflictosOmitidos += data.conflictosOmitidos || 0;
      } catch (err) {
        resultados.errores.push({
          semana: `Semana ${semana.numero}`,
          error: err.response?.data?.mensaje || 'Error desconocido'
        });
      }
    }

    setResultado(resultados);
    setAplicando(false);

    if (resultados.exitosas > 0) {
      setTimeout(() => {
        onSuccess(resultados);
      }, 2000);
    }
  };

  const resumen = getResumen();

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.titulo}>Aplicar Plantilla</h2>
          <p style={styles.subtitulo}>{meses[mes - 1]} {anio}</p>
          <button style={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        {error && (
          <div style={styles.error}>{error}</div>
        )}

        {resultado && (
          <div style={resultado.errores.length > 0 ? styles.resultadoParcial : styles.resultadoExito}>
            <strong>Resultado:</strong>
            <p>Se crearon {resultado.reservasCreadas} reservas en {resultado.exitosas} semana(s)</p>
            {resultado.conflictosOmitidos > 0 && (
              <p style={styles.conflictosInfo}>{resultado.conflictosOmitidos} conflictos omitidos</p>
            )}
            {resultado.errores.length > 0 && (
              <div style={styles.erroresList}>
                {resultado.errores.map((e, i) => (
                  <p key={i}>{e.semana}: {e.error}</p>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={styles.contenido}>
          <p style={styles.instrucciones}>
            Selecciona las semanas donde aplicar el horario base:
          </p>

          {cargando ? (
            <div style={styles.cargando}>Calculando semanas...</div>
          ) : (
            <div style={styles.semanasList}>
              {semanas.map(semana => (
                <div
                  key={semana.fechaLunes}
                  style={{
                    ...styles.semanaItem,
                    ...(semanasSeleccionadas[semana.fechaLunes] ? styles.semanaSeleccionada : {})
                  }}
                  onClick={() => toggleSemana(semana.fechaLunes)}
                >
                  <div style={styles.semanaCheckbox}>
                    <input
                      type="checkbox"
                      checked={!!semanasSeleccionadas[semana.fechaLunes]}
                      onChange={() => toggleSemana(semana.fechaLunes)}
                    />
                  </div>
                  <div style={styles.semanaInfo}>
                    <div style={styles.semanaFechas}>
                      <strong>Semana {semana.numero}:</strong>{' '}
                      {formatearFechaCorta(semana.fechaLunesDate)} - {formatearFechaCorta(semana.fechaViernes)}
                    </div>
                    {semana.cargandoPreview ? (
                      <div style={styles.previewCargando}>Verificando disponibilidad...</div>
                    ) : semana.preview?.error ? (
                      <div style={styles.previewError}>Error al verificar</div>
                    ) : (
                      <div style={styles.previewInfo}>
                        {semana.preview?.resumen?.conConflicto > 0 ? (
                          <span style={styles.conflicto}>
                            {semana.preview.resumen.conConflicto} conflicto(s) detectado(s)
                          </span>
                        ) : (
                          <span style={styles.sinConflicto}>Sin conflictos</span>
                        )}
                        {' - '}
                        <span>{semana.preview?.resumen?.sinConflicto || 0} reservas a crear</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={styles.footer}>
          <div style={styles.resumen}>
            {resumen.semanas > 0 ? (
              <>
                <strong>{resumen.semanas}</strong> semana(s) seleccionada(s) |{' '}
                <strong>{resumen.reservas}</strong> reservas a crear
                {resumen.conflictos > 0 && (
                  <span style={styles.conflictoResumen}> | {resumen.conflictos} conflictos</span>
                )}
              </>
            ) : (
              <span style={styles.sinSeleccion}>Ninguna semana seleccionada</span>
            )}
          </div>
          <div style={styles.botones}>
            <button
              style={styles.btnCancelar}
              onClick={onClose}
              disabled={aplicando}
            >
              Cancelar
            </button>
            <button
              style={{
                ...styles.btnAplicar,
                ...(resumen.semanas === 0 || aplicando ? styles.btnDisabled : {})
              }}
              onClick={handleAplicar}
              disabled={resumen.semanas === 0 || aplicando}
            >
              {aplicando ? 'Aplicando...' : 'Aplicar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

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
    zIndex: 1000
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '550px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
  },
  header: {
    padding: '20px',
    borderBottom: '1px solid #e5e7eb',
    position: 'relative'
  },
  titulo: {
    margin: 0,
    fontSize: '20px',
    color: '#1a365d'
  },
  subtitulo: {
    margin: '5px 0 0',
    color: '#666',
    fontSize: '14px'
  },
  closeBtn: {
    position: 'absolute',
    top: '15px',
    right: '15px',
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#666'
  },
  error: {
    margin: '15px 20px 0',
    padding: '12px',
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    borderRadius: '8px',
    fontSize: '14px'
  },
  resultadoExito: {
    margin: '15px 20px 0',
    padding: '12px',
    backgroundColor: '#d1fae5',
    color: '#065f46',
    borderRadius: '8px',
    fontSize: '14px'
  },
  resultadoParcial: {
    margin: '15px 20px 0',
    padding: '12px',
    backgroundColor: '#fef3c7',
    color: '#92400e',
    borderRadius: '8px',
    fontSize: '14px'
  },
  conflictosInfo: {
    margin: '5px 0 0',
    fontSize: '13px',
    opacity: 0.8
  },
  erroresList: {
    marginTop: '10px',
    fontSize: '12px',
    opacity: 0.9
  },
  contenido: {
    padding: '20px',
    overflowY: 'auto',
    flex: 1
  },
  instrucciones: {
    margin: '0 0 15px',
    color: '#4b5563',
    fontSize: '14px'
  },
  cargando: {
    textAlign: 'center',
    padding: '30px',
    color: '#666'
  },
  semanasList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  semanaItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '12px 15px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '2px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  semanaSeleccionada: {
    backgroundColor: '#eff6ff',
    border: '2px solid #3b82f6'
  },
  semanaCheckbox: {
    paddingTop: '2px'
  },
  semanaInfo: {
    flex: 1
  },
  semanaFechas: {
    fontSize: '14px',
    color: '#1f2937'
  },
  previewCargando: {
    fontSize: '12px',
    color: '#9ca3af',
    marginTop: '4px'
  },
  previewError: {
    fontSize: '12px',
    color: '#dc2626',
    marginTop: '4px'
  },
  previewInfo: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '4px'
  },
  conflicto: {
    color: '#d97706',
    fontWeight: 500
  },
  sinConflicto: {
    color: '#059669',
    fontWeight: 500
  },
  footer: {
    padding: '15px 20px',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px'
  },
  resumen: {
    fontSize: '13px',
    color: '#4b5563'
  },
  conflictoResumen: {
    color: '#d97706'
  },
  sinSeleccion: {
    color: '#9ca3af',
    fontStyle: 'italic'
  },
  botones: {
    display: 'flex',
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
  btnAplicar: {
    padding: '10px 24px',
    backgroundColor: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer'
  },
  btnDisabled: {
    backgroundColor: '#9ca3af',
    cursor: 'not-allowed'
  }
};

export default ModalAplicarPlantilla;
