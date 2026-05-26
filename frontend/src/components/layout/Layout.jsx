import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'

const TITLES = {
  '/': 'Dashboard',
  '/terceros': 'Terceros',
  '/inventario': 'Inventario',
  '/compras': 'Compras',
  '/ventas': 'Ventas',
  '/precios': 'Precios diarios',
  '/traslados': 'Traslados',
}

const FECHA = new Date().toLocaleDateString('es-CO', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
})

export default function Layout() {
  const location = useLocation()
  const titulo = TITLES[location.pathname] || 'Café System'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Topbar */}
        <div style={{
          background: 'white',
          borderBottom: '1px solid #e2e8f0',
          padding: '0 24px',
          height: '52px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#94a3b8', fontSize: '13px' }}>Inicio</span>
            <span style={{ color: '#cbd5e1', fontSize: '13px' }}>/</span>
            <span style={{ color: '#0f172a', fontSize: '13px', fontWeight: 500 }}>{titulo}</span>
          </div>
          <span style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'capitalize' }}>
            {FECHA}
          </span>
        </div>

        {/* Contenido */}
        <main style={{
          flex: 1,
          padding: '28px 28px',
          overflowY: 'auto',
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}