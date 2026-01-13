import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Dashboard() {
  const { usuario } = useAuth();

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Bienvenido, {usuario?.nombre}</h1>
      <p style={styles.subtitle}>Panel de Control - HealthyFitness</p>
      {usuario?.rol === 'entrenador' && (
        <div style={styles.roleInfo}>
          <strong>Rol:</strong> Entrenador Personal
        </div>
      )}
      {usuario?.rol === 'gerente' && (
        <div style={styles.roleInfo}>
          <strong>Rol:</strong> Gerente del Centro
        </div>
      )}

      <div style={styles.grid}>
        <Link to="/clientes" style={styles.card}>
          <div style={styles.cardIcon}>👥</div>
          <h2 style={styles.cardTitle}>Clientes</h2>
          <p style={styles.cardDescription}>
            Gestiona la información de tus clientes
          </p>
        </Link>

        <Link to="/reservas" style={styles.card}>
          <div style={styles.cardIcon}>📅</div>
          <h2 style={styles.cardTitle}>Reservas</h2>
          <p style={styles.cardDescription}>
            Administra las reservas y horarios
          </p>
        </Link>

        <Link to="/calendario-reservas" style={styles.card}>
          <div style={styles.cardIcon}>📊</div>
          <h2 style={styles.cardTitle}>Calendario Excel</h2>
          <p style={styles.cardDescription}>
            Vista tipo Excel con todos los entrenadores
          </p>
        </Link>

        {usuario?.rol === 'gerente' ? (
          <>
            <Link to="/calendario-gerente" style={styles.card}>
              <div style={styles.cardIcon}>📆</div>
              <h2 style={styles.cardTitle}>Calendarios</h2>
              <p style={styles.cardDescription}>
                Vista de todos los entrenadores
              </p>
            </Link>
            <Link to="/entrenadores" style={styles.card}>
              <div style={styles.cardIcon}>👨‍🏫</div>
              <h2 style={styles.cardTitle}>Entrenadores</h2>
              <p style={styles.cardDescription}>
                Gestiona los perfiles de entrenadores
              </p>
            </Link>
          </>
        ) : (
          <Link to="/calendario" style={styles.card}>
            <div style={styles.cardIcon}>📆</div>
            <h2 style={styles.cardTitle}>Mi Calendario</h2>
            <p style={styles.cardDescription}>
              Vista semanal de tus sesiones
            </p>
          </Link>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '40px 20px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '10px'
  },
  subtitle: {
    fontSize: '18px',
    color: '#666',
    marginBottom: '15px'
  },
  roleInfo: {
    fontSize: '14px',
    color: '#007bff',
    backgroundColor: '#e7f3ff',
    padding: '10px 15px',
    borderRadius: '6px',
    marginBottom: '40px',
    display: 'inline-block'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px'
  },
  card: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    textDecoration: 'none',
    color: 'inherit',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'pointer'
  },
  cardIcon: {
    fontSize: '48px',
    marginBottom: '15px'
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '10px'
  },
  cardDescription: {
    fontSize: '14px',
    color: '#666'
  }
};

export default Dashboard;
