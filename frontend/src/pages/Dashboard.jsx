import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI } from '../services/api';

// Obtener saludo según la hora del día
const obtenerSaludo = () => {
  const hora = new Date().getHours();
  if (hora >= 5 && hora < 12) return { texto: 'Buenos días', icono: '🌅' };
  if (hora >= 12 && hora < 19) return { texto: 'Buenas tardes', icono: '☀️' };
  return { texto: 'Buenas noches', icono: '🌙' };
};

// Obtener iniciales para el avatar
const obtenerIniciales = (nombre) => {
  if (!nombre) return 'U';
  const palabras = nombre.split(' ');
  return palabras.length >= 2
    ? (palabras[0][0] + palabras[1][0]).toUpperCase()
    : nombre.substring(0, 2).toUpperCase();
};

// Formatear número grande
const formatearNumero = (num) => {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num?.toString() || '0';
};

function Dashboard() {
  const { usuario } = useAuth();
  const saludo = obtenerSaludo();
  const [hoveredCard, setHoveredCard] = useState(null);
  const [hoveredWidget, setHoveredWidget] = useState(null);
  const [stats, setStats] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Cargar estadísticas al montar
  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      const { data } = await dashboardAPI.obtenerEstadisticas();
      setStats(data);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setCargando(false);
    }
  };

  // Configuración de widgets según rol
  const widgetsGerente = [
    { id: 'clientes', icon: '👥', label: 'Clientes Activos', value: stats?.clientesActivos, path: '/clientes', color: '#667eea' },
    { id: 'leads', icon: '🎯', label: 'Leads Pendientes', value: stats?.leadsPendientes, path: '/leads', color: '#f59e0b' },
    { id: 'reservas', icon: '📅', label: 'Reservas Hoy', value: stats?.reservasHoy, path: '/reservas', color: '#10b981' },
    { id: 'solicitudes', icon: '📬', label: 'Solicitudes', value: stats?.solicitudesPendientes, path: '/solicitudes', color: '#3b82f6' },
    { id: 'vacaciones', icon: '🏖️', label: 'Vacaciones', value: stats?.vacacionesPendientes, path: '/vacaciones', color: '#8b5cf6' },
    { id: 'facturacion', icon: '💶', label: 'Facturación Mes', value: stats?.facturacionMes, path: '/facturacion', color: '#059669', formato: 'moneda' },
  ];

  const widgetsEntrenador = [
    { id: 'misclientes', icon: '👥', label: 'Mis Clientes', value: stats?.misClientes, path: '/clientes', color: '#667eea' },
    { id: 'leads', icon: '🎯', label: 'Leads Pendientes', value: stats?.leadsPendientes, path: '/leads', color: '#f59e0b' },
    { id: 'reservas', icon: '📅', label: 'Mis Reservas Hoy', value: stats?.misReservasHoy, path: '/reservas', color: '#10b981' },
    { id: 'vacaciones', icon: '🏖️', label: 'Días Vacaciones', value: stats?.diasVacacionesDisponibles, path: '/vacaciones', color: '#8b5cf6' },
  ];

  const widgets = usuario?.rol === 'gerente' ? widgetsGerente : widgetsEntrenador;

  // Configuración de tarjetas de acceso rápido según rol
  const tarjetasGerente = [
    { id: 'clientes', path: '/clientes', icon: '👥', title: 'Clientes', desc: 'Gestiona la información de todos los clientes' },
    { id: 'leads', path: '/leads', icon: '🎯', title: 'Leads', desc: 'Clientes potenciales y seguimiento' },
    { id: 'reservas', path: '/reservas', icon: '📅', title: 'Reservas', desc: 'Administra las reservas y horarios' },
    { id: 'calendario-excel', path: '/calendario-reservas', icon: '📊', title: 'Calendario Excel', desc: 'Vista tipo Excel con todos los entrenadores' },
    { id: 'calendarios', path: '/calendario-gerente', icon: '📆', title: 'Calendarios', desc: 'Vista de todos los entrenadores' },
    { id: 'entrenadores', path: '/entrenadores', icon: '👨‍🏫', title: 'Entrenadores', desc: 'Gestiona los perfiles de entrenadores' },
    { id: 'vacaciones', path: '/vacaciones', icon: '🏖️', title: 'Vacaciones', desc: 'Control de vacaciones del equipo' },
    { id: 'facturacion', path: '/facturacion', icon: '💶', title: 'Facturación', desc: 'Gestión de facturas y pagos' },
  ];

  const tarjetasEntrenador = [
    { id: 'clientes', path: '/clientes', icon: '👥', title: 'Mis Clientes', desc: 'Gestiona la información de tus clientes asignados' },
    { id: 'leads', path: '/leads', icon: '🎯', title: 'Leads', desc: 'Clientes potenciales y seguimiento' },
    { id: 'mi-calendario', path: '/calendario', icon: '📆', title: 'Mi Calendario', desc: 'Vista semanal de tus sesiones' },
    { id: 'vacaciones', path: '/vacaciones', icon: '🏖️', title: 'Mis Vacaciones', desc: 'Solicitar y ver mis vacaciones' },
    { id: 'facturacion', path: '/facturacion', icon: '💶', title: 'Mi Facturación', desc: 'Ver facturación de tus clientes' },
  ];

  const tarjetas = usuario?.rol === 'gerente' ? tarjetasGerente : tarjetasEntrenador;

  return (
    <div style={styles.container}>
      {/* Sección de Bienvenida */}
      <div style={styles.welcomeSection}>
        {/* Decoración de fondo */}
        <div style={styles.welcomeDecoration} />
        <div style={styles.welcomeDecoration2} />

        <div style={styles.welcomeContent}>
          {/* Avatar */}
          <div style={styles.avatarContainer}>
            <div style={styles.avatar}>
              {obtenerIniciales(usuario?.nombre)}
            </div>
          </div>

          {/* Texto de bienvenida */}
          <div style={styles.welcomeText}>
            <span style={styles.greeting}>
              {saludo.icono} {saludo.texto}
            </span>
            <h1 style={styles.title}>{usuario?.nombre}</h1>
            <p style={styles.subtitle}>Panel de Control - HealthyFitness</p>
          </div>
        </div>

        {/* Badge de rol */}
        {usuario?.rol && (
          <div style={styles.roleBadge}>
            <span style={styles.roleIcon}>
              {usuario.rol === 'gerente' ? '👔' : '💪'}
            </span>
            <span style={styles.roleText}>
              {usuario.rol === 'gerente' ? 'Gerente del Centro' : 'Entrenador Personal'}
            </span>
          </div>
        )}
      </div>

      {/* Widgets de Estadísticas */}
      <div style={styles.statsSection}>
        <h2 style={styles.sectionTitle}>Resumen del Día</h2>
        <div style={styles.widgetsGrid}>
          {widgets.map((widget) => (
            <Link
              key={widget.id}
              to={widget.path}
              style={{
                ...styles.widget,
                ...(hoveredWidget === widget.id ? styles.widgetHover : {}),
              }}
              onMouseEnter={() => setHoveredWidget(widget.id)}
              onMouseLeave={() => setHoveredWidget(null)}
            >
              <div style={{ ...styles.widgetIconBg, backgroundColor: `${widget.color}15` }}>
                <span style={styles.widgetIcon}>{widget.icon}</span>
              </div>
              <div style={styles.widgetContent}>
                <span style={{ ...styles.widgetValue, color: widget.color }}>
                  {cargando ? '...' : (
                    widget.formato === 'moneda'
                      ? `${formatearNumero(widget.value)}€`
                      : (widget.value ?? 0)
                  )}
                </span>
                <span style={styles.widgetLabel}>{widget.label}</span>
              </div>
              {(widget.value > 0 && (widget.id === 'solicitudes' || widget.id === 'leads')) && (
                <div style={{ ...styles.widgetBadge, backgroundColor: widget.color }}>
                  !
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Sección de Entrenamientos del Mes - Solo Gerente */}
      {usuario?.rol === 'gerente' && stats?.entrenamientosMes && stats.entrenamientosMes.length > 0 && (
        <div style={styles.entrenamientosSection}>
          <h2 style={styles.sectionTitle}>Entrenamientos del Mes</h2>
          <div style={styles.entrenamientosGrid}>
            {stats.entrenamientosMes.map((item) => (
              <div key={item.entrenadorId} style={styles.entrenamientoCard}>
                <div style={styles.entrenamientoAvatar}>
                  {item.nombre?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div style={styles.entrenamientoInfo}>
                  <span style={styles.entrenamientoNombre}>{item.nombre}</span>
                  <span style={styles.entrenamientoTotal}>
                    {item.total} {item.total === 1 ? 'sesión' : 'sesiones'}
                  </span>
                </div>
                <div style={styles.entrenamientoNumero}>{item.total}</div>
              </div>
            ))}
          </div>
          <Link to="/entrenadores" style={styles.entrenamientosLink}>
            Ver detalle completo →
          </Link>
        </div>
      )}

      {/* Sección de Accesos Rápidos */}
      <div style={styles.quickAccessSection}>
        <h2 style={styles.sectionTitle}>Accesos Rápidos</h2>
        <div style={styles.grid}>
          {tarjetas.map((tarjeta) => (
            <Link
              key={tarjeta.id}
              to={tarjeta.path}
              style={{
                ...styles.card,
                ...(hoveredCard === tarjeta.id ? styles.cardHover : {}),
              }}
              onMouseEnter={() => setHoveredCard(tarjeta.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div style={styles.cardDecoration} />
              <div style={{
                ...styles.cardIconWrapper,
                ...(hoveredCard === tarjeta.id ? styles.cardIconWrapperHover : {}),
              }}>
                <span style={styles.cardIcon}>{tarjeta.icon}</span>
              </div>
              <h3 style={{
                ...styles.cardTitle,
                ...(hoveredCard === tarjeta.id ? styles.cardTitleHover : {}),
              }}>
                {tarjeta.title}
              </h3>
              <p style={styles.cardDescription}>{tarjeta.desc}</p>
              <div style={{
                ...styles.cardArrow,
                ...(hoveredCard === tarjeta.id ? styles.cardArrowVisible : {}),
              }}>
                →
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  // Contenedor principal
  container: {
    padding: '24px 20px 40px',
    maxWidth: '1200px',
    margin: '0 auto',
    minHeight: 'calc(100vh - 60px)',
  },

  // Sección de bienvenida
  welcomeSection: {
    background: 'linear-gradient(135deg, #75b760 0%, #5fa047 50%, #4a8a38 100%)',
    borderRadius: '20px',
    padding: '32px',
    marginBottom: '24px',
    boxShadow: '0 10px 40px rgba(117, 183, 96, 0.3)',
    position: 'relative',
    overflow: 'hidden',
  },

  welcomeDecoration: {
    position: 'absolute',
    top: '-50%',
    right: '-10%',
    width: '300px',
    height: '300px',
    background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
    borderRadius: '50%',
    pointerEvents: 'none',
  },

  welcomeDecoration2: {
    position: 'absolute',
    bottom: '-30%',
    left: '-5%',
    width: '200px',
    height: '200px',
    background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
    borderRadius: '50%',
    pointerEvents: 'none',
  },

  welcomeContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    position: 'relative',
    zIndex: 1,
  },

  // Avatar
  avatarContainer: {
    position: 'relative',
    flexShrink: 0,
  },

  avatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
    border: '3px solid rgba(255, 255, 255, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '28px',
    fontWeight: '700',
    color: 'white',
    fontFamily: "'Niramit', sans-serif",
    textShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },

  // Texto de bienvenida
  welcomeText: {
    flex: 1,
  },

  greeting: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '16px',
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: "'Lora', serif",
    marginBottom: '4px',
    fontWeight: '500',
  },

  title: {
    fontSize: '32px',
    fontWeight: '700',
    color: 'white',
    marginBottom: '8px',
    fontFamily: "'Niramit', sans-serif",
    textShadow: '0 2px 10px rgba(0,0,0,0.15)',
    letterSpacing: '-0.5px',
    lineHeight: '1.2',
  },

  subtitle: {
    fontSize: '15px',
    color: 'rgba(255, 255, 255, 0.85)',
    fontFamily: "'Lora', serif",
    fontWeight: '400',
  },

  // Badge de rol
  roleBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: '12px 20px',
    borderRadius: '50px',
    marginTop: '20px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
    position: 'relative',
    zIndex: 1,
  },

  roleIcon: {
    fontSize: '20px',
  },

  roleText: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#5fa047',
    fontFamily: "'Niramit', sans-serif",
    letterSpacing: '0.3px',
  },

  // Sección de estadísticas
  statsSection: {
    marginBottom: '32px',
  },

  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: '16px',
    fontFamily: "'Niramit', sans-serif",
  },

  widgetsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '16px',
  },

  widget: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '20px',
    textDecoration: 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    border: '1px solid rgba(0,0,0,0.04)',
    transition: 'all 0.3s ease',
    position: 'relative',
  },

  widgetHover: {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
  },

  widgetIconBg: {
    width: '56px',
    height: '56px',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  widgetIcon: {
    fontSize: '28px',
  },

  widgetContent: {
    textAlign: 'center',
  },

  widgetValue: {
    display: 'block',
    fontSize: '28px',
    fontWeight: '700',
    fontFamily: "'Niramit', sans-serif",
    lineHeight: '1',
  },

  widgetLabel: {
    display: 'block',
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '4px',
    fontFamily: "'Niramit', sans-serif",
  },

  widgetBadge: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    color: 'white',
    fontSize: '12px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Sección de accesos rápidos
  quickAccessSection: {
    marginTop: '8px',
  },

  // Grid de tarjetas
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '20px',
  },

  // Tarjetas
  card: {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    textDecoration: 'none',
    color: 'inherit',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    border: '1px solid rgba(0,0,0,0.04)',
    display: 'flex',
    flexDirection: 'column',
  },

  cardHover: {
    transform: 'translateY(-6px)',
    boxShadow: '0 16px 32px rgba(117, 183, 96, 0.2)',
    borderColor: '#75b760',
  },

  cardDecoration: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '100px',
    height: '100px',
    background: 'linear-gradient(135deg, rgba(117, 183, 96, 0.05) 0%, transparent 100%)',
    borderRadius: '0 16px 0 100%',
    transition: 'opacity 0.3s ease',
    pointerEvents: 'none',
  },

  cardIconWrapper: {
    width: '56px',
    height: '56px',
    borderRadius: '14px',
    background: 'linear-gradient(135deg, #f0f9ed 0%, #e3f2df 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
    transition: 'all 0.3s ease',
  },

  cardIconWrapperHover: {
    background: 'linear-gradient(135deg, #75b760 0%, #5fa047 100%)',
    transform: 'scale(1.1) rotate(5deg)',
  },

  cardIcon: {
    fontSize: '28px',
    transition: 'transform 0.3s ease',
  },

  cardTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: '6px',
    fontFamily: "'Niramit', sans-serif",
    transition: 'color 0.3s ease',
  },

  cardTitleHover: {
    color: '#5fa047',
  },

  cardDescription: {
    fontSize: '13px',
    color: '#666666',
    lineHeight: '1.5',
    flex: 1,
    fontFamily: "'Lora', serif",
  },

  cardArrow: {
    position: 'absolute',
    bottom: '20px',
    right: '20px',
    fontSize: '18px',
    color: '#75b760',
    opacity: 0,
    transform: 'translateX(-10px)',
    transition: 'all 0.3s ease',
  },

  cardArrowVisible: {
    opacity: 1,
    transform: 'translateX(0)',
  },

  // Sección de Entrenamientos del Mes
  entrenamientosSection: {
    marginBottom: '32px',
  },

  entrenamientosGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '12px',
  },

  entrenamientoCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '16px 20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    border: '1px solid rgba(0,0,0,0.04)',
  },

  entrenamientoAvatar: {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #75b760, #5fa047)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '18px',
    flexShrink: 0,
    fontFamily: "'Niramit', sans-serif",
  },

  entrenamientoInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },

  entrenamientoNombre: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1a1a2e',
    fontFamily: "'Niramit', sans-serif",
  },

  entrenamientoTotal: {
    fontSize: '12px',
    color: '#6b7280',
    fontFamily: "'Niramit', sans-serif",
  },

  entrenamientoNumero: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#75b760',
    fontFamily: "'Niramit', sans-serif",
    minWidth: '40px',
    textAlign: 'right',
  },

  entrenamientosLink: {
    display: 'inline-block',
    marginTop: '12px',
    fontSize: '13px',
    color: '#75b760',
    fontWeight: '600',
    textDecoration: 'none',
    fontFamily: "'Niramit', sans-serif",
  },
};

export default Dashboard;
