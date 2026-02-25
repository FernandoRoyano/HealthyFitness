import { useState, useEffect } from 'react';
import { notificacionesAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

function NotificationCenter({ mostrar, onCerrar }) {
  const [notificaciones, setNotificaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (mostrar) {
      cargarNotificaciones();
    }
  }, [mostrar]);

  const cargarNotificaciones = async () => {
    try {
      setCargando(true);
      const { data } = await notificacionesAPI.obtenerTodas({ limite: 10 });
      setNotificaciones(data);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    } finally {
      setCargando(false);
    }
  };

  const handleMarcarLeida = async (id) => {
    try {
      await notificacionesAPI.marcarComoLeida(id);
      setNotificaciones(notificaciones.map(n =>
        n._id === id ? { ...n, leida: true } : n
      ));
    } catch (error) {
      console.error('Error al marcar notificación:', error);
    }
  };

  const handleMarcarTodasLeidas = async () => {
    try {
      await notificacionesAPI.marcarTodasComoLeidas();
      setNotificaciones(notificaciones.map(n => ({ ...n, leida: true })));
    } catch (error) {
      console.error('Error al marcar todas:', error);
    }
  };

  const handleClick = (notificacion) => {
    if (!notificacion.leida) {
      handleMarcarLeida(notificacion._id);
    }

    // Navegar según el tipo
    if (notificacion.relacionadoA.tipo === 'solicitud') {
      navigate('/solicitudes');
    }

    onCerrar();
  };

  const formatearTiempo = (fecha) => {
    const ahora = new Date();
    const creacion = new Date(fecha);
    const diff = Math.floor((ahora - creacion) / 1000); // diferencia en segundos

    if (diff < 60) return 'Ahora mismo';
    if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
    if (diff < 604800) return `hace ${Math.floor(diff / 86400)} días`;
    return creacion.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  if (!mostrar) return null;

  return (
    <>
      {/* Overlay para cerrar al hacer clic fuera */}
      <div style={styles.overlay} onClick={onCerrar} />

      {/* Panel de notificaciones */}
      <div style={styles.panel}>
        <div style={styles.header}>
          <h3 style={styles.title}>Notificaciones</h3>
          {notificaciones.some(n => !n.leida) && (
            <button onClick={handleMarcarTodasLeidas} style={styles.markAllButton}>
              Marcar todas como leídas
            </button>
          )}
        </div>

        <div style={styles.content}>
          {cargando ? (
            <div style={styles.loading}>Cargando...</div>
          ) : notificaciones.length === 0 ? (
            <div style={styles.empty}>No tienes notificaciones</div>
          ) : (
            notificaciones.map((notificacion) => (
              <div
                key={notificacion._id}
                style={{
                  ...styles.notificacion,
                  backgroundColor: notificacion.leida ? 'white' : '#f0f9ff'
                }}
                onClick={() => handleClick(notificacion)}
              >
                <div style={styles.notificacionHeader}>
                  <span style={styles.notificacionTitulo}>{notificacion.titulo}</span>
                  {!notificacion.leida && <span style={styles.badge}></span>}
                </div>
                <p style={styles.notificacionMensaje}>{notificacion.mensaje}</p>
                <span style={styles.notificacionTiempo}>
                  {formatearTiempo(notificacion.createdAt)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 999
  },
  panel: {
    position: 'fixed',
    top: '60px',
    right: '20px',
    width: '380px',
    maxHeight: '500px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    padding: '15px 20px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600',
    color: '#1a1a1a'
  },
  markAllButton: {
    fontSize: '12px',
    color: '#10b981',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 8px',
    fontWeight: '500'
  },
  content: {
    overflowY: 'auto',
    maxHeight: '440px'
  },
  loading: {
    padding: '40px',
    textAlign: 'center',
    color: '#666'
  },
  empty: {
    padding: '40px',
    textAlign: 'center',
    color: '#666',
    fontSize: '14px'
  },
  notificacion: {
    padding: '15px 20px',
    borderBottom: '1px solid #f3f4f6',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  notificacionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px'
  },
  notificacionTitulo: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1a1a1a'
  },
  badge: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#10b981'
  },
  notificacionMensaje: {
    fontSize: '13px',
    color: '#4b5563',
    margin: '0 0 6px 0',
    lineHeight: '1.4'
  },
  notificacionTiempo: {
    fontSize: '11px',
    color: '#9ca3af'
  }
};

export default NotificationCenter;
