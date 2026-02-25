import { useState, useEffect } from 'react';
import { useClienteAuth } from '../../context/ClienteAuthContext';
import { ClipboardList, Download } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function MiSuscripcion() {
  const { cliente } = useClienteAuth();
  const [suscripcion, setSuscripcion] = useState(null);
  const [facturas, setFacturas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarDatos();
  }, [cliente]);

  const cargarDatos = async () => {
    if (!cliente?._id) return;

    try {
      setCargando(true);
      const token = localStorage.getItem('clienteToken');

      // Cargar suscripción
      const suscripcionRes = await fetch(`${API_URL}/cliente-portal/mi-suscripcion`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (suscripcionRes.ok) {
        const suscripcionData = await suscripcionRes.json();
        setSuscripcion(suscripcionData);
      }

      // Cargar facturas
      const facturasRes = await fetch(`${API_URL}/cliente-portal/mis-facturas`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (facturasRes.ok) {
        const facturasData = await facturasRes.json();
        setFacturas(facturasData);
      }
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('No se pudieron cargar los datos de suscripción.');
    } finally {
      setCargando(false);
    }
  };

  const descargarFactura = async (facturaId) => {
    try {
      const token = localStorage.getItem('clienteToken');
      const response = await fetch(`${API_URL}/facturacion/facturas/${facturaId}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Error al descargar');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `factura-${facturaId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error al descargar factura:', err);
      alert('No se pudo descargar la factura');
    }
  };

  const getEstadoSuscripcion = (estado) => {
    switch (estado) {
      case 'activa':
        return { texto: 'Activa', color: '#4caf50', bg: '#e8f5e9' };
      case 'pausada':
        return { texto: 'Pausada', color: '#ff9800', bg: '#fff3e0' };
      case 'cancelada':
        return { texto: 'Cancelada', color: '#f44336', bg: '#ffebee' };
      default:
        return { texto: estado, color: '#666', bg: '#f5f5f5' };
    }
  };

  const getEstadoFactura = (estado) => {
    switch (estado) {
      case 'pagada':
        return { texto: 'Pagada', color: '#4caf50', bg: '#e8f5e9' };
      case 'pendiente':
        return { texto: 'Pendiente', color: '#ff9800', bg: '#fff3e0' };
      case 'vencida':
        return { texto: 'Vencida', color: '#f44336', bg: '#ffebee' };
      default:
        return { texto: estado, color: '#666', bg: '#f5f5f5' };
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (cargando) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Cargando suscripción...</div>
      </div>
    );
  }

  const estadoSuscripcion = suscripcion ? getEstadoSuscripcion(suscripcion.estado) : null;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Mi Suscripción</h1>
          <p style={styles.subtitle}>Plan actual y facturas</p>
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {/* Información de la suscripción */}
      <div style={styles.suscripcionCard}>
        {suscripcion ? (
          <>
            <div style={styles.suscripcionHeader}>
              <div>
                <h2 style={styles.planNombre}>
                  {suscripcion.producto?.nombre || 'Plan de entrenamiento'}
                </h2>
                <span
                  style={{
                    ...styles.estadoBadge,
                    backgroundColor: estadoSuscripcion.bg,
                    color: estadoSuscripcion.color
                  }}
                >
                  {estadoSuscripcion.texto}
                </span>
              </div>
              <div style={styles.planPrecio}>
                <span style={styles.precioValor}>
                  {suscripcion.precio ? `${suscripcion.precio}€` : '-'}
                </span>
                <span style={styles.precioPeriodo}>/mes</span>
              </div>
            </div>
            <div style={styles.suscripcionDetails}>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Sesiones contratadas</span>
                <span style={styles.detailValue}>
                  {suscripcion.sesionesContratadas || '-'}
                </span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Sesiones usadas este mes</span>
                <span style={styles.detailValue}>
                  {suscripcion.sesionesUsadas || 0}
                </span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Próximo pago</span>
                <span style={styles.detailValue}>
                  {suscripcion.proximoPago
                    ? formatearFecha(suscripcion.proximoPago)
                    : '-'}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div style={styles.noSuscripcion}>
            <span style={styles.noSuscripcionIcon}><ClipboardList size={48} /></span>
            <h3 style={styles.noSuscripcionTitle}>Sin suscripción activa</h3>
            <p style={styles.noSuscripcionText}>
              Contacta con el centro para contratar un plan de entrenamiento.
            </p>
          </div>
        )}
      </div>

      {/* Historial de facturas */}
      <div style={styles.facturasSection}>
        <h2 style={styles.sectionTitle}>Mis Facturas</h2>

        {facturas.length === 0 ? (
          <div style={styles.emptyFacturas}>
            <p>No tienes facturas registradas.</p>
          </div>
        ) : (
          <div style={styles.facturasList}>
            {facturas.map((factura) => {
              const estadoFactura = getEstadoFactura(factura.estado);
              return (
                <div key={factura._id} style={styles.facturaCard}>
                  <div style={styles.facturaInfo}>
                    <div style={styles.facturaNumero}>
                      Factura #{factura.numero || factura._id.slice(-6)}
                    </div>
                    <div style={styles.facturaFecha}>
                      {formatearFecha(factura.fecha)}
                    </div>
                  </div>
                  <div style={styles.facturaImporte}>
                    {factura.total?.toFixed(2) || '0.00'}€
                  </div>
                  <span
                    style={{
                      ...styles.estadoBadge,
                      backgroundColor: estadoFactura.bg,
                      color: estadoFactura.color
                    }}
                  >
                    {estadoFactura.texto}
                  </span>
                  <button
                    style={styles.descargarBtn}
                    onClick={() => descargarFactura(factura._id)}
                    title="Descargar PDF"
                  >
                    <Download size={20} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '800px',
    margin: '0 auto'
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '300px',
    fontSize: '18px',
    color: '#666'
  },
  header: {
    marginBottom: '24px'
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: '8px',
    fontFamily: 'Inter, sans-serif'
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    fontFamily: 'Inter, sans-serif'
  },
  error: {
    padding: '14px',
    backgroundColor: '#fee',
    color: '#c00',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px'
  },
  suscripcionCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    marginBottom: '32px',
    border: '1px solid #e4e4e9'
  },
  suscripcionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px'
  },
  planNombre: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: '8px',
    fontFamily: 'Inter, sans-serif'
  },
  estadoBadge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600'
  },
  planPrecio: {
    textAlign: 'right'
  },
  precioValor: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#10b981'
  },
  precioPeriodo: {
    fontSize: '16px',
    color: '#888'
  },
  suscripcionDetails: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px',
    padding: '16px 0',
    borderTop: '1px solid #e4e4e9'
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  detailLabel: {
    fontSize: '13px',
    color: '#888'
  },
  detailValue: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1a1a2e'
  },
  noSuscripcion: {
    textAlign: 'center',
    padding: '32px'
  },
  noSuscripcionIcon: {
    fontSize: '48px',
    marginBottom: '16px',
    display: 'block'
  },
  noSuscripcionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: '8px'
  },
  noSuscripcionText: {
    fontSize: '14px',
    color: '#666'
  },
  facturasSection: {
    marginTop: '8px'
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: '16px',
    fontFamily: 'Inter, sans-serif'
  },
  emptyFacturas: {
    textAlign: 'center',
    padding: '32px',
    backgroundColor: 'white',
    borderRadius: '12px',
    color: '#666'
  },
  facturasList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  facturaCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    backgroundColor: 'white',
    padding: '16px 20px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    border: '1px solid #e4e4e9'
  },
  facturaInfo: {
    flex: 1
  },
  facturaNumero: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: '4px'
  },
  facturaFecha: {
    fontSize: '13px',
    color: '#888'
  },
  facturaImporte: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1a1a2e'
  },
  descargarBtn: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '8px',
    transition: 'background-color 0.2s'
  }
};

export default MiSuscripcion;
