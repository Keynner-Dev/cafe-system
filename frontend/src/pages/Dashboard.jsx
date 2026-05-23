import { useEffect, useState } from 'react'
import { getDashboard } from '../api/dashboard'
import { useNavigate } from 'react-router-dom'

const formatCOP = (val) => `$${Number(val || 0).toLocaleString('es-CO')}`
const formatKg = (val) => `${Number(val || 0).toLocaleString('es-CO')} kg`

function CardMetrica({ icono, label, valor, sub, color }) {
  return (
    <div className="bg-white rounded-xl shadow p-5 flex items-center gap-4">
      <div className={`${color} w-12 h-12 rounded-full flex items-center justify-center text-white text-xl flex-shrink-0`}>
        {icono}
      </div>
      <div>
        <p className="text-gray-500 text-sm">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{valor}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    getDashboard()
      .then(res => setData(res.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-gray-500">Cargando dashboard...</p>
  if (!data) return <p className="text-gray-500">No se pudo cargar el dashboard.</p>

  return (
    <div className="space-y-8">

      {/* Encabezado */}
      <div>
        <h2 className="text-3xl font-bold text-gray-800">Dashboard</h2>
        <p className="text-gray-500 text-sm mt-1">
          Resumen del día — {new Date(data.hoy + 'T12:00:00').toLocaleDateString('es-CO', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
          })}
        </p>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <CardMetrica
          icono="🛒"
          label="Compras hoy"
          valor={formatCOP(data.compras.total_hoy)}
          sub={`${data.compras.cantidad_hoy} compra(s)`}
          color="bg-blue-500"
        />
        <CardMetrica
          icono="💰"
          label="Ventas hoy"
          valor={formatCOP(data.ventas.total_hoy)}
          sub={`${data.ventas.cantidad_hoy} venta(s)`}
          color="bg-green-500"
        />
        <CardMetrica
          icono="📦"
          label="Stock total"
          valor={formatKg(data.stock.total_kilos)}
          sub="En todas las bodegas"
          color="bg-yellow-500"
        />
        <CardMetrica
          icono="⏳"
          label="Depósitos pendientes"
          valor={formatKg(data.depositos.kilos_pendientes)}
          sub={`${data.depositos.cantidad} depósito(s)`}
          color="bg-orange-500"
        />
      </div>

      {/* Stock por bodega y por tipo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Stock por bodega */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-bold text-gray-700 mb-4">📍 Stock por bodega</h3>
          {data.stock.por_bodega.length === 0 ? (
            <p className="text-gray-400 text-sm">Sin datos</p>
          ) : (
            <div className="space-y-3">
              {data.stock.por_bodega.map(b => (
                <div key={b.bodega}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{b.bodega}</span>
                    <span className="font-semibold text-gray-800">{formatKg(b.stock)}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (Number(b.stock) / Number(data.stock.total_kilos)) * 100)}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stock por tipo */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-bold text-gray-700 mb-4">☕ Stock por tipo de café</h3>
          {data.stock.por_tipo.length === 0 ? (
            <p className="text-gray-400 text-sm">Sin stock disponible</p>
          ) : (
            <div className="space-y-3">
              {data.stock.por_tipo.map(t => (
                <div key={t.tipo}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{t.tipo}</span>
                    <span className="font-semibold text-gray-800">{formatKg(t.stock)}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (Number(t.stock) / Number(data.stock.total_kilos)) * 100)}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Últimas compras y ventas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Últimas compras */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-700">🛒 Últimas compras</h3>
            <button
              onClick={() => navigate('/compras')}
              className="text-xs text-green-700 hover:underline"
            >
              Ver todas →
            </button>
          </div>
          {data.ultimas_compras.length === 0 ? (
            <p className="text-gray-400 text-sm">Sin compras registradas</p>
          ) : (
            <div className="space-y-2">
              {data.ultimas_compras.map(c => (
                <div key={c.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{c.proveedor}</p>
                    <p className="text-xs text-gray-400">{c.fecha}</p>
                  </div>
                  <span className="text-sm font-bold text-gray-800">{formatCOP(c.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Últimas ventas */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-700">💰 Últimas ventas</h3>
            <button
              onClick={() => navigate('/ventas')}
              className="text-xs text-green-700 hover:underline"
            >
              Ver todas →
            </button>
          </div>
          {data.ultimas_ventas.length === 0 ? (
            <p className="text-gray-400 text-sm">Sin ventas registradas</p>
          ) : (
            <div className="space-y-2">
              {data.ultimas_ventas.map(v => (
                <div key={v.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{v.cliente}</p>
                    <p className="text-xs text-gray-400">{v.fecha}</p>
                  </div>
                  <span className="text-sm font-bold text-gray-800">{formatCOP(v.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}