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
    backgroundColor: '#fafafa'
  },
  navbar: {
    backgroundColor: 'white',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    borderBottom: '1px solid #e4e4e9'
  },
  navContent: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '70px',
    flexWrap: 'wrap',
    gap: '12px'
  },
  logo: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#75b760',
    textDecoration: 'none',
    fontFamily: 'Niramit, sans-serif',
    letterSpacing: '-0.5px'
  },
  navLinks: {
    display: 'flex',
    gap: '8px',
    flex: 1,
    justifyContent: 'center',
    flexWrap: 'wrap',
    padding: '8px 0'
  },
  navLink: {
    textDecoration: 'none',
    color: '#666666',
    fontSize: '15px',
    padding: '10px 16px',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    fontFamily: 'Niramit, sans-serif',
    fontWeight: '600',
    whiteSpace: 'nowrap'
  },
  navLinkActive: {
    color: '#75b760',
    backgroundColor: '#f8fdf6'
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap'
  },
  userName: {
    fontSize: '15px',
    color: '#000000',
    fontWeight: '600',
    fontFamily: 'Niramit, sans-serif'
  },
  logoutButton: {
    padding: '10px 20px',
    fontSize: '15px',
    color: '#666666',
    backgroundColor: 'transparent',
    border: '1px solid #e4e4e9',
    borderRadius: '9999px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'Niramit, sans-serif',
    fontWeight: '600'
  },
  main: {
    minHeight: 'calc(100vh - 70px)',
    padding: '0'
  }
};

export default Layout;
