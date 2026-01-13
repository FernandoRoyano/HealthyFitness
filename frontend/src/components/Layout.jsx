import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Layout({ children }) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div style={styles.container}>
      <nav style={styles.navbar}>
        <div style={styles.navContent}>
          <Link to="/dashboard" style={styles.logo}>
            HealthyFitness
          </Link>
          <div style={styles.navLinks}>
            <Link
              to="/dashboard"
              style={{
                ...styles.navLink,
                ...(isActive('/dashboard') && styles.navLinkActive)
              }}
            >
              Inicio
            </Link>
            <Link
              to="/clientes"
              style={{
                ...styles.navLink,
                ...(isActive('/clientes') && styles.navLinkActive)
              }}
            >
              Clientes
            </Link>
            <Link
              to="/reservas"
              style={{
                ...styles.navLink,
                ...(isActive('/reservas') && styles.navLinkActive)
              }}
            >
              Reservas
            </Link>
            <Link
              to="/calendario-reservas"
              style={{
                ...styles.navLink,
                ...(isActive('/calendario-reservas') && styles.navLinkActive)
              }}
            >
              Calendario Excel
            </Link>
            {usuario?.rol === 'gerente' ? (
              <>
                <Link
                  to="/calendario-gerente"
                  style={{
                    ...styles.navLink,
                    ...(isActive('/calendario-gerente') && styles.navLinkActive)
                  }}
                >
                  Calendarios
                </Link>
                <Link
                  to="/entrenadores"
                  style={{
                    ...styles.navLink,
                    ...(isActive('/entrenadores') && styles.navLinkActive)
                  }}
                >
                  Entrenadores
                </Link>
              </>
            ) : (
              <Link
                to="/calendario"
                style={{
                  ...styles.navLink,
                  ...(isActive('/calendario') && styles.navLinkActive)
                }}
              >
                Mi Calendario
              </Link>
            )}
          </div>
          <div style={styles.userSection}>
            <span style={styles.userName}>{usuario?.nombre}</span>
            <button onClick={handleLogout} style={styles.logoutButton}>
              Cerrar Sesión
            </button>
          </div>
        </div>
      </nav>
      <main style={styles.main}>{children}</main>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5'
  },
  navbar: {
    backgroundColor: 'white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  navContent: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '64px'
  },
  logo: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#007bff',
    textDecoration: 'none'
  },
  navLinks: {
    display: 'flex',
    gap: '20px',
    flex: 1,
    justifyContent: 'center'
  },
  navLink: {
    textDecoration: 'none',
    color: '#666',
    fontSize: '16px',
    padding: '8px 16px',
    borderRadius: '4px',
    transition: 'all 0.2s'
  },
  navLinkActive: {
    color: '#007bff',
    backgroundColor: '#e7f3ff'
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  userName: {
    fontSize: '14px',
    color: '#333',
    fontWeight: '500'
  },
  logoutButton: {
    padding: '8px 16px',
    fontSize: '14px',
    color: '#666',
    backgroundColor: 'transparent',
    border: '1px solid #ddd',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  main: {
    minHeight: 'calc(100vh - 64px)'
  }
};

export default Layout;
