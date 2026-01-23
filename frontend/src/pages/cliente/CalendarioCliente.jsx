import { useState, useEffect } from 'react';
import { useClienteAuth } from '../../context/ClienteAuthContext';
import CalendarioSemanal from '../../components/CalendarioSemanal';

// API temporal hasta que creemos el endpoint del portal
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function CalendarioCliente() {
  const { cliente } = useClienteAuth();
  const [reservas, setReservas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarReservas();
  }, [cliente]);

  const cargarReservas = async () => {
    if (!cliente?._id) return;

    try {
      setCargando(true);
      const token = localStorage.getItem('clienteToken');
      const response = await fetch(`${API_URL}/cliente-portal/mis-reservas`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar reservas');
      }

      const data = await response.json();
      setReservas(data);
    } catch (err) {
      console.error('Error al cargar calendario:', err);
      setError('No se pudieron cargar las reservas. Por favor, intenta de nuevo más tarde.');
      // Datos de ejemplo mientras no está el endpoint
      setReservas([]);
    } finally {
      setCargando(false);
    }
  };

  if (cargando) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Cargando calendario...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Mi Calendario</h1>
          <p style={styles.subtitle}>Consulta tus próximas sesiones de entrenamiento</p>
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.calendarContainer}>
        <CalendarioSemanal
          reservas={reservas}
          soloLectura={true}
        />
      </div>

      <div style={styles.legend}>
        <div style={styles.legendItem}>
          <div style={{...styles.legendColor, backgroundColor: '#75b760'}}></div>
          <span>Sesión confirmada</span>
        </div>
        <div style={styles.legendItem}>
          <div style={{...styles.legendColor, backgroundColor: '#ffc107'}}></div>
          <span>Sesión pendiente</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1600px',
    margin: '0 auto'
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px',
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
    fontFamily: 'Niramit, sans-serif'
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    fontFamily: 'Niramit, sans-serif'
  },
  error: {
    padding: '14px',
    backgroundColor: '#fee',
    color: '#c00',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
    border: '1px solid #fcc'
  },
  calendarContainer: {
    marginBottom: '24px'
  },
  legend: {
    display: 'flex',
    gap: '24px',
    padding: '16px 20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#666'
  },
  legendColor: {
    width: '16px',
    height: '16px',
    borderRadius: '4px'
  }
};

export default CalendarioCliente;
