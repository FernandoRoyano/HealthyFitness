import { useState, useEffect } from 'react';
import { useClienteAuth } from '../../context/ClienteAuthContext';
import { Scale, Ruler, BarChart3, Dumbbell, ClipboardList } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function MiProgreso() {
  const { cliente } = useClienteAuth();
  const [mediciones, setMediciones] = useState([]);
  const [ultimaMedicion, setUltimaMedicion] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarMediciones();
  }, [cliente]);

  const cargarMediciones = async () => {
    if (!cliente?._id) return;

    try {
      setCargando(true);
      const token = localStorage.getItem('clienteToken');
      const response = await fetch(`${API_URL}/cliente-portal/mis-mediciones`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar mediciones');
      }

      const data = await response.json();
      setMediciones(data);
      if (data.length > 0) {
        setUltimaMedicion(data[0]);
      }
    } catch (err) {
      console.error('Error al cargar mediciones:', err);
      setError('No se pudieron cargar las mediciones.');
      setMediciones([]);
    } finally {
      setCargando(false);
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const calcularIMC = (peso, altura) => {
    if (!peso || !altura) return null;
    const alturaMetros = altura / 100;
    return (peso / (alturaMetros * alturaMetros)).toFixed(1);
  };

  const getIMCCategoria = (imc) => {
    if (!imc) return { texto: '-', color: '#666' };
    if (imc < 18.5) return { texto: 'Bajo peso', color: '#2196f3' };
    if (imc < 25) return { texto: 'Normal', color: '#4caf50' };
    if (imc < 30) return { texto: 'Sobrepeso', color: '#ff9800' };
    return { texto: 'Obesidad', color: '#f44336' };
  };

  if (cargando) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Cargando datos...</div>
      </div>
    );
  }

  const imcActual = ultimaMedicion
    ? calcularIMC(ultimaMedicion.peso, cliente?.altura || ultimaMedicion.altura)
    : null;
  const imcCategoria = getIMCCategoria(imcActual);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Mi Progreso</h1>
          <p style={styles.subtitle}>Seguimiento de mediciones corporales</p>
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {/* Tarjetas de métricas principales */}
      <div style={styles.metricsGrid}>
        <div style={styles.metricCard}>
          <span style={styles.metricIcon}><Scale size={32} /></span>
          <div style={styles.metricInfo}>
            <span style={styles.metricLabel}>Peso actual</span>
            <span style={styles.metricValue}>
              {ultimaMedicion?.peso ? `${ultimaMedicion.peso} kg` : '-'}
            </span>
          </div>
        </div>

        <div style={styles.metricCard}>
          <span style={styles.metricIcon}><Ruler size={32} /></span>
          <div style={styles.metricInfo}>
            <span style={styles.metricLabel}>Altura</span>
            <span style={styles.metricValue}>
              {cliente?.altura ? `${cliente.altura} cm` : '-'}
            </span>
          </div>
        </div>

        <div style={styles.metricCard}>
          <span style={styles.metricIcon}><BarChart3 size={32} /></span>
          <div style={styles.metricInfo}>
            <span style={styles.metricLabel}>IMC</span>
            <span style={styles.metricValue}>{imcActual || '-'}</span>
            <span style={{ ...styles.metricTag, backgroundColor: imcCategoria.color }}>
              {imcCategoria.texto}
            </span>
          </div>
        </div>

        <div style={styles.metricCard}>
          <span style={styles.metricIcon}><Dumbbell size={32} /></span>
          <div style={styles.metricInfo}>
            <span style={styles.metricLabel}>% Grasa corporal</span>
            <span style={styles.metricValue}>
              {ultimaMedicion?.grasaCorporal ? `${ultimaMedicion.grasaCorporal}%` : '-'}
            </span>
          </div>
        </div>
      </div>

      {/* Historial de mediciones */}
      <div style={styles.historialSection}>
        <h2 style={styles.sectionTitle}>Historial de mediciones</h2>

        {mediciones.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}><ClipboardList size={48} /></span>
            <h3 style={styles.emptyTitle}>Sin mediciones registradas</h3>
            <p style={styles.emptyText}>
              Tu entrenador registrará tus mediciones durante las sesiones de evaluación.
            </p>
          </div>
        ) : (
          <div style={styles.historialList}>
            {mediciones.map((medicion) => (
              <div key={medicion._id} style={styles.historialCard}>
                <div style={styles.historialFecha}>
                  {formatearFecha(medicion.fecha)}
                </div>
                <div style={styles.historialData}>
                  <div style={styles.dataItem}>
                    <span style={styles.dataLabel}>Peso</span>
                    <span style={styles.dataValue}>{medicion.peso} kg</span>
                  </div>
                  {medicion.grasaCorporal && (
                    <div style={styles.dataItem}>
                      <span style={styles.dataLabel}>Grasa</span>
                      <span style={styles.dataValue}>{medicion.grasaCorporal}%</span>
                    </div>
                  )}
                  {medicion.masaMuscular && (
                    <div style={styles.dataItem}>
                      <span style={styles.dataLabel}>Músculo</span>
                      <span style={styles.dataValue}>{medicion.masaMuscular}%</span>
                    </div>
                  )}
                  {medicion.cintura && (
                    <div style={styles.dataItem}>
                      <span style={styles.dataLabel}>Cintura</span>
                      <span style={styles.dataValue}>{medicion.cintura} cm</span>
                    </div>
                  )}
                </div>
                {medicion.notas && (
                  <div style={styles.historialNotas}>
                    {medicion.notas}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1000px',
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
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '32px'
  },
  metricCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
    border: '1px solid #e4e4e9'
  },
  metricIcon: {
    fontSize: '32px'
  },
  metricInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  metricLabel: {
    fontSize: '13px',
    color: '#666'
  },
  metricValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1a1a2e'
  },
  metricTag: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    color: 'white',
    fontWeight: '600',
    marginTop: '4px'
  },
  historialSection: {
    marginTop: '8px'
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: '16px',
    fontFamily: 'Inter, sans-serif'
  },
  emptyState: {
    textAlign: 'center',
    padding: '48px 24px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)'
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
    display: 'block'
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: '8px'
  },
  emptyText: {
    fontSize: '14px',
    color: '#666'
  },
  historialList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  historialCard: {
    backgroundColor: 'white',
    padding: '16px 20px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    border: '1px solid #e4e4e9'
  },
  historialFecha: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#10b981',
    marginBottom: '12px'
  },
  historialData: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px'
  },
  dataItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  dataLabel: {
    fontSize: '12px',
    color: '#888'
  },
  dataValue: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1a1a2e'
  },
  historialNotas: {
    marginTop: '12px',
    padding: '12px',
    backgroundColor: '#f8fdf6',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#666',
    borderLeft: '3px solid #10b981'
  }
};

export default MiProgreso;
