import { useState } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useClienteAuth } from '../context/ClienteAuthContext';
import './LayoutCliente.css';

function LayoutCliente() {
  const { cliente, logout } = useClienteAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/cliente/login');
  };

  const isActive = (path) => location.pathname === path;

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  // Menú simplificado para clientes
  const menuItems = [
    { path: '/cliente/dashboard', label: 'Mi Panel', icon: '🏠' },
    { path: '/cliente/calendario', label: 'Mi Calendario', icon: '📆' },
    { path: '/cliente/sesiones', label: 'Mis Sesiones', icon: '🏋️' },
    { path: '/cliente/progreso', label: 'Mi Progreso', icon: '📊' },
    { path: '/cliente/suscripcion', label: 'Mi Suscripción', icon: '💳' },
  ];

  // Obtener título de la página actual
  const obtenerTituloPagina = () => {
    const item = menuItems.find(item => isActive(item.path));
    return item ? item.label : 'Portal del Cliente';
  };

  return (
    <div className="layout-cliente-container">
      {/* Overlay para cerrar sidebar en móvil */}
      <div
        className={`cliente-sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <aside className={`cliente-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="cliente-sidebar-header">
          <Link to="/cliente/dashboard" className="cliente-sidebar-logo" onClick={closeSidebar}>
            <img src="/logo.png" alt="HealthyFitness" className="cliente-sidebar-logo-img" />
            <div className="cliente-sidebar-logo-text">
              <span className="cliente-logo-title">HealthyFitness</span>
              <span className="cliente-logo-subtitle">Portal Cliente</span>
            </div>
          </Link>
        </div>

        <nav className="cliente-sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`cliente-sidebar-link ${isActive(item.path) ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              <span className="cliente-sidebar-icon">{item.icon}</span>
              <span className="cliente-sidebar-label">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="cliente-sidebar-footer">
          <div className="cliente-sidebar-user">
            <div className="cliente-user-avatar">
              {cliente?.foto ? (
                <img src={cliente.foto} alt={cliente.nombre} />
              ) : (
                <span>👤</span>
              )}
            </div>
            <div className="cliente-user-info">
              <span className="cliente-user-name">{cliente?.nombre} {cliente?.apellido}</span>
              <span className="cliente-user-email">{cliente?.email}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="cliente-sidebar-logout">
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="cliente-main-wrapper">
        {/* Header superior */}
        <header className="cliente-top-header">
          <button
            className="cliente-hamburger-btn"
            onClick={toggleSidebar}
            aria-label="Toggle menu"
          >
            <span className={`cliente-hamburger-line ${sidebarOpen ? 'open' : ''}`}></span>
            <span className={`cliente-hamburger-line ${sidebarOpen ? 'open' : ''}`}></span>
            <span className={`cliente-hamburger-line ${sidebarOpen ? 'open' : ''}`}></span>
          </button>

          <div className="cliente-header-title">
            {obtenerTituloPagina()}
          </div>

          <div className="cliente-header-actions">
            <Link to="/cliente/perfil" className="cliente-profile-btn" title="Mi Perfil">
              ⚙️
            </Link>
          </div>
        </header>

        {/* Contenido principal */}
        <main className="cliente-main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default LayoutCliente;
