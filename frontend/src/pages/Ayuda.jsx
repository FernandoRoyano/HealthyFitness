import { useState } from 'react';
import { Home, Users, Calendar, Dumbbell, Euro, Settings, Bell, LayoutDashboard, CalendarDays, ClipboardList, BarChart3, CreditCard } from 'lucide-react';
import './Ayuda.css';

const secciones = [
  {
    icon: <Home size={20} />,
    titulo: 'Inicio (Dashboard)',
    contenido: (
      <>
        <p>Resumen general del centro con los datos mas importantes del dia.</p>
        <ul className="ayuda-lista">
          <li>Sesiones programadas para hoy</li>
          <li>Clientes activos y nuevos registros</li>
          <li>Ingresos del mes</li>
          <li>Vista rapida de la actividad reciente</li>
        </ul>
      </>
    )
  },
  {
    icon: <Users size={20} />,
    titulo: 'Clientes',
    contenido: (
      <>
        <table className="ayuda-tabla">
          <thead>
            <tr>
              <th>Apartado</th>
              <th>Que contiene</th>
              <th>Funciones principales</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="ayuda-apartado-nombre">Clientes</td>
              <td>Listado completo de clientes del centro</td>
              <td>Crear, editar y eliminar clientes. Ver ficha detallada con historial de sesiones, mediciones y suscripcion. Importar/exportar datos.</td>
            </tr>
            <tr>
              <td className="ayuda-apartado-nombre">Leads</td>
              <td>Clientes potenciales (contactos interesados)</td>
              <td>Registrar leads, hacer seguimiento, convertir a cliente activo.</td>
            </tr>
          </tbody>
        </table>
      </>
    )
  },
  {
    icon: <Calendar size={20} />,
    titulo: 'Agenda',
    contenido: (
      <>
        <table className="ayuda-tabla">
          <thead>
            <tr>
              <th>Apartado</th>
              <th>Que contiene</th>
              <th>Funciones principales</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="ayuda-apartado-nombre">Agenda</td>
              <td>Calendario visual con todas las reservas</td>
              <td>Ver por dia/semana. Crear, mover y cancelar sesiones. Filtrar por entrenador. El gerente ve todos los entrenadores; el entrenador ve solo los suyos.</td>
            </tr>
            <tr>
              <td className="ayuda-apartado-nombre">Horario Base</td>
              <td>Plantillas semanales de disponibilidad</td>
              <td>Definir franjas horarias recurrentes por entrenador. Sirve como base para generar la agenda semanal automaticamente.</td>
            </tr>
          </tbody>
        </table>
      </>
    )
  },
  {
    icon: <Dumbbell size={20} />,
    titulo: 'Equipo',
    contenido: (
      <>
        <table className="ayuda-tabla">
          <thead>
            <tr>
              <th>Apartado</th>
              <th>Que contiene</th>
              <th>Funciones principales</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="ayuda-apartado-nombre">Entrenadores</td>
              <td>Listado del equipo de entrenadores</td>
              <td>Ver perfil, horarios y carga de trabajo de cada entrenador.</td>
            </tr>
            <tr>
              <td className="ayuda-apartado-nombre">Solicitudes</td>
              <td>Solicitudes de cambio de horario/sesion</td>
              <td>Los entrenadores crean solicitudes; el gerente las aprueba o rechaza. Aparece un badge con el contador de pendientes.</td>
            </tr>
            <tr>
              <td className="ayuda-apartado-nombre">Vacaciones</td>
              <td>Gestion de vacaciones del equipo</td>
              <td>Solicitar, aprobar y consultar periodos de vacaciones. Badge con contador de pendientes.</td>
            </tr>
          </tbody>
        </table>
      </>
    )
  },
  {
    icon: <Euro size={20} />,
    titulo: 'Finanzas',
    contenido: (
      <>
        <table className="ayuda-tabla">
          <thead>
            <tr>
              <th>Apartado</th>
              <th>Que contiene</th>
              <th>Funciones principales</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="ayuda-apartado-nombre">Facturacion</td>
              <td>Facturas mensuales por cliente</td>
              <td>Generar facturas, marcar como pagadas, exportar a PDF. Control de ingresos por mes.</td>
            </tr>
            <tr>
              <td className="ayuda-apartado-nombre">Tarifas</td>
              <td>Productos y tarifas del centro</td>
              <td>Crear y editar tipos de suscripcion, precios y bonos de sesiones.</td>
            </tr>
          </tbody>
        </table>
      </>
    )
  },
  {
    icon: <Settings size={20} />,
    titulo: 'Configuracion',
    contenido: (
      <>
        <ul className="ayuda-lista">
          <li>Datos del centro (nombre, direccion, horario de apertura)</li>
          <li>Datos fiscales (NIF, IBAN, banco)</li>
          <li>Personalizacion (logo, color corporativo)</li>
          <li>Configuracion de facturacion (prefijo, pie de factura, condiciones de pago)</li>
          <li>Configuracion de email para envio de facturas</li>
        </ul>
      </>
    )
  },
  {
    icon: <Bell size={20} />,
    titulo: 'Notificaciones',
    contenido: (
      <>
        <ul className="ayuda-lista">
          <li>Icono en la barra superior (campana)</li>
          <li>Muestra alertas: nuevas solicitudes, cambios en reservas, etc.</li>
          <li>Contador de notificaciones no leidas</li>
          <li>Pulsa en una notificacion para marcarla como leida</li>
        </ul>
      </>
    )
  }
];

const seccionesCliente = [
  { icon: <LayoutDashboard size={18} />, nombre: 'Mi Panel', descripcion: 'Dashboard personal: proximas sesiones y resumen de actividad.' },
  { icon: <CalendarDays size={18} />, nombre: 'Mi Calendario', descripcion: 'Calendario con las sesiones programadas.' },
  { icon: <Dumbbell size={18} />, nombre: 'Mis Sesiones', descripcion: 'Historial completo de sesiones realizadas y pendientes.' },
  { icon: <BarChart3 size={18} />, nombre: 'Mi Progreso', descripcion: 'Evolucion de mediciones corporales (peso, medidas, etc.) con graficas.' },
  { icon: <CreditCard size={18} />, nombre: 'Mi Suscripcion', descripcion: 'Estado de la suscripcion actual, sesiones restantes y proxima renovacion.' },
];

function Ayuda() {
  const [abiertos, setAbiertos] = useState({});

  const toggleSeccion = (index) => {
    setAbiertos(prev => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="ayuda-container">
      <div className="ayuda-header">
        <h1>Como se usa</h1>
        <p>Guia rapida de todas las secciones y funciones de la aplicacion.</p>
      </div>

      {/* PANEL DE GESTION */}
      <h2 className="ayuda-subtitulo">Panel de Gestion</h2>
      <p className="ayuda-subtitulo-desc">Para gerentes y entrenadores. Acceso desde la pantalla de login principal.</p>

      {secciones.map((seccion, index) => (
        <div className="ayuda-seccion" key={index}>
          <button className="ayuda-seccion-header" onClick={() => toggleSeccion(index)}>
            <span className="ayuda-seccion-icon">{seccion.icon}</span>
            <span className="ayuda-seccion-titulo">{seccion.titulo}</span>
            <span className={`ayuda-seccion-chevron ${abiertos[index] ? 'abierto' : ''}`}>▶</span>
          </button>
          <div className={`ayuda-seccion-contenido ${abiertos[index] ? 'visible' : ''}`}>
            {seccion.contenido}
          </div>
        </div>
      ))}

      <div className="ayuda-nota">
        <strong>Diferencia entre roles:</strong>
        <strong>Gerente:</strong> Acceso completo a todas las secciones. Ve todos los entrenadores y clientes. Aprueba solicitudes y vacaciones.<br />
        <strong>Entrenador:</strong> Ve solo sus propios clientes, su agenda y su facturacion. Puede crear solicitudes de cambio pero no aprobarlas.
      </div>

      <hr className="ayuda-separador" />

      {/* PORTAL DEL CLIENTE */}
      <h2 className="ayuda-subtitulo">Portal del Cliente</h2>
      <p className="ayuda-subtitulo-desc">Portal independiente donde los clientes acceden con sus propias credenciales.</p>

      <table className="ayuda-tabla">
        <thead>
          <tr>
            <th></th>
            <th>Apartado</th>
            <th>Que contiene</th>
          </tr>
        </thead>
        <tbody>
          {seccionesCliente.map((sec, i) => (
            <tr key={i}>
              <td style={{ fontSize: '18px', textAlign: 'center' }}>{sec.icon}</td>
              <td className="ayuda-apartado-nombre">{sec.nombre}</td>
              <td>{sec.descripcion}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Ayuda;
