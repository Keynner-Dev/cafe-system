import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import TercerosPage from './pages/terceros/TercerosPage'
import InventarioPage from './pages/inventario/InventarioPage'
import ComprasPage from './pages/compras/ComprasPage'
import VentasPage from './pages/ventas/VentasPage'
import PreciosPage from './pages/precios/PreciosPage'
import TrasladosPage from './pages/inventario/TrasladosPage'
import UsuariosPage from './pages/usuarios/UsuariosPage'
import CajaPage from './pages/caja/CajaPage'      // ← nueva línea

function RutaProtegida({ children }) {
  const { usuario, cargando } = useAuth()

  if (cargando) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: '#f8fafc',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            border: '3px solid #e2e8f0', borderTopColor: '#16a34a',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 12px',
          }} />
          <p style={{ color: '#94a3b8', fontSize: '13px' }}>Cargando...</p>
        </div>
      </div>
    )
  }

  if (!usuario) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const { usuario } = useAuth()

  return (
    <Routes>
      <Route
        path="/login"
        element={usuario ? <Navigate to="/" replace /> : <LoginPage />}
      />

      <Route path="/" element={
        <RutaProtegida>
          <Layout />
        </RutaProtegida>
      }>
        <Route index element={<Dashboard />} />
        <Route path="terceros"   element={<TercerosPage />} />
        <Route path="inventario" element={<InventarioPage />} />
        <Route path="compras"    element={<ComprasPage />} />
        <Route path="ventas"     element={<VentasPage />} />
        <Route path="precios"    element={<PreciosPage />} />
        <Route path="traslados"  element={<TrasladosPage />} />
        <Route path="usuarios"   element={<UsuariosPage />} />
        <Route path="caja"       element={<CajaPage />} />
      </Route>
    </Routes>
  )
}