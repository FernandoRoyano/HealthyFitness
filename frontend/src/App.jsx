import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ClienteAuthProvider } from './context/ClienteAuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ProtectedRouteCliente from './components/ProtectedRouteCliente';
import Layout from './components/Layout';
import LayoutCliente from './components/LayoutCliente';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Reservas from './pages/Reservas';
import Calendario from './pages/Calendario';
import CalendarioGerente from './pages/CalendarioGerente';
import CalendarioReservas from './pages/CalendarioReservas';
import Entrenadores from './pages/Entrenadores';
import AprobacionesCambios from './pages/AprobacionesCambios';
import SolicitudesCambio from './pages/SolicitudesCambio';
import PlantillasSemanales from './pages/PlantillasSemanales';
import CalendarioDual from './pages/CalendarioDual';
import Productos from './pages/Productos';
import Vacaciones from './pages/Vacaciones';
import Facturacion from './pages/Facturacion';
import ClientesPotenciales from './pages/ClientesPotenciales';
import ConfiguracionCentro from './pages/ConfiguracionCentro';
// Portal del Cliente
import LoginCliente from './pages/cliente/LoginCliente';
import DashboardCliente from './pages/cliente/DashboardCliente';
import CalendarioCliente from './pages/cliente/CalendarioCliente';
import MisSesiones from './pages/cliente/MisSesiones';
import MiProgreso from './pages/cliente/MiProgreso';
import MiSuscripcion from './pages/cliente/MiSuscripcion';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ClienteAuthProvider>
          <Routes>
            {/* ==================== RUTAS PÚBLICAS ==================== */}
            <Route path="/login" element={<Login />} />
            <Route path="/cliente/login" element={<LoginCliente />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/clientes"
            element={
              <ProtectedRoute>
                <Layout>
                  <Clientes />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reservas"
            element={
              <ProtectedRoute>
                <Layout>
                  <Reservas />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendario"
            element={
              <ProtectedRoute>
                <Layout>
                  <Calendario />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendario-gerente"
            element={
              <ProtectedRoute>
                <Layout>
                  <CalendarioGerente />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/entrenadores"
            element={
              <ProtectedRoute>
                <Layout>
                  <Entrenadores />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendario-reservas"
            element={
              <ProtectedRoute>
                <Layout>
                  <CalendarioReservas />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/aprobaciones"
            element={
              <ProtectedRoute>
                <Layout>
                  <AprobacionesCambios />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/solicitudes"
            element={
              <ProtectedRoute>
                <Layout>
                  <SolicitudesCambio />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/plantillas"
            element={
              <ProtectedRoute>
                <Layout>
                  <PlantillasSemanales />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendario-dual"
            element={
              <ProtectedRoute>
                <Layout>
                  <CalendarioDual />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/productos"
            element={
              <ProtectedRoute>
                <Layout>
                  <Productos />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/vacaciones"
            element={
              <ProtectedRoute>
                <Layout>
                  <Vacaciones />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/facturacion"
            element={
              <ProtectedRoute>
                <Layout>
                  <Facturacion />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/leads"
            element={
              <ProtectedRoute>
                <Layout>
                  <ClientesPotenciales />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/configuracion-centro"
            element={
              <ProtectedRoute>
                <Layout>
                  <ConfiguracionCentro />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* ==================== PORTAL DEL CLIENTE ==================== */}
            <Route
              path="/cliente"
              element={
                <ProtectedRouteCliente>
                  <LayoutCliente />
                </ProtectedRouteCliente>
              }
            >
              <Route index element={<Navigate to="/cliente/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardCliente />} />
              <Route path="calendario" element={<CalendarioCliente />} />
              <Route path="sesiones" element={<MisSesiones />} />
              <Route path="progreso" element={<MiProgreso />} />
              <Route path="suscripcion" element={<MiSuscripcion />} />
            </Route>
          </Routes>
        </ClienteAuthProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
