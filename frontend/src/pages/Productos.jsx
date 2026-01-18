import { useState, useEffect } from 'react';
import { productosAPI } from '../services/api';

const Productos = () => {
  const [tablaPrecios, setTablaPrecios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [editando, setEditando] = useState(null);
  const [preciosEditados, setPreciosEditados] = useState({});
  const [mostrarInactivos, setMostrarInactivos] = useState(false);

  // Para calcular precio unitario
  const [calculadora, setCalculadora] = useState({
    tipo: 'individual',
    diasSemana: 1,
    resultado: null
  });

  // Para calcular coste mensual
  const [calculadoraMensual, setCalculadoraMensual] = useState({
    tipo: 'individual',
    mes: new Date().getMonth(),
    anio: new Date().getFullYear(),
    diasSeleccionados: [], // 0=Lunes, 1=Martes, etc.
    modoManual: false, // true = introducir sesiones manualmente
    sesionesManual: '',
    diasSemanaManual: 1, // para calcular el precio unitario en modo manual
    resultado: null
  });

  const nombresDias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Función para contar cuántas veces cae cada día de la semana en un mes
  const contarDiasEnMes = (anio, mes, diasSemana) => {
    const primerDia = new Date(anio, mes, 1);
    const ultimoDia = new Date(anio, mes + 1, 0);
    const totalDias = ultimoDia.getDate();

    let conteo = {};
    diasSemana.forEach(d => conteo[d] = 0);

    for (let dia = 1; dia <= totalDias; dia++) {
      const fecha = new Date(anio, mes, dia);
      // getDay() devuelve 0=Domingo, 1=Lunes, etc.
      // Convertimos a 0=Lunes, 1=Martes, etc.
      const diaSemana = (fecha.getDay() + 6) % 7;
      if (diasSemana.includes(diaSemana)) {
        conteo[diaSemana]++;
      }
    }

    return conteo;
  };

  const handleToggleDia = (diaIndex) => {
    setCalculadoraMensual(prev => {
      const nuevos = prev.diasSeleccionados.includes(diaIndex)
        ? prev.diasSeleccionados.filter(d => d !== diaIndex)
        : [...prev.diasSeleccionados, diaIndex].sort((a, b) => a - b);
      return { ...prev, diasSeleccionados: nuevos, resultado: null };
    });
  };

  const handleCalcularMensual = async () => {
    // Validación según modo
    if (calculadoraMensual.modoManual) {
      const sesiones = parseInt(calculadoraMensual.sesionesManual);
      if (!sesiones || sesiones <= 0) {
        setError('Introduce un número de sesiones válido');
        return;
      }
    } else {
      if (calculadoraMensual.diasSeleccionados.length === 0) {
        setError('Selecciona al menos un día de la semana');
        return;
      }
    }

    try {
      // Obtener precio unitario según cantidad de días por semana
      const diasParaPrecio = calculadoraMensual.modoManual
        ? calculadoraMensual.diasSemanaManual
        : calculadoraMensual.diasSeleccionados.length;

      const { data } = await productosAPI.obtenerPrecio({
        tipo: calculadoraMensual.tipo,
        dias_semana: diasParaPrecio
      });

      let totalSesiones, desglose;

      if (calculadoraMensual.modoManual) {
        // Modo manual: usar el número introducido
        totalSesiones = parseInt(calculadoraMensual.sesionesManual);
        desglose = null;
      } else {
        // Modo automático: contar sesiones en el mes
        const conteo = contarDiasEnMes(
          calculadoraMensual.anio,
          calculadoraMensual.mes,
          calculadoraMensual.diasSeleccionados
        );
        totalSesiones = Object.values(conteo).reduce((a, b) => a + b, 0);
        desglose = conteo;
      }

      const totalMes = totalSesiones * data.precio;

      setCalculadoraMensual(prev => ({
        ...prev,
        resultado: {
          producto: data.producto_nombre,
          precioUnitario: data.precio,
          rangoAplicado: data.rango_aplicado,
          desglose,
          totalSesiones,
          totalMes
        }
      }));
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al calcular precio mensual');
      setCalculadoraMensual(prev => ({ ...prev, resultado: null }));
    }
  };

  const tiposProducto = {
    individual: 'Sesión Individual',
    individual_express: 'Sesión Individual Express',
    pareja: 'Sesión en Pareja',
    pareja_express: 'Sesión en Pareja Express'
  };

  useEffect(() => {
    cargarTablaPrecios();
  }, [mostrarInactivos]);

  const cargarTablaPrecios = async () => {
    try {
      setLoading(true);
      const { data } = await productosAPI.obtenerTablaPrecios(!mostrarInactivos);
      setTablaPrecios(data);
    } catch (err) {
      if (err.response?.status === 404 || (Array.isArray(err.response?.data) && err.response.data.length === 0)) {
        setTablaPrecios([]);
      } else {
        setError('Error al cargar productos');
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInicializar = async () => {
    if (!window.confirm('¿Crear los productos y tarifas por defecto? Esta acción solo funciona si no hay productos existentes.')) {
      return;
    }

    try {
      setLoading(true);
      await productosAPI.inicializar();
      setMensaje('Productos y tarifas inicializados correctamente');
      cargarTablaPrecios();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al inicializar productos');
    } finally {
      setLoading(false);
    }
  };

  const handleEditarProducto = (producto) => {
    setEditando(producto._id);
    setPreciosEditados({
      '1': producto.precios['1'] || '',
      '2': producto.precios['2'] || '',
      '3+': producto.precios['3+'] || ''
    });
  };

  const handleCancelarEdicion = () => {
    setEditando(null);
    setPreciosEditados({});
  };

  const handleGuardarPrecios = async (productoId) => {
    try {
      const tarifas = [
        { rangoDias: '1', precio: parseFloat(preciosEditados['1']) || 0 },
        { rangoDias: '2', precio: parseFloat(preciosEditados['2']) || 0 },
        { rangoDias: '3+', precio: parseFloat(preciosEditados['3+']) || 0 }
      ];

      await productosAPI.guardarTodasTarifas(productoId, tarifas);
      setMensaje('Precios actualizados correctamente');
      setEditando(null);
      cargarTablaPrecios();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al guardar precios');
    }
  };

  const handleToggleActivo = async (producto) => {
    try {
      await productosAPI.actualizar(producto._id, { activo: !producto.activo });
      setMensaje(`Producto ${producto.activo ? 'desactivado' : 'activado'} correctamente`);
      cargarTablaPrecios();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al cambiar estado');
    }
  };

  const handleCalcularPrecio = async () => {
    try {
      const { data } = await productosAPI.obtenerPrecio({
        tipo: calculadora.tipo,
        dias_semana: calculadora.diasSemana
      });
      setCalculadora(prev => ({ ...prev, resultado: data }));
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al calcular precio');
      setCalculadora(prev => ({ ...prev, resultado: null }));
    }
  };

  if (loading && tablaPrecios.length === 0) {
    return <div style={styles.loading}>Cargando productos...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Productos y Tarifas</h1>
          <p style={styles.subtitle}>Gestión de servicios y precios por días/semana</p>
        </div>
        {tablaPrecios.length === 0 && (
          <button onClick={handleInicializar} style={styles.initButton}>
            Inicializar Productos
          </button>
        )}
      </div>

      {error && (
        <div style={styles.error}>
          {error}
          <button onClick={() => setError('')} style={styles.closeAlert}>×</button>
        </div>
      )}

      {mensaje && (
        <div style={styles.success}>
          {mensaje}
          <button onClick={() => setMensaje('')} style={styles.closeAlert}>×</button>
        </div>
      )}

      {/* Tabla de precios */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Tabla de Precios</h2>
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={mostrarInactivos}
              onChange={(e) => setMostrarInactivos(e.target.checked)}
            />
            Mostrar inactivos
          </label>
        </div>

        {tablaPrecios.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No hay productos configurados.</p>
            <p>Haz clic en "Inicializar Productos" para crear los servicios y tarifas por defecto.</p>
          </div>
        ) : (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Producto</th>
                  <th style={styles.th}>Tipo</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>1 día/sem</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>2 días/sem</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>3+ días/sem</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>Estado</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tablaPrecios.map((producto) => (
                  <tr key={producto._id} style={!producto.activo ? styles.rowInactivo : {}}>
                    <td style={styles.td}>
                      <div style={styles.productoNombre}>{producto.nombre}</div>
                      {producto.descripcion && (
                        <div style={styles.productoDesc}>{producto.descripcion}</div>
                      )}
                    </td>
                    <td style={styles.td}>
                      <span style={styles.tipoBadge}>{producto.tipo}</span>
                    </td>

                    {editando === producto._id ? (
                      <>
                        <td style={{ ...styles.td, textAlign: 'center' }}>
                          <input
                            type="number"
                            value={preciosEditados['1']}
                            onChange={(e) => setPreciosEditados({ ...preciosEditados, '1': e.target.value })}
                            style={styles.precioInput}
                            step="0.01"
                            min="0"
                          />
                        </td>
                        <td style={{ ...styles.td, textAlign: 'center' }}>
                          <input
                            type="number"
                            value={preciosEditados['2']}
                            onChange={(e) => setPreciosEditados({ ...preciosEditados, '2': e.target.value })}
                            style={styles.precioInput}
                            step="0.01"
                            min="0"
                          />
                        </td>
                        <td style={{ ...styles.td, textAlign: 'center' }}>
                          <input
                            type="number"
                            value={preciosEditados['3+']}
                            onChange={(e) => setPreciosEditados({ ...preciosEditados, '3+': e.target.value })}
                            style={styles.precioInput}
                            step="0.01"
                            min="0"
                          />
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ ...styles.td, textAlign: 'center' }}>
                          <span style={styles.precio}>
                            {producto.precios['1'] !== null ? `${producto.precios['1']}€` : '-'}
                          </span>
                        </td>
                        <td style={{ ...styles.td, textAlign: 'center' }}>
                          <span style={styles.precio}>
                            {producto.precios['2'] !== null ? `${producto.precios['2']}€` : '-'}
                          </span>
                        </td>
                        <td style={{ ...styles.td, textAlign: 'center' }}>
                          <span style={styles.precio}>
                            {producto.precios['3+'] !== null ? `${producto.precios['3+']}€` : '-'}
                          </span>
                        </td>
                      </>
                    )}

                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <span style={{
                        ...styles.estadoBadge,
                        backgroundColor: producto.activo ? '#d4edda' : '#f8d7da',
                        color: producto.activo ? '#155724' : '#721c24'
                      }}>
                        {producto.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>

                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      {editando === producto._id ? (
                        <div style={styles.actionButtons}>
                          <button
                            onClick={() => handleGuardarPrecios(producto._id)}
                            style={styles.saveButton}
                          >
                            Guardar
                          </button>
                          <button
                            onClick={handleCancelarEdicion}
                            style={styles.cancelButton}
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div style={styles.actionButtons}>
                          <button
                            onClick={() => handleEditarProducto(producto)}
                            style={styles.editButton}
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleToggleActivo(producto)}
                            style={producto.activo ? styles.deactivateButton : styles.activateButton}
                          >
                            {producto.activo ? 'Desactivar' : 'Activar'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Calculadora de precios */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Calculadora de Precios</h2>
        <p style={styles.sectionDesc}>
          Consulta el precio unitario según tipo de servicio y días por semana
        </p>

        <div style={styles.calculadoraContainer}>
          <div style={styles.calculadoraForm}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Tipo de Servicio</label>
              <select
                value={calculadora.tipo}
                onChange={(e) => setCalculadora({ ...calculadora, tipo: e.target.value, resultado: null })}
                style={styles.select}
              >
                {Object.entries(tiposProducto).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Días por Semana</label>
              <select
                value={calculadora.diasSemana}
                onChange={(e) => setCalculadora({ ...calculadora, diasSemana: parseInt(e.target.value), resultado: null })}
                style={styles.select}
              >
                {[1, 2, 3, 4, 5].map(d => (
                  <option key={d} value={d}>{d} {d === 1 ? 'día' : 'días'}</option>
                ))}
              </select>
            </div>

            <button onClick={handleCalcularPrecio} style={styles.calcButton}>
              Calcular Precio
            </button>
          </div>

          {calculadora.resultado && (
            <div style={styles.resultadoContainer}>
              <div style={styles.resultadoHeader}>Resultado</div>
              <div style={styles.resultadoBody}>
                <div style={styles.resultadoRow}>
                  <span>Producto:</span>
                  <strong>{calculadora.resultado.producto_nombre}</strong>
                </div>
                <div style={styles.resultadoRow}>
                  <span>Días/semana:</span>
                  <strong>{calculadora.resultado.dias_semana}</strong>
                </div>
                <div style={styles.resultadoRow}>
                  <span>Rango aplicado:</span>
                  <strong>{calculadora.resultado.rango_aplicado}</strong>
                </div>
                <div style={styles.resultadoPrecio}>
                  <span>Precio unitario:</span>
                  <span style={styles.precioGrande}>{calculadora.resultado.precio}€</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Calculadora mensual */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Calculadora Mensual</h2>
        <p style={styles.sectionDesc}>
          Calcula el coste total del mes según los días de entrenamiento
        </p>

        <div style={styles.mensualContainer}>
          <div style={styles.mensualForm}>
            {/* Tipo de servicio */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Tipo de Servicio</label>
              <select
                value={calculadoraMensual.tipo}
                onChange={(e) => setCalculadoraMensual({ ...calculadoraMensual, tipo: e.target.value, resultado: null })}
                style={styles.select}
              >
                {Object.entries(tiposProducto).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </select>
            </div>

            {/* Toggle modo manual */}
            <div style={styles.modoToggleContainer}>
              <button
                type="button"
                onClick={() => setCalculadoraMensual({ ...calculadoraMensual, modoManual: false, resultado: null })}
                style={{
                  ...styles.modoToggleBtn,
                  ...(calculadoraMensual.modoManual ? {} : styles.modoToggleBtnActivo)
                }}
              >
                Por días del calendario
              </button>
              <button
                type="button"
                onClick={() => setCalculadoraMensual({ ...calculadoraMensual, modoManual: true, resultado: null })}
                style={{
                  ...styles.modoToggleBtn,
                  ...(calculadoraMensual.modoManual ? styles.modoToggleBtnActivo : {})
                }}
              >
                Introducir sesiones
              </button>
            </div>

            {!calculadoraMensual.modoManual ? (
              <>
                {/* Mes y Año */}
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Mes</label>
                    <select
                      value={calculadoraMensual.mes}
                      onChange={(e) => setCalculadoraMensual({ ...calculadoraMensual, mes: parseInt(e.target.value), resultado: null })}
                      style={styles.select}
                    >
                      {nombresMeses.map((nombre, index) => (
                        <option key={index} value={index}>{nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Año</label>
                    <select
                      value={calculadoraMensual.anio}
                      onChange={(e) => setCalculadoraMensual({ ...calculadoraMensual, anio: parseInt(e.target.value), resultado: null })}
                      style={styles.selectSmall}
                    >
                      {[2024, 2025, 2026, 2027].map(a => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Días de la semana */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>Días de entrenamiento (selecciona los días)</label>
                  <div style={styles.diasContainer}>
                    {nombresDias.slice(0, 5).map((nombre, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleToggleDia(index)}
                        style={{
                          ...styles.diaButton,
                          ...(calculadoraMensual.diasSeleccionados.includes(index) ? styles.diaButtonActivo : {})
                        }}
                      >
                        {nombre.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                  {calculadoraMensual.diasSeleccionados.length > 0 && (
                    <div style={styles.diasResumen}>
                      {calculadoraMensual.diasSeleccionados.length} día{calculadoraMensual.diasSeleccionados.length > 1 ? 's' : ''}/semana: {calculadoraMensual.diasSeleccionados.map(d => nombresDias[d]).join(', ')}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Modo manual: introducir número de sesiones */}
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Número de sesiones</label>
                    <input
                      type="number"
                      value={calculadoraMensual.sesionesManual}
                      onChange={(e) => setCalculadoraMensual({ ...calculadoraMensual, sesionesManual: e.target.value, resultado: null })}
                      placeholder="Ej: 8"
                      style={styles.inputManual}
                      min="1"
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Días/semana (para precio)</label>
                    <select
                      value={calculadoraMensual.diasSemanaManual}
                      onChange={(e) => setCalculadoraMensual({ ...calculadoraMensual, diasSemanaManual: parseInt(e.target.value), resultado: null })}
                      style={styles.selectSmall}
                    >
                      {[1, 2, 3, 4, 5].map(d => (
                        <option key={d} value={d}>{d} día{d > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={styles.modoManualInfo}>
                  El precio unitario se calcula según los días/semana seleccionados
                </div>
              </>
            )}

            <button onClick={handleCalcularMensual} style={styles.calcButton}>
              Calcular Total
            </button>
          </div>

          {/* Resultado mensual */}
          {calculadoraMensual.resultado && (
            <div style={styles.resultadoMensualContainer}>
              <div style={styles.resultadoHeader}>
                {calculadoraMensual.modoManual
                  ? 'Cálculo Manual'
                  : `${nombresMeses[calculadoraMensual.mes]} ${calculadoraMensual.anio}`
                }
              </div>
              <div style={styles.resultadoBody}>
                <div style={styles.resultadoRow}>
                  <span>Producto:</span>
                  <strong>{calculadoraMensual.resultado.producto}</strong>
                </div>
                <div style={styles.resultadoRow}>
                  <span>Precio/sesión ({calculadoraMensual.resultado.rangoAplicado}):</span>
                  <strong>{calculadoraMensual.resultado.precioUnitario}€</strong>
                </div>

                {calculadoraMensual.resultado.desglose && (
                  <div style={styles.desgloseContainer}>
                    <div style={styles.desgloseTitle}>Desglose de sesiones:</div>
                    {Object.entries(calculadoraMensual.resultado.desglose).map(([diaIndex, cantidad]) => (
                      <div key={diaIndex} style={styles.desgloseRow}>
                        <span>{nombresDias[diaIndex]}:</span>
                        <span>{cantidad} sesiones</span>
                      </div>
                    ))}
                  </div>
                )}

                <div style={styles.resultadoRow}>
                  <span>Total sesiones:</span>
                  <strong>{calculadoraMensual.resultado.totalSesiones}</strong>
                </div>

                <div style={styles.resultadoTotal}>
                  <span>TOTAL:</span>
                  <span style={styles.precioGrande}>{calculadoraMensual.resultado.totalMes.toFixed(2)}€</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info de uso */}
      <div style={styles.infoSection}>
        <h3>Información</h3>
        <ul style={styles.infoList}>
          <li>Los precios se aplican por sesión individual</li>
          <li>El rango de días determina el precio: 1 día, 2 días o 3+ días por semana</li>
          <li>La calculadora mensual cuenta las sesiones reales según el calendario del mes</li>
          <li>Los productos inactivos no aparecerán en las consultas de facturación</li>
        </ul>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '25px',
    flexWrap: 'wrap',
    gap: '15px'
  },
  title: {
    margin: 0,
    color: '#1a365d'
  },
  subtitle: {
    color: '#666',
    marginTop: '5px',
    marginBottom: 0
  },
  initButton: {
    backgroundColor: '#c41e3a',
    color: '#fff',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600'
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
  success: {
    backgroundColor: '#d4edda',
    color: '#155724',
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
  section: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '25px',
    marginBottom: '25px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '10px'
  },
  sectionTitle: {
    margin: 0,
    fontSize: '18px',
    color: '#1a365d'
  },
  sectionDesc: {
    color: '#666',
    marginTop: '5px',
    marginBottom: '20px'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#666'
  },
  tableContainer: {
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '700px'
  },
  th: {
    backgroundColor: '#1a365d',
    color: '#fff',
    padding: '12px 15px',
    textAlign: 'left',
    fontWeight: '600',
    fontSize: '13px'
  },
  td: {
    padding: '15px',
    borderBottom: '1px solid #eee',
    verticalAlign: 'middle'
  },
  rowInactivo: {
    opacity: 0.6,
    backgroundColor: '#f8f9fa'
  },
  productoNombre: {
    fontWeight: '600',
    marginBottom: '3px'
  },
  productoDesc: {
    fontSize: '12px',
    color: '#666'
  },
  tipoBadge: {
    backgroundColor: '#e9ecef',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontFamily: 'monospace'
  },
  precio: {
    fontWeight: '600',
    fontSize: '16px',
    color: '#c41e3a'
  },
  precioInput: {
    width: '80px',
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    textAlign: 'center'
  },
  estadoBadge: {
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500'
  },
  actionButtons: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  editButton: {
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  saveButton: {
    backgroundColor: '#28a745',
    color: '#fff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    color: '#fff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  activateButton: {
    backgroundColor: '#28a745',
    color: '#fff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  deactivateButton: {
    backgroundColor: '#dc3545',
    color: '#fff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  calculadoraContainer: {
    display: 'flex',
    gap: '30px',
    flexWrap: 'wrap'
  },
  calculadoraForm: {
    display: 'flex',
    gap: '15px',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    flex: 1
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  label: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#333'
  },
  select: {
    padding: '10px 15px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontSize: '14px',
    minWidth: '180px'
  },
  calcButton: {
    backgroundColor: '#c41e3a',
    color: '#fff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    height: '42px'
  },
  resultadoContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    overflow: 'hidden',
    minWidth: '280px'
  },
  resultadoHeader: {
    backgroundColor: '#1a365d',
    color: '#fff',
    padding: '10px 15px',
    fontWeight: '600'
  },
  resultadoBody: {
    padding: '15px'
  },
  resultadoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    fontSize: '14px'
  },
  resultadoPrecio: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '15px',
    paddingTop: '15px',
    borderTop: '2px solid #ddd'
  },
  precioGrande: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#c41e3a'
  },
  infoSection: {
    backgroundColor: '#e7f3ff',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px'
  },
  infoList: {
    margin: 0,
    paddingLeft: '20px',
    lineHeight: '1.8'
  },
  // Estilos calculadora mensual
  mensualContainer: {
    display: 'flex',
    gap: '30px',
    flexWrap: 'wrap',
    alignItems: 'flex-start'
  },
  mensualForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    flex: 1,
    minWidth: '300px'
  },
  formRow: {
    display: 'flex',
    gap: '15px',
    flexWrap: 'wrap'
  },
  selectSmall: {
    padding: '10px 15px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontSize: '14px',
    minWidth: '100px'
  },
  diasContainer: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    marginTop: '8px'
  },
  diaButton: {
    padding: '10px 16px',
    border: '2px solid #ddd',
    borderRadius: '8px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease'
  },
  diaButtonActivo: {
    backgroundColor: '#75b760',
    borderColor: '#75b760',
    color: '#fff'
  },
  diasResumen: {
    marginTop: '10px',
    fontSize: '13px',
    color: '#666',
    fontStyle: 'italic'
  },
  resultadoMensualContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    overflow: 'hidden',
    minWidth: '320px',
    maxWidth: '400px'
  },
  desgloseContainer: {
    backgroundColor: '#fff',
    borderRadius: '6px',
    padding: '12px',
    marginTop: '10px',
    marginBottom: '10px'
  },
  desgloseTitle: {
    fontSize: '13px',
    fontWeight: '600',
    marginBottom: '8px',
    color: '#333'
  },
  desgloseRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    padding: '4px 0',
    color: '#555'
  },
  resultadoTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '15px',
    paddingTop: '15px',
    borderTop: '3px solid #75b760',
    fontWeight: '600'
  },
  // Toggle modo calendario/manual
  modoToggleContainer: {
    display: 'flex',
    gap: '0',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '1px solid #ddd',
    backgroundColor: '#f5f5f5'
  },
  modoToggleBtn: {
    flex: 1,
    padding: '10px 16px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: '#666',
    transition: 'all 0.2s ease'
  },
  modoToggleBtnActivo: {
    backgroundColor: '#75b760',
    color: '#fff'
  },
  inputManual: {
    padding: '10px 15px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontSize: '14px',
    width: '120px'
  },
  modoManualInfo: {
    fontSize: '13px',
    color: '#666',
    fontStyle: 'italic',
    backgroundColor: '#f8f9fa',
    padding: '10px 12px',
    borderRadius: '6px',
    borderLeft: '3px solid #75b760'
  }
};

export default Productos;
