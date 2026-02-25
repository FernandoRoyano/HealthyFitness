import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { solicitudesCambioAPI, notificacionesAPI, vacacionesAPI } from '../services/api';
import NotificationCenter from './NotificationCenter';
import { Home, Users, Calendar, Dumbbell, Zap, Receipt, Settings, HelpCircle, User, Bell, ChevronDown, ChevronRight, LogOut } from 'lucide-react';
import './Layout.css';

function Layout({ children }) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [solicitudesPendientes, setSolicitudesPendientes] = useState(0);
  const [vacacionesPendientes, setVacacionesPendientes] = useState(0);
  const [mostrarNotificaciones, setMostrarNotificaciones] = useState(false);
  const [notificacionesNoLeidas, setNotificacionesNoLeidas] = useState(0);
  const [submenusAbiertos, setSubmenusAbiertos] = useState({});

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const toggleSubmenu = (categoria) => {
    setSubmenusAbiertos(prev => ({
      ...prev,
      [categoria]: !prev[categoria]
    }));
  };

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
      cargarContadorVacaciones();
      const interval = setInterval(() => {
        cargarContadorSolicitudes();
        cargarContadorVacaciones();
      }, 30000);
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

  const cargarContadorVacaciones = async () => {
    try {
      const { data } = await vacacionesAPI.contarPendientes();
      setVacacionesPendientes(data.count);
    } catch (error) {
      console.error('Error al cargar contador vacaciones:', error);
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

  // Menú items según rol - con submenús desplegables
  const menuGerente = [
    { path: '/dashboard', label: 'Inicio', icon: Home },
    {
      label: 'Clientes',
      icon: Users,
      submenu: [
        { path: '/clientes', label: 'Clientes' },
        { path: '/leads', label: 'Leads' },
      ]
    },
    {
      label: 'Agenda',
      icon: Calendar,
      submenu: [
        { path: '/calendario-gerente', label: 'Agenda' },
        { path: '/plantillas', label: 'Horario Base' },
      ]
    },
    {
      label: 'Equipo',
      icon: Dumbbell,
      submenu: [
        { path: '/entrenadores', label: 'Entrenadores' },
        { path: '/solicitudes', label: 'Solicitudes', badge: solicitudesPendientes },
        { path: '/vacaciones', label: 'Vacaciones', badge: vacacionesPendientes },
      ]
    },
    {
      label: 'Entrenamiento',
      icon: Zap,
      submenu: [
        { path: '/ejercicios', label: 'Ejercicios' },
        { path: '/rutinas', label: 'Rutinas' },
      ]
    },
    {
      label: 'Finanzas',
      icon: Receipt,
      submenu: [
        { path: '/facturacion', label: 'Facturación' },
        { path: '/productos', label: 'Tarifas' },
      ]
    },
    { path: '/configuracion-centro', label: 'Configuración', icon: Settings },
    { path: '/ayuda', label: 'Ayuda', icon: HelpCircle },
  ];

  const menuEntrenador = [
    { path: '/dashboard', label: 'Inicio', icon: Home },
    {
      label: 'Clientes',
      icon: Users,
      submenu: [
        { path: '/clientes', label: 'Mis Clientes' },
        { path: '/leads', label: 'Leads' },
      ]
    },
    {
      label: 'Agenda',
      icon: Calendar,
      submenu: [
        { path: '/calendario', label: 'Mi Agenda' },
      ]
    },
    {
      label: 'Entrenamiento',
      icon: Zap,
      submenu: [
        { path: '/rutinas', label: 'Rutinas' },
      ]
    },
    {
      label: 'Equipo',
      icon: Dumbbell,
      submenu: [
        { path: '/entrenadores', label: 'Entrenadores' },
        { path: '/solicitudes', label: 'Solicitudes' },
        { path: '/vacaciones', label: 'Mis Vacaciones' },
      ]
    },
    {
      label: 'Finanzas',
      icon: Receipt,
      submenu: [
        { path: '/facturacion', label: 'Mi Facturación' },
        { path: '/productos', label: 'Tarifas' },
      ]
    },
    { path: '/ayuda', label: 'Ayuda', icon: HelpCircle },
  ];

  const allMenuItems = usuario?.rol === 'gerente'
    ? menuGerente
    : menuEntrenador;

  // Auto-abrir submenú si una ruta hija está activa
  useEffect(() => {
    const nuevosSubmenus = {};
    allMenuItems.forEach(item => {
      if (item.submenu) {
        const tieneRutaActiva = item.submenu.some(subitem => isActive(subitem.path));
        if (tieneRutaActiva) {
          nuevosSubmenus[item.label] = true;
        }
      }
    });
    setSubmenusAbiertos(prev => ({ ...prev, ...nuevosSubmenus }));
  }, [location.pathname]);

  // Obtener el label de la página actual (para el header)
  const obtenerTituloPagina = () => {
    for (const item of allMenuItems) {
      if (item.path && isActive(item.path)) {
        return item.label;
      }
      if (item.submenu) {
        const subitem = item.submenu.find(sub => isActive(sub.path));
        if (subitem) {
          return subitem.label;
        }
      }
    }
    return 'HealthyFitness';
  };

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
          {allMenuItems.map((item, index) => (
            item.submenu ? (
              <div key={index} className="sidebar-menu-group">
                <button
                  className={`sidebar-menu-header ${submenusAbiertos[item.label] ? 'abierto' : ''}`}
                  onClick={() => toggleSubmenu(item.label)}
                >
                  <span className="sidebar-icon"><item.icon size={18} /></span>
                  <span className="sidebar-label">{item.label}</span>
                  <span className="sidebar-chevron">
                    {submenusAbiertos[item.label] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </span>
                </button>
                <div className={`sidebar-submenu ${submenusAbiertos[item.label] ? 'abierto' : ''}`}>
                  {item.submenu.map((subitem) => (
                    <Link
                      key={subitem.path}
                      to={subitem.path}
                      className={`sidebar-sublink ${isActive(subitem.path) ? 'active' : ''}`}
                      onClick={closeSidebar}
                    >
                      <span className="sidebar-sublabel">{subitem.label}</span>
                      {subitem.badge > 0 && (
                        <span className="sidebar-badge">{subitem.badge}</span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <span className="sidebar-icon"><item.icon size={18} /></span>
                <span className="sidebar-label">{item.label}</span>
              </Link>
            )
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <span className="sidebar-user-icon"><User size={18} /></span>
            <span className="sidebar-user-name">{usuario?.nombre}</span>
          </div>
          <button onClick={handleLogout} className="sidebar-logout">
            <LogOut size={16} />
            <span>Cerrar Sesión</span>
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
            {obtenerTituloPagina()}
          </div>

          <div className="header-actions">
            <button
              onClick={handleToggleNotificaciones}
              className="notification-btn"
              aria-label="Notificaciones"
            >
              <Bell size={20} />
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
