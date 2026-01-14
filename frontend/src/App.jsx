import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
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

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
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
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
