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

  // Para calcular precio
  const [calculadora, setCalculadora] = useState({
    tipo: 'individual',
    diasSemana: 1,
    resultado: null
  });

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
                {[1, 2, 3, 4, 5, 6, 7].map(d => (
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

      {/* Info de uso */}
      <div style={styles.infoSection}>
        <h3>Información</h3>
        <ul style={styles.infoList}>
          <li>Los precios se aplican por sesión individual</li>
          <li>El rango de días determina el precio: 1 día, 2 días o 3+ días por semana</li>
          <li>Los productos inactivos no aparecerán en las consultas de facturación</li>
          <li>Modifica los precios sin tocar código usando el botón "Editar"</li>
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
  }
};

export default Productos;
