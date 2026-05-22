import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import TercerosPage from './pages/terceros/TercerosPage'
import InventarioPage from './pages/inventario/InventarioPage'
import ComprasPage from './pages/compras/ComprasPage'
import VentasPage from './pages/ventas/VentasPage'
import PreciosPage from './pages/precios/PreciosPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="terceros" element={<TercerosPage />} />
          <Route path="inventario" element={<InventarioPage />} />
          <Route path="compras" element={<ComprasPage />} />
          <Route path="ventas" element={<VentasPage />} />
          <Route path="precios" element={<PreciosPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}