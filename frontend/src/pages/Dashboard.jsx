import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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

function Dashboard() {
  const { usuario } = useAuth();
  const saludo = obtenerSaludo();
  const [hoveredCard, setHoveredCard] = useState(null);

  // Configuración de tarjetas
  const tarjetasBase = [
    { id: 'clientes', path: '/clientes', icon: '👥', title: 'Clientes', desc: 'Gestiona la información de tus clientes' },
    { id: 'reservas', path: '/reservas', icon: '📅', title: 'Reservas', desc: 'Administra las reservas y horarios' },
    { id: 'calendario-excel', path: '/calendario-reservas', icon: '📊', title: 'Calendario Excel', desc: 'Vista tipo Excel con todos los entrenadores' },
  ];

  const tarjetasGerente = [
    { id: 'calendarios', path: '/calendario-gerente', icon: '📆', title: 'Calendarios', desc: 'Vista de todos los entrenadores' },
    { id: 'entrenadores', path: '/entrenadores', icon: '👨‍🏫', title: 'Entrenadores', desc: 'Gestiona los perfiles de entrenadores' },
    { id: 'vacaciones', path: '/vacaciones', icon: '🏖️', title: 'Vacaciones', desc: 'Control de vacaciones del equipo' },
  ];

  const tarjetasEntrenador = [
    { id: 'mi-calendario', path: '/calendario', icon: '📆', title: 'Mi Calendario', desc: 'Vista semanal de tus sesiones' },
  ];

  const tarjetas = usuario?.rol === 'gerente'
    ? [...tarjetasBase, ...tarjetasGerente]
    : [...tarjetasBase, ...tarjetasEntrenador];

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

      {/* Grid de Tarjetas */}
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
            <h2 style={{
              ...styles.cardTitle,
              ...(hoveredCard === tarjeta.id ? styles.cardTitleHover : {}),
            }}>
              {tarjeta.title}
            </h2>
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
    marginBottom: '32px',
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
    fontSize: '36px',
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

  // Grid de tarjetas
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
  },

  // Tarjetas
  card: {
    backgroundColor: 'white',
    padding: '28px',
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
    transform: 'translateY(-8px)',
    boxShadow: '0 20px 40px rgba(117, 183, 96, 0.2)',
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
    width: '64px',
    height: '64px',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, #f0f9ed 0%, #e3f2df 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px',
    transition: 'all 0.3s ease',
  },

  cardIconWrapperHover: {
    background: 'linear-gradient(135deg, #75b760 0%, #5fa047 100%)',
    transform: 'scale(1.1) rotate(5deg)',
  },

  cardIcon: {
    fontSize: '32px',
    transition: 'transform 0.3s ease',
  },

  cardTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: '8px',
    fontFamily: "'Niramit', sans-serif",
    transition: 'color 0.3s ease',
  },

  cardTitleHover: {
    color: '#5fa047',
  },

  cardDescription: {
    fontSize: '14px',
    color: '#666666',
    lineHeight: '1.6',
    flex: 1,
    fontFamily: "'Lora', serif",
  },

  cardArrow: {
    position: 'absolute',
    bottom: '24px',
    right: '24px',
    fontSize: '20px',
    color: '#75b760',
    opacity: 0,
    transform: 'translateX(-10px)',
    transition: 'all 0.3s ease',
  },

  cardArrowVisible: {
    opacity: 1,
    transform: 'translateX(0)',
  },
};

export default Dashboard;
