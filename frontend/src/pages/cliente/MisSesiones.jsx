import { useState, useEffect } from 'react';
import { useClienteAuth } from '../../context/ClienteAuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function MisSesiones() {
  const { cliente } = useClienteAuth();
  const [sesiones, setSesiones] = useState([]);
  const [filtro, setFiltro] = useState('proximas'); // proximas, pasadas, todas
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarSesiones();
  }, [cliente, filtro]);

  const cargarSesiones = async () => {
    if (!cliente?._id) return;

    try {
      setCargando(true);
      const token = localStorage.getItem('clienteToken');
      const response = await fetch(`${API_URL}/cliente-portal/mis-sesiones?filtro=${filtro}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar sesiones');
      }

      const data = await response.json();
      setSesiones(data);
    } catch (err) {
      console.error('Error al cargar sesiones:', err);
      setError('No se pudieron cargar las sesiones.');
      setSesiones([]);
    } finally {
      setCargando(false);
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getEstadoStyle = (estado) => {
    switch (estado) {
      case 'confirmada':
        return { backgroundColor: '#e8f5e9', color: '#2e7d32' };
      case 'pendiente':
        return { backgroundColor: '#fff3e0', color: '#f57c00' };
      case 'completada':
        return { backgroundColor: '#e3f2fd', color: '#1976d2' };
      case 'cancelada':
        return { backgroundColor: '#ffebee', color: '#c62828' };
      default:
        return { backgroundColor: '#f5f5f5', color: '#666' };
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Mis Sesiones</h1>
          <p style={styles.subtitle}>Historial de entrenamientos</p>
        </div>
      </div>

      {/* Filtros */}
      <div style={styles.filtros}>
        <button
          style={{
            ...styles.filtroBtn,
            ...(filtro === 'proximas' ? styles.filtroBtnActivo : {})
          }}
          onClick={() => setFiltro('proximas')}
        >
          Próximas
        </button>
        <button
          style={{
            ...styles.filtroBtn,
            ...(filtro === 'pasadas' ? styles.filtroBtnActivo : {})
          }}
          onClick={() => setFiltro('pasadas')}
        >
          Pasadas
        </button>
        <button
          style={{
            ...styles.filtroBtn,
            ...(filtro === 'todas' ? styles.filtroBtnActivo : {})
          }}
          onClick={() => setFiltro('todas')}
        >
          Todas
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {cargando ? (
        <div style={styles.loading}>Cargando sesiones...</div>
      ) : sesiones.length === 0 ? (
        <div style={styles.emptyState}>
          <span style={styles.emptyIcon}>📋</span>
          <h3 style={styles.emptyTitle}>No hay sesiones</h3>
          <p style={styles.emptyText}>
            {filtro === 'proximas'
              ? 'No tienes sesiones programadas próximamente.'
              : filtro === 'pasadas'
              ? 'No tienes sesiones pasadas registradas.'
              : 'No se encontraron sesiones.'}
          </p>
        </div>
      ) : (
        <div style={styles.sesionesList}>
          {sesiones.map((sesion) => (
            <div key={sesion._id} style={styles.sesionCard}>
              <div style={styles.sesionFecha}>
                <span style={styles.sesionDia}>
                  {new Date(sesion.fecha).getDate()}
                </span>
                <span style={styles.sesionMes}>
                  {new Date(sesion.fecha).toLocaleDateString('es-ES', { month: 'short' })}
                </span>
              </div>
              <div style={styles.sesionInfo}>
                <div style={styles.sesionHora}>
                  {sesion.horaInicio} - {sesion.horaFin}
                </div>
                <div style={styles.sesionTipo}>{sesion.tipoSesion}</div>
                {sesion.entrenador && (
                  <div style={styles.sesionEntrenador}>
                    Con {sesion.entrenador.nombre}
                  </div>
                )}
              </div>
              <div style={styles.sesionEstado}>
                <span style={{
                  ...styles.estadoBadge,
                  ...getEstadoStyle(sesion.estado)
                }}>
                  {sesion.estado}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '800px',
    margin: '0 auto'
  },
  header: {
    marginBottom: '24px'
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: '8px',
    fontFamily: 'Niramit, sans-serif'
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    fontFamily: 'Niramit, sans-serif'
  },
  filtros: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
    backgroundColor: '#f5f5f5',
    padding: '6px',
    borderRadius: '10px'
  },
  filtroBtn: {
    flex: 1,
    padding: '10px 16px',
    border: 'none',
    background: 'transparent',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: '#666',
    fontFamily: 'Niramit, sans-serif',
    transition: 'all 0.2s'
  },
  filtroBtnActivo: {
    backgroundColor: 'white',
    color: '#75b760',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
  },
  error: {
    padding: '14px',
    backgroundColor: '#fee',
    color: '#c00',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px'
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '200px',
    fontSize: '16px',
    color: '#666'
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
  sesionesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  sesionCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    backgroundColor: 'white',
    padding: '16px 20px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    border: '1px solid #e4e4e9'
  },
  sesionFecha: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: '50px',
    padding: '8px 12px',
    backgroundColor: '#f8fdf6',
    borderRadius: '8px'
  },
  sesionDia: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#75b760'
  },
  sesionMes: {
    fontSize: '12px',
    color: '#666',
    textTransform: 'uppercase'
  },
  sesionInfo: {
    flex: 1
  },
  sesionHora: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: '4px'
  },
  sesionTipo: {
    fontSize: '14px',
    color: '#666',
    textTransform: 'capitalize',
    marginBottom: '2px'
  },
  sesionEntrenador: {
    fontSize: '13px',
    color: '#888'
  },
  sesionEstado: {},
  estadoBadge: {
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'capitalize'
  }
};

export default MisSesiones;
