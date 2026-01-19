import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { solicitudesCambioAPI, notificacionesAPI } from '../services/api';
import NotificationCenter from './NotificationCenter';
import './Layout.css';

function Layout({ children }) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [solicitudesPendientes, setSolicitudesPendientes] = useState(0);
  const [mostrarNotificaciones, setMostrarNotificaciones] = useState(false);
  const [notificacionesNoLeidas, setNotificacionesNoLeidas] = useState(0);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  // Cargar contador de solicitudes pendientes (solo para gerentes)
  useEffect(() => {
    if (usuario?.rol === 'gerente') {
      cargarContadorSolicitudes();
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

  // Cargar contador de notificaciones no leídas
  useEffect(() => {
    if (usuario) {
      cargarContadorNotificaciones();
      const interval = setInterval(cargarContadorNotificaciones, 30000);
      return () => clearInterval(interval);
    }
  }, [usuario]);

  const cargarContadorNotificaciones = async () => {
    try {
      const { data } = await notificacionesAPI.contarNoLeidas();
      setNotificacionesNoLeidas(data.count);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    }
  };

  const handleToggleNotificaciones = () => {
    setMostrarNotificaciones(!mostrarNotificaciones);
  };

  const handleCerrarNotificaciones = () => {
    setMostrarNotificaciones(false);
    cargarContadorNotificaciones();
  };

  // Menú items según rol
  const menuItems = [
    { path: '/dashboard', label: 'Inicio', icon: '🏠' },
    { path: '/clientes', label: 'Clientes', icon: '👥' },
    { path: '/reservas', label: 'Reservas', icon: '📅' },
    { path: '/calendario-reservas', label: 'Calendario', icon: '📊' },
  ];

  const menuGerente = [
    { path: '/calendario-gerente', label: 'Agenda', icon: '📅' },
    { path: '/plantillas', label: 'Horario Base', icon: '📋' },
    { path: '/calendario-dual', label: 'Comparar', icon: '🔄' },
    { path: '/entrenadores', label: 'Entrenadores', icon: '🏋️' },
    {
      path: '/solicitudes',
      label: 'Solicitudes',
      icon: '📬',
      badge: solicitudesPendientes
    },
    { path: '/productos', label: 'Tarifas', icon: '💰' },
  ];

  const menuEntrenador = [
    { path: '/calendario', label: 'Mi Calendario', icon: '📆' },
    { path: '/calendario-dual', label: 'Comparar', icon: '🔄' },
  ];

  const allMenuItems = usuario?.rol === 'gerente'
    ? [...menuItems, ...menuGerente]
    : [...menuItems, ...menuEntrenador];

  return (
    <div className="layout-container">
      {/* Overlay para cerrar sidebar en móvil */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/dashboard" className="sidebar-logo" onClick={closeSidebar}>
            <img src="/logo.png" alt="HealthyFitness" className="sidebar-logo-img" />
            <span>HealthyFitness</span>
          </Link>
        </div>

        <nav className="sidebar-nav">
          {allMenuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
              {item.badge > 0 && (
                <span className="sidebar-badge">{item.badge}</span>
              )}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <span className="sidebar-user-icon">👤</span>
            <span className="sidebar-user-name">{usuario?.nombre}</span>
          </div>
          <button onClick={handleLogout} className="sidebar-logout">
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="main-wrapper">
        {/* Header superior */}
        <header className="top-header">
          <button
            className="hamburger-btn"
            onClick={toggleSidebar}
            aria-label="Toggle menu"
          >
            <span className={`hamburger-line ${sidebarOpen ? 'open' : ''}`}></span>
            <span className={`hamburger-line ${sidebarOpen ? 'open' : ''}`}></span>
            <span className={`hamburger-line ${sidebarOpen ? 'open' : ''}`}></span>
          </button>

          <div className="header-title">
            {allMenuItems.find(item => isActive(item.path))?.label || 'HealthyFitness'}
          </div>

          <div className="header-actions">
            <button
              onClick={handleToggleNotificaciones}
              className="notification-btn"
              aria-label="Notificaciones"
            >
              🔔
              {notificacionesNoLeidas > 0 && (
                <span className="notification-badge">{notificacionesNoLeidas}</span>
              )}
            </button>
          </div>
        </header>

        {/* Centro de notificaciones */}
        <NotificationCenter
          mostrar={mostrarNotificaciones}
          onCerrar={handleCerrarNotificaciones}
        />

        {/* Contenido principal */}
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default Layout;
