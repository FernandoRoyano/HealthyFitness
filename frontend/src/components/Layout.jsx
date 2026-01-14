import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { solicitudesCambioAPI } from '../services/api';
import './Layout.css';

function Layout({ children }) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [solicitudesPendientes, setSolicitudesPendientes] = useState(0);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  // Cargar contador de solicitudes pendientes (solo para gerentes)
  useEffect(() => {
    if (usuario?.rol === 'gerente') {
      cargarContadorSolicitudes();
      // Actualizar cada 30 segundos
      const interval = setInterval(cargarContadorSolicitudes, 30000);
      return () => clearInterval(interval);
    }
  }, [usuario]);

  const cargarContadorSolicitudes = async () => {
    try {
      const { data } = await solicitudesCambioAPI.contarPendientes();
      setSolicitudesPendientes(data.count);
    } catch (error) {
      console.error('Error al cargar contador:', error);
    }
  };

  return (
    <div style={styles.container}>
      <nav style={styles.navbar}>
        <div style={styles.navContent}>
          <Link to="/dashboard" style={styles.logo} onClick={closeMenu}>
            HealthyFitness
          </Link>

          {/* Botón hamburguesa - solo visible en móvil */}
          <button
            className="hamburger-button"
            onClick={toggleMenu}
            style={styles.hamburger}
            aria-label="Toggle menu"
          >
            <span style={{...styles.hamburgerLine, transform: menuOpen ? 'rotate(45deg) translateY(8px)' : 'none'}}></span>
            <span style={{...styles.hamburgerLine, opacity: menuOpen ? 0 : 1}}></span>
            <span style={{...styles.hamburgerLine, transform: menuOpen ? 'rotate(-45deg) translateY(-8px)' : 'none'}}></span>
          </button>

          <div className={`nav-links ${menuOpen ? 'open' : ''}`} style={styles.navLinks}>
            <Link
              to="/dashboard"
              className="nav-link"
              onClick={closeMenu}
              style={{
                ...styles.navLink,
                ...(isActive('/dashboard') && styles.navLinkActive)
              }}
            >
              Inicio
            </Link>
            <Link
              to="/clientes"
              className="nav-link"
              onClick={closeMenu}
              style={{
                ...styles.navLink,
                ...(isActive('/clientes') && styles.navLinkActive)
              }}
            >
              Clientes
            </Link>
            <Link
              to="/reservas"
              className="nav-link"
              onClick={closeMenu}
              style={{
                ...styles.navLink,
                ...(isActive('/reservas') && styles.navLinkActive)
              }}
            >
              Reservas
            </Link>
            <Link
              to="/calendario-reservas"
              className="nav-link"
              onClick={closeMenu}
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
                  className="nav-link"
                  onClick={closeMenu}
                  style={{
                    ...styles.navLink,
                    ...(isActive('/calendario-gerente') && styles.navLinkActive)
                  }}
                >
                  Calendarios
                </Link>
                <Link
                  to="/entrenadores"
                  className="nav-link"
                  onClick={closeMenu}
                  style={{
                    ...styles.navLink,
                    ...(isActive('/entrenadores') && styles.navLinkActive)
                  }}
                >
                  Entrenadores
                </Link>
                <Link
                  to="/solicitudes"
                  className="nav-link"
                  onClick={closeMenu}
                  style={{
                    ...styles.navLink,
                    ...(isActive('/solicitudes') && styles.navLinkActive),
                    position: 'relative'
                  }}
                >
                  Solicitudes
                  {solicitudesPendientes > 0 && (
                    <span style={styles.badge}>{solicitudesPendientes}</span>
                  )}
                </Link>
              </>
            ) : (
              <Link
                to="/calendario"
                className="nav-link"
                onClick={closeMenu}
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
            <span className="user-name" style={styles.userName}>{usuario?.nombre}</span>
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
    padding: '8px 12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: '60px',
    flexWrap: 'wrap',
    gap: '8px'
  },
  logo: {
    fontSize: 'clamp(18px, 5vw, 24px)',
    fontWeight: '700',
    color: '#75b760',
    textDecoration: 'none',
    fontFamily: 'Niramit, sans-serif',
    letterSpacing: '-0.5px',
    flexShrink: 0
  },
  navLinks: {
    display: 'flex',
    gap: '4px',
    flex: 1,
    justifyContent: 'center',
    flexWrap: 'wrap',
    padding: '4px 0',
    minWidth: '200px'
  },
  navLink: {
    textDecoration: 'none',
    color: '#666666',
    fontSize: 'clamp(13px, 3vw, 15px)',
    padding: '8px 12px',
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
    gap: '8px',
    flexWrap: 'wrap',
    flexShrink: 0
  },
  userName: {
    fontSize: 'clamp(13px, 3vw, 15px)',
    color: '#000000',
    fontWeight: '600',
    fontFamily: 'Niramit, sans-serif',
    display: 'none', // Ocultar nombre en móvil para ahorrar espacio
    '@media (min-width: 640px)': {
      display: 'block'
    }
  },
  logoutButton: {
    padding: '8px 16px',
    fontSize: 'clamp(13px, 3vw, 15px)',
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
    minHeight: 'calc(100vh - 60px)',
    padding: '0'
  },
  hamburger: {
    display: 'none',
    flexDirection: 'column',
    justifyContent: 'space-around',
    width: '32px',
    height: '32px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    zIndex: 101
  },
  hamburgerLine: {
    width: '24px',
    height: '3px',
    backgroundColor: '#75b760',
    borderRadius: '3px',
    transition: 'all 0.3s ease',
    transformOrigin: 'center'
  },
  badge: {
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    backgroundColor: '#dc3545',
    color: 'white',
    borderRadius: '10px',
    padding: '2px 6px',
    fontSize: '11px',
    fontWeight: '600',
    minWidth: '18px',
    textAlign: 'center'
  }
};

export default Layout;
