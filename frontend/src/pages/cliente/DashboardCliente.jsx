import { useState, useEffect } from 'react';
import { useClienteAuth } from '../../context/ClienteAuthContext';
import { Link } from 'react-router-dom';
import { Home, Calendar, Dumbbell, BarChart3, CreditCard } from 'lucide-react';

function DashboardCliente() {
  const { cliente } = useClienteAuth();
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => setCargando(false), 500);
  }, []);

  if (cargando) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Cargando...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header de bienvenida */}
      <div style={styles.welcomeCard}>
        <div style={styles.welcomeContent}>
          <h1 style={styles.welcomeTitle}>
            ¡Hola, {cliente?.nombre}!
          </h1>
          <p style={styles.welcomeSubtitle}>
            Bienvenido/a a tu portal personal de HealthyFitness
          </p>
        </div>
        <div style={styles.welcomeIcon}><Home size={64} /></div>
      </div>

      {/* Grid de accesos rápidos */}
      <div style={styles.quickAccessGrid}>
        <Link to="/cliente/calendario" style={styles.quickAccessCard}>
          <span style={styles.quickAccessIcon}><Calendar size={36} /></span>
          <span style={styles.quickAccessLabel}>Mi Calendario</span>
          <span style={styles.quickAccessDesc}>Ver mis próximas sesiones</span>
        </Link>

        <Link to="/cliente/sesiones" style={styles.quickAccessCard}>
          <span style={styles.quickAccessIcon}><Dumbbell size={36} /></span>
          <span style={styles.quickAccessLabel}>Mis Sesiones</span>
          <span style={styles.quickAccessDesc}>Historial de entrenamientos</span>
        </Link>

        <Link to="/cliente/progreso" style={styles.quickAccessCard}>
          <span style={styles.quickAccessIcon}><BarChart3 size={36} /></span>
          <span style={styles.quickAccessLabel}>Mi Progreso</span>
          <span style={styles.quickAccessDesc}>Seguimiento corporal</span>
        </Link>

        <Link to="/cliente/suscripcion" style={styles.quickAccessCard}>
          <span style={styles.quickAccessIcon}><CreditCard size={36} /></span>
          <span style={styles.quickAccessLabel}>Mi Suscripción</span>
          <span style={styles.quickAccessDesc}>Plan y facturas</span>
        </Link>
      </div>

      {/* Información de contacto */}
      <div style={styles.infoCard}>
        <h3 style={styles.infoTitle}>¿Necesitas ayuda?</h3>
        <p style={styles.infoText}>
          Si tienes alguna duda sobre tus sesiones, pagos o cualquier otra consulta,
          contacta directamente con tu entrenador o con el centro.
        </p>
        {cliente?.entrenador && (
          <div style={styles.trainerInfo}>
            <span style={styles.trainerLabel}>Tu entrenador:</span>
            <span style={styles.trainerName}>{cliente.entrenador.nombre}</span>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '200px',
    fontSize: '18px',
    color: '#666'
  },
  welcomeCard: {
    background: 'linear-gradient(135deg, #10b981, #059669)',
    borderRadius: '16px',
    padding: '32px',
    color: 'white',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    boxShadow: '0 8px 24px rgba(117, 183, 96, 0.3)'
  },
  welcomeContent: {},
  welcomeTitle: {
    fontSize: '28px',
    fontWeight: '700',
    marginBottom: '8px',
    fontFamily: 'Inter, sans-serif'
  },
  welcomeSubtitle: {
    fontSize: '16px',
    opacity: 0.9,
    fontFamily: 'Inter, sans-serif'
  },
  welcomeIcon: {
    fontSize: '64px'
  },
  quickAccessGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
  },
  quickAccessCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    textDecoration: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    border: '1px solid #e4e4e9'
  },
  quickAccessIcon: {
    fontSize: '36px',
    marginBottom: '8px'
  },
  quickAccessLabel: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1a1a2e',
    fontFamily: 'Inter, sans-serif'
  },
  quickAccessDesc: {
    fontSize: '14px',
    color: '#666',
    fontFamily: 'Inter, sans-serif'
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
    border: '1px solid #e4e4e9'
  },
  infoTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: '12px',
    fontFamily: 'Inter, sans-serif'
  },
  infoText: {
    fontSize: '14px',
    color: '#666',
    lineHeight: 1.6,
    marginBottom: '16px'
  },
  trainerInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px',
    backgroundColor: '#f8fdf6',
    borderRadius: '8px',
    borderLeft: '4px solid #10b981'
  },
  trainerLabel: {
    fontSize: '14px',
    color: '#666'
  },
  trainerName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1a1a2e'
  }
};

export default DashboardCliente;
