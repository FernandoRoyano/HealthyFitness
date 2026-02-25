import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI } from '../services/api';
import { Users, Target, CalendarCheck, Inbox, Palmtree, Receipt, Briefcase, Dumbbell, Calendar, Table, GraduationCap, ArrowRight } from 'lucide-react';

// Obtener saludo según la hora del día
const obtenerSaludo = () => {
  const hora = new Date().getHours();
  if (hora >= 5 && hora < 12) return 'Buenos días';
  if (hora >= 12 && hora < 19) return 'Buenas tardes';
  return 'Buenas noches';
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
    { id: 'clientes', Icon: Users, label: 'Clientes Activos', value: stats?.clientesActivos, path: '/clientes', color: '#667eea' },
    { id: 'leads', Icon: Target, label: 'Leads Pendientes', value: stats?.leadsPendientes, path: '/leads', color: '#f59e0b' },
    { id: 'reservas', Icon: CalendarCheck, label: 'Reservas Hoy', value: stats?.reservasHoy, path: '/reservas', color: '#10b981' },
    { id: 'solicitudes', Icon: Inbox, label: 'Solicitudes', value: stats?.solicitudesPendientes, path: '/solicitudes', color: '#3b82f6' },
    { id: 'vacaciones', Icon: Palmtree, label: 'Vacaciones', value: stats?.vacacionesPendientes, path: '/vacaciones', color: '#8b5cf6' },
    { id: 'facturacion', Icon: Receipt, label: 'Facturación Mes', value: stats?.facturacionMes, path: '/facturacion', color: '#059669', formato: 'moneda' },
  ];

  const widgetsEntrenador = [
    { id: 'misclientes', Icon: Users, label: 'Mis Clientes', value: stats?.misClientes, path: '/clientes', color: '#667eea' },
    { id: 'leads', Icon: Target, label: 'Leads Pendientes', value: stats?.leadsPendientes, path: '/leads', color: '#f59e0b' },
    { id: 'reservas', Icon: CalendarCheck, label: 'Mis Reservas Hoy', value: stats?.misReservasHoy, path: '/reservas', color: '#10b981' },
    { id: 'vacaciones', Icon: Palmtree, label: 'Días Vacaciones', value: stats?.diasVacacionesDisponibles, path: '/vacaciones', color: '#8b5cf6' },
  ];

  const widgets = usuario?.rol === 'gerente' ? widgetsGerente : widgetsEntrenador;

  // Configuración de tarjetas de acceso rápido según rol
  const tarjetasGerente = [
    { id: 'clientes', path: '/clientes', Icon: Users, title: 'Clientes', desc: 'Gestiona la información de todos los clientes' },
    { id: 'leads', path: '/leads', Icon: Target, title: 'Leads', desc: 'Clientes potenciales y seguimiento' },
    { id: 'reservas', path: '/reservas', Icon: CalendarCheck, title: 'Reservas', desc: 'Administra las reservas y horarios' },
    { id: 'calendario-excel', path: '/calendario-reservas', Icon: Table, title: 'Calendario Excel', desc: 'Vista tipo Excel con todos los entrenadores' },
    { id: 'calendarios', path: '/calendario-gerente', Icon: Calendar, title: 'Calendarios', desc: 'Vista de todos los entrenadores' },
    { id: 'entrenadores', path: '/entrenadores', Icon: GraduationCap, title: 'Entrenadores', desc: 'Gestiona los perfiles de entrenadores' },
    { id: 'vacaciones', path: '/vacaciones', Icon: Palmtree, title: 'Vacaciones', desc: 'Control de vacaciones del equipo' },
    { id: 'facturacion', path: '/facturacion', Icon: Receipt, title: 'Facturación', desc: 'Gestión de facturas y pagos' },
  ];

  const tarjetasEntrenador = [
    { id: 'clientes', path: '/clientes', Icon: Users, title: 'Mis Clientes', desc: 'Gestiona la información de tus clientes asignados' },
    { id: 'leads', path: '/leads', Icon: Target, title: 'Leads', desc: 'Clientes potenciales y seguimiento' },
    { id: 'mi-calendario', path: '/calendario', Icon: Calendar, title: 'Mi Calendario', desc: 'Vista semanal de tus sesiones' },
    { id: 'vacaciones', path: '/vacaciones', Icon: Palmtree, title: 'Mis Vacaciones', desc: 'Solicitar y ver mis vacaciones' },
    { id: 'facturacion', path: '/facturacion', Icon: Receipt, title: 'Mi Facturación', desc: 'Ver facturación de tus clientes' },
  ];

  const tarjetas = usuario?.rol === 'gerente' ? tarjetasGerente : tarjetasEntrenador;

  return (
    <div style={styles.container}>
      {/* Sección de Bienvenida */}
      <div style={styles.welcomeSection}>
        <div style={styles.welcomeDecoration} />

        <div style={styles.welcomeContent}>
          <div style={styles.avatarContainer}>
            <div style={styles.avatar}>
              {obtenerIniciales(usuario?.nombre)}
            </div>
          </div>

          <div style={styles.welcomeText}>
            <span style={styles.greeting}>{saludo}</span>
            <h1 style={styles.title}>{usuario?.nombre}</h1>
            <p style={styles.subtitle}>Panel de Control</p>
          </div>
        </div>

        {usuario?.rol && (
          <div style={styles.roleBadge}>
            {usuario.rol === 'gerente' ? <Briefcase size={16} /> : <Dumbbell size={16} />}
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
              <div style={{ ...styles.widgetIconBg, backgroundColor: `${widget.color}12` }}>
                <widget.Icon size={22} style={{ color: widget.color }} />
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
          <div style={styles.entrenamientosTitleRow}>
            <h2 style={styles.sectionTitle}>Entrenamientos del Mes</h2>
            {stats.totalIngresosMes > 0 && (
              <span style={styles.entrenamientosTotalIngresos}>
                Total incentivos: {stats.totalIngresosMes.toFixed(2)}€
              </span>
            )}
          </div>
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
                    {item.ingresos > 0 && ` · ${item.ingresos.toFixed(2)}€`}
                  </span>
                </div>
                <div style={styles.entrenamientoNumero}>{item.total}</div>
              </div>
            ))}
          </div>
          <Link to="/entrenadores" style={styles.entrenamientosLink}>
            Ver detalle completo <ArrowRight size={14} style={{ verticalAlign: 'middle' }} />
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
              <div style={{
                ...styles.cardIconWrapper,
                ...(hoveredCard === tarjeta.id ? styles.cardIconWrapperHover : {}),
              }}>
                <tarjeta.Icon size={22} style={{
                  color: hoveredCard === tarjeta.id ? 'white' : '#10b981'
                }} />
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
                <ArrowRight size={16} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '24px 20px 40px',
    maxWidth: '1200px',
    margin: '0 auto',
    minHeight: 'calc(100vh - 56px)',
  },

  welcomeSection: {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
    borderRadius: '12px',
    padding: '28px 32px',
    marginBottom: '24px',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
    position: 'relative',
    overflow: 'hidden',
  },

  welcomeDecoration: {
    position: 'absolute',
    top: '-50%',
    right: '-10%',
    width: '300px',
    height: '300px',
    background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
    borderRadius: '50%',
    pointerEvents: 'none',
  },

  welcomeContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    position: 'relative',
    zIndex: 1,
  },

  avatarContainer: {
    position: 'relative',
    flexShrink: 0,
  },

  avatar: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.18)',
    backdropFilter: 'blur(10px)',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
    fontWeight: '700',
    color: 'white',
    fontFamily: "'Inter', sans-serif",
  },

  welcomeText: {
    flex: 1,
  },

  greeting: {
    display: 'block',
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.85)',
    fontFamily: "'Inter', sans-serif",
    marginBottom: '2px',
    fontWeight: '500',
  },

  title: {
    fontSize: '26px',
    fontWeight: '700',
    color: 'white',
    marginBottom: '4px',
    fontFamily: "'Inter', sans-serif",
    letterSpacing: '-0.3px',
    lineHeight: '1.2',
  },

  subtitle: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.75)',
    fontFamily: "'Inter', sans-serif",
    fontWeight: '400',
  },

  roleBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: '8px 16px',
    borderRadius: '6px',
    marginTop: '16px',
    position: 'relative',
    zIndex: 1,
    color: '#059669',
  },

  roleText: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#059669',
    fontFamily: "'Inter', sans-serif",
  },

  statsSection: {
    marginBottom: '28px',
  },

  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: '14px',
    fontFamily: "'Inter', sans-serif",
  },

  widgetsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))',
    gap: '14px',
  },

  widget: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '18px',
    textDecoration: 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    boxShadow: '0 1px 2px rgba(15,23,42,0.05)',
    border: '1px solid #e2e8f0',
    transition: 'all 0.15s ease',
    position: 'relative',
  },

  widgetHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(15,23,42,0.1)',
  },

  widgetIconBg: {
    width: '48px',
    height: '48px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  widgetContent: {
    textAlign: 'center',
  },

  widgetValue: {
    display: 'block',
    fontSize: '24px',
    fontWeight: '700',
    fontFamily: "'Inter', sans-serif",
    lineHeight: '1',
  },

  widgetLabel: {
    display: 'block',
    fontSize: '12px',
    color: '#64748b',
    marginTop: '4px',
    fontFamily: "'Inter', sans-serif",
  },

  widgetBadge: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    width: '18px',
    height: '18px',
    borderRadius: '4px',
    color: 'white',
    fontSize: '11px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  quickAccessSection: {
    marginTop: '8px',
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '16px',
  },

  card: {
    backgroundColor: 'white',
    padding: '22px',
    borderRadius: '8px',
    boxShadow: '0 1px 2px rgba(15,23,42,0.05)',
    textDecoration: 'none',
    color: 'inherit',
    transition: 'all 0.15s ease',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
  },

  cardHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(15,23,42,0.1)',
    borderColor: '#10b981',
  },

  cardIconWrapper: {
    width: '44px',
    height: '44px',
    borderRadius: '8px',
    backgroundColor: '#f0fdf4',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '14px',
    transition: 'all 0.15s ease',
  },

  cardIconWrapperHover: {
    backgroundColor: '#10b981',
  },

  cardTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: '6px',
    fontFamily: "'Inter', sans-serif",
    transition: 'color 0.15s ease',
  },

  cardTitleHover: {
    color: '#059669',
  },

  cardDescription: {
    fontSize: '13px',
    color: '#64748b',
    lineHeight: '1.5',
    flex: 1,
    fontFamily: "'Inter', sans-serif",
  },

  cardArrow: {
    position: 'absolute',
    bottom: '18px',
    right: '18px',
    color: '#10b981',
    opacity: 0,
    transform: 'translateX(-8px)',
    transition: 'all 0.15s ease',
  },

  cardArrowVisible: {
    opacity: 1,
    transform: 'translateX(0)',
  },

  entrenamientosSection: {
    marginBottom: '28px',
  },

  entrenamientosTitleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
  },

  entrenamientosTotalIngresos: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#059669',
    backgroundColor: '#f0fdf4',
    padding: '5px 12px',
    borderRadius: '6px',
    fontFamily: "'Inter', sans-serif",
  },

  entrenamientosGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '10px',
  },

  entrenamientoCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '14px 18px',
    boxShadow: '0 1px 2px rgba(15,23,42,0.05)',
    border: '1px solid #e2e8f0',
  },

  entrenamientoAvatar: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '16px',
    flexShrink: 0,
    fontFamily: "'Inter', sans-serif",
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
    color: '#0f172a',
    fontFamily: "'Inter', sans-serif",
  },

  entrenamientoTotal: {
    fontSize: '12px',
    color: '#64748b',
    fontFamily: "'Inter', sans-serif",
  },

  entrenamientoNumero: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#10b981',
    fontFamily: "'Inter', sans-serif",
    minWidth: '36px',
    textAlign: 'right',
  },

  entrenamientosLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    marginTop: '12px',
    fontSize: '13px',
    color: '#10b981',
    fontWeight: '600',
    textDecoration: 'none',
    fontFamily: "'Inter', sans-serif",
  },
};

export default Dashboard;
