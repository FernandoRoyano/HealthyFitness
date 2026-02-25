import { useState, useEffect } from 'react';
import { entrenamientoAPI } from '../services/api';

function ProgresoEjercicio({ clienteId, ejercicioId, ejercicioNombre, onClose }) {
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarProgreso();
  }, [clienteId, ejercicioId]);

  const cargarProgreso = async () => {
    try {
      setCargando(true);
      setError('');
      const { data } = await entrenamientoAPI.obtenerProgresoPorEjercicio(clienteId, ejercicioId);
      setDatos(data || []);
    } catch (err) {
      console.error('Error al cargar progreso:', err);
      setError(err.response?.data?.mensaje || 'Error al cargar el progreso del ejercicio');
    } finally {
      setCargando(false);
    }
  };

  // ==================== Cálculos de resumen ====================

  const calcularResumen = () => {
    if (datos.length === 0) return null;

    // PR: mayor pesoMaximo
    let prValor = 0;
    let prFecha = '';
    datos.forEach(d => {
      if (d.pesoMaximo > prValor) {
        prValor = d.pesoMaximo;
        prFecha = d.fecha;
      }
    });

    // Último peso: el más reciente por fecha
    const datosOrdenados = [...datos].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    const ultimoPeso = datosOrdenados[datosOrdenados.length - 1]?.pesoMaximo || 0;

    // Total sesiones
    const totalSesiones = datos.length;

    // Tendencia: media últimas 3 vs primeras 3
    let tendencia = 'neutral';
    if (datosOrdenados.length >= 3) {
      const primeras3 = datosOrdenados.slice(0, 3);
      const ultimas3 = datosOrdenados.slice(-3);
      const mediaPrimeras = primeras3.reduce((sum, d) => sum + d.pesoMaximo, 0) / primeras3.length;
      const mediaUltimas = ultimas3.reduce((sum, d) => sum + d.pesoMaximo, 0) / ultimas3.length;

      if (mediaUltimas > mediaPrimeras * 1.01) {
        tendencia = 'up';
      } else if (mediaUltimas < mediaPrimeras * 0.99) {
        tendencia = 'down';
      }
    }

    return { prValor, prFecha, ultimoPeso, totalSesiones, tendencia };
  };

  // ==================== Formateo ====================

  const formatearFecha = (fechaStr) => {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatearFechaCorta = (fechaStr) => {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  };

  // ==================== Datos para el gráfico ====================

  const obtenerDatosGrafico = () => {
    const datosOrdenados = [...datos].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    return datosOrdenados.slice(-20); // últimas 20 sesiones
  };

  // ==================== Datos para la tabla ====================

  const obtenerDatosTabla = () => {
    return [...datos].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  };

  // ==================== Renderizado ====================

  const resumen = calcularResumen();
  const datosGrafico = obtenerDatosGrafico();
  const datosTabla = obtenerDatosTabla();
  const maxPeso = datosGrafico.length > 0
    ? Math.max(...datosGrafico.map(d => d.pesoMaximo))
    : 0;

  const contenido = (
    <div style={styles.contenedor}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.titulo}>Progreso: {ejercicioNombre}</h2>
          <p style={styles.subtitulo}>Evolución del rendimiento a lo largo del tiempo</p>
        </div>
        {onClose && (
          <button style={styles.closeBtn} onClick={onClose}>×</button>
        )}
      </div>

      {/* Cargando */}
      {cargando && (
        <div style={styles.estadoCargando}>
          <div style={styles.spinner} />
          <p>Cargando progreso...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={styles.estadoError}>
          <span style={styles.errorIcono}>!</span>
          <p>{error}</p>
          <button style={styles.btnReintentar} onClick={cargarProgreso}>Reintentar</button>
        </div>
      )}

      {/* Sin datos */}
      {!cargando && !error && datos.length === 0 && (
        <div style={styles.estadoVacio}>
          <span style={styles.vacioIcono}>---</span>
          <p style={styles.vacioTexto}>No hay registros de progreso para este ejercicio</p>
          <p style={styles.vacioSubtexto}>Los datos aparecerán aquí cuando se registren entrenamientos con este ejercicio</p>
        </div>
      )}

      {/* Contenido con datos */}
      {!cargando && !error && datos.length > 0 && (
        <>
          {/* Tarjetas de resumen */}
          <div style={styles.tarjetasRow}>
            <div style={{ ...styles.tarjeta, borderTop: '3px solid #10b981' }}>
              <span style={styles.tarjetaLabel}>PR (Récord Personal)</span>
              <span style={{ ...styles.tarjetaValor, color: '#10b981' }}>
                {resumen.prValor} kg
              </span>
              <span style={styles.tarjetaDetalle}>
                {formatearFecha(resumen.prFecha)}
              </span>
            </div>

            <div style={{ ...styles.tarjeta, borderTop: '3px solid #007bff' }}>
              <span style={styles.tarjetaLabel}>Último peso</span>
              <span style={{ ...styles.tarjetaValor, color: '#007bff' }}>
                {resumen.ultimoPeso} kg
              </span>
              <span style={styles.tarjetaDetalle}>Sesión más reciente</span>
            </div>

            <div style={{ ...styles.tarjeta, borderTop: '3px solid #FF6F00' }}>
              <span style={styles.tarjetaLabel}>Total sesiones</span>
              <span style={{ ...styles.tarjetaValor, color: '#FF6F00' }}>
                {resumen.totalSesiones}
              </span>
              <span style={styles.tarjetaDetalle}>Entrenamientos registrados</span>
            </div>

            <div style={{
              ...styles.tarjeta,
              borderTop: `3px solid ${resumen.tendencia === 'up' ? '#10b981' : resumen.tendencia === 'down' ? '#dc3545' : '#999'}`
            }}>
              <span style={styles.tarjetaLabel}>Tendencia</span>
              <span style={{
                ...styles.tarjetaValor,
                color: resumen.tendencia === 'up' ? '#10b981' : resumen.tendencia === 'down' ? '#dc3545' : '#999'
              }}>
                {resumen.tendencia === 'up' ? '\u2191 Subiendo' : resumen.tendencia === 'down' ? '\u2193 Bajando' : '= Estable'}
              </span>
              <span style={styles.tarjetaDetalle}>
                Últimas 3 vs primeras 3 sesiones
              </span>
            </div>
          </div>

          {/* Gráfico de barras */}
          <div style={styles.graficoContenedor}>
            <h3 style={styles.seccionTitulo}>Peso máximo por sesión</h3>
            {datosGrafico.length > 20 && (
              <p style={styles.graficoNota}>Mostrando las últimas 20 sesiones</p>
            )}
            <div style={styles.graficoWrapper}>
              {/* Eje Y - líneas de referencia */}
              <div style={styles.graficoEjeY}>
                <span style={styles.ejeYLabel}>{maxPeso} kg</span>
                <span style={styles.ejeYLabel}>{Math.round(maxPeso * 0.75)} kg</span>
                <span style={styles.ejeYLabel}>{Math.round(maxPeso * 0.5)} kg</span>
                <span style={styles.ejeYLabel}>{Math.round(maxPeso * 0.25)} kg</span>
                <span style={styles.ejeYLabel}>0 kg</span>
              </div>

              {/* Área del gráfico */}
              <div style={styles.graficoArea}>
                {/* Líneas de referencia horizontales */}
                <div style={{ ...styles.lineaRef, top: '0%' }} />
                <div style={{ ...styles.lineaRef, top: '25%' }} />
                <div style={{ ...styles.lineaRef, top: '50%' }} />
                <div style={{ ...styles.lineaRef, top: '75%' }} />
                <div style={{ ...styles.lineaRef, top: '100%' }} />

                {/* Barras */}
                <div style={styles.barrasContenedor}>
                  {datosGrafico.map((sesion, index) => {
                    const porcentaje = maxPeso > 0 ? (sesion.pesoMaximo / maxPeso) * 100 : 0;
                    const esPR = sesion.pesoMaximo === resumen.prValor;

                    return (
                      <div key={index} style={styles.barraColumna}>
                        <div style={styles.barraTooltip}>
                          {sesion.pesoMaximo} kg
                        </div>
                        <div
                          style={{
                            ...styles.barra,
                            height: `${porcentaje}%`,
                            backgroundColor: esPR ? '#10b981' : '#007bff',
                            boxShadow: esPR ? '0 0 8px rgba(117, 183, 96, 0.5)' : 'none'
                          }}
                        >
                          {esPR && <span style={styles.prBadge}>PR</span>}
                        </div>
                        <span style={styles.barraFecha}>
                          {formatearFechaCorta(sesion.fecha)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Tabla de historial */}
          <div style={styles.tablaContenedor}>
            <h3 style={styles.seccionTitulo}>Historial de sesiones</h3>
            <div style={styles.tablaWrapper}>
              <table style={styles.tabla}>
                <thead>
                  <tr>
                    <th style={styles.th}>Fecha</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>Peso Máximo (kg)</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>Volumen Total</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>Series</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>Mejor Serie</th>
                  </tr>
                </thead>
                <tbody>
                  {datosTabla.map((sesion, index) => {
                    const esPR = sesion.pesoMaximo === resumen.prValor;
                    return (
                      <tr
                        key={index}
                        style={{
                          ...styles.tr,
                          backgroundColor: esPR ? 'rgba(117, 183, 96, 0.08)' : index % 2 === 0 ? '#fff' : '#f9fafb'
                        }}
                      >
                        <td style={styles.td}>
                          <span style={styles.fechaCell}>
                            {formatearFecha(sesion.fecha)}
                            {esPR && <span style={styles.prTag}>PR</span>}
                          </span>
                        </td>
                        <td style={{ ...styles.td, textAlign: 'right', fontWeight: esPR ? 700 : 500 }}>
                          {sesion.pesoMaximo}
                        </td>
                        <td style={{ ...styles.td, textAlign: 'right' }}>
                          {sesion.totalVolumen != null ? sesion.totalVolumen.toLocaleString('es-ES') : '-'}
                        </td>
                        <td style={{ ...styles.td, textAlign: 'right' }}>
                          {sesion.series ?? '-'}
                        </td>
                        <td style={{ ...styles.td, textAlign: 'right' }}>
                          {sesion.mejorSerie || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );

  // Si onClose existe, renderizar como modal
  if (onClose) {
    return (
      <div style={styles.overlay} onClick={onClose}>
        <div style={styles.modal} onClick={e => e.stopPropagation()}>
          {contenido}
        </div>
      </div>
    );
  }

  // Renderizar inline
  return contenido;
}

// ==================== Estilos ====================

const styles = {
  // Modal / Overlay
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
    maxWidth: '900px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
  },

  // Contenedor principal
  contenedor: {
    padding: '24px'
  },

  // Header
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px'
  },
  titulo: {
    margin: 0,
    fontSize: '22px',
    fontWeight: 700,
    color: '#1a1a2e'
  },
  subtitulo: {
    margin: '4px 0 0',
    fontSize: '14px',
    color: '#6b7280'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '28px',
    cursor: 'pointer',
    color: '#6b7280',
    lineHeight: 1,
    padding: '0 4px',
    flexShrink: 0
  },

  // Estado: cargando
  estadoCargando: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    color: '#6b7280',
    fontSize: '15px'
  },
  spinner: {
    width: '36px',
    height: '36px',
    border: '3px solid #e5e7eb',
    borderTopColor: '#10b981',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    marginBottom: '16px'
  },

  // Estado: error
  estadoError: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    backgroundColor: '#fef2f2',
    borderRadius: '8px',
    color: '#991b1b',
    fontSize: '14px',
    textAlign: 'center'
  },
  errorIcono: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#dc3545',
    color: '#fff',
    fontSize: '20px',
    fontWeight: 700,
    marginBottom: '12px'
  },
  btnReintentar: {
    marginTop: '12px',
    padding: '8px 20px',
    backgroundColor: '#dc3545',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer'
  },

  // Estado: vacío
  estadoVacio: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    textAlign: 'center'
  },
  vacioIcono: {
    fontSize: '24px',
    color: '#9ca3af',
    marginBottom: '12px',
    letterSpacing: '4px'
  },
  vacioTexto: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#4b5563',
    margin: '0 0 6px'
  },
  vacioSubtexto: {
    fontSize: '13px',
    color: '#9ca3af',
    margin: 0,
    maxWidth: '360px'
  },

  // Tarjetas de resumen
  tarjetasRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '14px',
    marginBottom: '28px'
  },
  tarjeta: {
    display: 'flex',
    flexDirection: 'column',
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '10px',
    gap: '4px'
  },
  tarjetaLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  tarjetaValor: {
    fontSize: '24px',
    fontWeight: 700,
    lineHeight: 1.2
  },
  tarjetaDetalle: {
    fontSize: '12px',
    color: '#9ca3af'
  },

  // Gráfico
  graficoContenedor: {
    marginBottom: '28px'
  },
  seccionTitulo: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1a1a2e',
    margin: '0 0 4px'
  },
  graficoNota: {
    fontSize: '12px',
    color: '#9ca3af',
    margin: '0 0 12px'
  },
  graficoWrapper: {
    display: 'flex',
    alignItems: 'stretch',
    marginTop: '12px',
    height: '260px'
  },
  graficoEjeY: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingRight: '10px',
    width: '60px',
    flexShrink: 0
  },
  ejeYLabel: {
    fontSize: '11px',
    color: '#9ca3af',
    textAlign: 'right',
    lineHeight: 1
  },
  graficoArea: {
    flex: 1,
    position: 'relative',
    borderLeft: '1px solid #e5e7eb',
    borderBottom: '1px solid #e5e7eb'
  },
  lineaRef: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: '1px',
    backgroundColor: '#f3f4f6',
    pointerEvents: 'none'
  },
  barrasContenedor: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: '100%',
    padding: '0 8px',
    position: 'relative',
    zIndex: 1
  },
  barraColumna: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
    maxWidth: '40px',
    height: '100%',
    justifyContent: 'flex-end',
    position: 'relative'
  },
  barraTooltip: {
    fontSize: '10px',
    fontWeight: 600,
    color: '#4b5563',
    marginBottom: '4px',
    whiteSpace: 'nowrap'
  },
  barra: {
    width: '70%',
    minHeight: '4px',
    borderRadius: '4px 4px 0 0',
    transition: 'height 0.4s ease',
    position: 'relative'
  },
  prBadge: {
    position: 'absolute',
    top: '-18px',
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: '9px',
    fontWeight: 700,
    color: '#fff',
    backgroundColor: '#10b981',
    padding: '1px 5px',
    borderRadius: '3px',
    whiteSpace: 'nowrap'
  },
  barraFecha: {
    fontSize: '9px',
    color: '#9ca3af',
    marginTop: '6px',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '100%'
  },

  // Tabla
  tablaContenedor: {
    marginBottom: '8px'
  },
  tablaWrapper: {
    marginTop: '12px',
    overflowX: 'auto',
    borderRadius: '8px',
    border: '1px solid #e5e7eb'
  },
  tabla: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px'
  },
  th: {
    padding: '12px 14px',
    backgroundColor: '#1a1a2e',
    color: '#fff',
    fontWeight: 600,
    fontSize: '13px',
    textAlign: 'left',
    whiteSpace: 'nowrap'
  },
  tr: {
    transition: 'background-color 0.15s'
  },
  td: {
    padding: '10px 14px',
    borderBottom: '1px solid #f3f4f6',
    color: '#374151',
    whiteSpace: 'nowrap'
  },
  fechaCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  prTag: {
    display: 'inline-block',
    fontSize: '10px',
    fontWeight: 700,
    color: '#fff',
    backgroundColor: '#10b981',
    padding: '1px 6px',
    borderRadius: '3px'
  }
};

// Inyectar keyframe de animación para el spinner
if (typeof document !== 'undefined') {
  const styleEl = document.getElementById('progreso-ejercicio-keyframes');
  if (!styleEl) {
    const style = document.createElement('style');
    style.id = 'progreso-ejercicio-keyframes';
    style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
    document.head.appendChild(style);
  }
}

export default ProgresoEjercicio;
