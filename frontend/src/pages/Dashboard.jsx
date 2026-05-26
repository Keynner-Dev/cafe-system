import { useEffect, useState } from 'react'
import { getDashboard } from '../api/dashboard'
import { useNavigate } from 'react-router-dom'
 
// ─── Utilidades de formato ────────────────────────────────────────────────────
const formatCOP = (val) => `$${Number(val || 0).toLocaleString('es-CO')}`
const formatKg  = (val) => `${Number(val || 0).toLocaleString('es-CO')} kg`
 
// ─── Iconos SVG inline (sin emojis) ──────────────────────────────────────────
const IconCompras = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
)
const IconVentas = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
)
const IconStock = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>
)
const IconDeposito = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
)
const IconArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
)
const IconBodega = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
)
const IconCafe = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
    <line x1="6" y1="1" x2="6" y2="4"/>
    <line x1="10" y1="1" x2="10" y2="4"/>
    <line x1="14" y1="1" x2="14" y2="4"/>
  </svg>
)
 
// ─── Tarjeta de métrica principal ─────────────────────────────────────────────
function CardMetrica({ icono, label, valor, sub, accentColor, bgColor }) {
  return (
    <div style={{
      background: 'white',
      border: '1px solid #e2e8f0',
      borderRadius: '10px',
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    }}>
      {/* Ícono con fondo de color */}
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '10px',
        background: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: accentColor,
        flexShrink: 0,
      }}>
        {icono}
      </div>
 
      {/* Texto */}
      <div style={{ minWidth: 0 }}>
        <p style={{ color: '#64748b', fontSize: '12px', fontWeight: 500, marginBottom: '2px' }}>
          {label}
        </p>
        <p style={{ color: '#0f172a', fontSize: '22px', fontWeight: 700, lineHeight: 1.1 }}>
          {valor}
        </p>
        {sub && (
          <p style={{ color: '#94a3b8', fontSize: '11px', marginTop: '3px' }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  )
}
 
// ─── Barra de progreso con etiqueta ──────────────────────────────────────────
function BarraProgreso({ nombre, valor, total, colorBarra }) {
  const pct = total > 0 ? Math.min(100, (Number(valor) / Number(total)) * 100) : 0
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <span style={{ color: '#475569', fontSize: '13px' }}>{nombre}</span>
        <span style={{ color: '#0f172a', fontSize: '13px', fontWeight: 600 }}>{formatKg(valor)}</span>
      </div>
      <div style={{ width: '100%', background: '#f1f5f9', borderRadius: '99px', height: '6px' }}>
        <div style={{
          width: `${pct}%`,
          background: colorBarra,
          height: '6px',
          borderRadius: '99px',
          transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  )
}
 
// ─── Fila de lista (compras / ventas recientes) ───────────────────────────────
function FilaReciente({ titulo, subtitulo, monto }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 0',
      borderBottom: '1px solid #f1f5f9',
    }}>
      <div>
        <p style={{ color: '#0f172a', fontSize: '13px', fontWeight: 500 }}>{titulo}</p>
        <p style={{ color: '#94a3b8', fontSize: '11px', marginTop: '1px' }}>{subtitulo}</p>
      </div>
      <span style={{ color: '#0f172a', fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap', marginLeft: '12px' }}>
        {monto}
      </span>
    </div>
  )
}
 
// ─── Skeleton de carga ────────────────────────────────────────────────────────
function Skeleton({ height = 20, width = '100%', radius = 6 }) {
  return (
    <div style={{
      height, width, borderRadius: radius,
      background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
    }} />
  )
}
 
// ─── Componente principal ─────────────────────────────────────────────────────
export default function Dashboard() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate              = useNavigate()
 
  useEffect(() => {
    getDashboard()
      .then(res => setData(res.data))
      .finally(() => setLoading(false))
  }, [])
 
  // ── Estado de carga ──
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        <style>{`
          @keyframes shimmer {
            0%   { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
        {/* Encabezado skeleton */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Skeleton height={28} width={200} />
          <Skeleton height={16} width={300} />
        </div>
        {/* Métricas skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px' }}>
              <Skeleton height={80} />
            </div>
          ))}
        </div>
      </div>
    )
  }
 
  // ── Error ──
  if (!data) {
    return (
      <div style={{
        background: 'white', border: '1px solid #fee2e2', borderRadius: '10px',
        padding: '24px', color: '#dc2626', fontSize: '14px',
      }}>
        No se pudo cargar el dashboard. Verifica que el servidor esté activo.
      </div>
    )
  }
 
  // ── Fecha formateada desde el backend ──
  const fechaFormateada = new Date(data.hoy + 'T12:00:00').toLocaleDateString('es-CO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
 
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
 
      {/* ── Encabezado ── */}
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
          Dashboard
        </h1>
        <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px', textTransform: 'capitalize' }}>
          Resumen del día — {fechaFormateada}
        </p>
      </div>
 
      {/* ── Métricas principales (4 tarjetas) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <CardMetrica
          icono={<IconCompras />}
          label="Compras hoy"
          valor={formatCOP(data.compras.total_hoy)}
          sub={`${data.compras.cantidad_hoy} compra(s)`}
          accentColor="#2563eb"
          bgColor="#eff6ff"
        />
        <CardMetrica
          icono={<IconVentas />}
          label="Ventas hoy"
          valor={formatCOP(data.ventas.total_hoy)}
          sub={`${data.ventas.cantidad_hoy} venta(s)`}
          accentColor="#16a34a"
          bgColor="#f0fdf4"
        />
        <CardMetrica
          icono={<IconStock />}
          label="Stock total"
          valor={formatKg(data.stock.total_kilos)}
          sub="En todas las bodegas"
          accentColor="#d97706"
          bgColor="#fffbeb"
        />
        <CardMetrica
          icono={<IconDeposito />}
          label="Depósitos pendientes"
          valor={formatKg(data.depositos.kilos_pendientes)}
          sub={`${data.depositos.cantidad} depósito(s)`}
          accentColor="#ea580c"
          bgColor="#fff7ed"
        />
      </div>
 
      {/* ── Stock por bodega + por tipo ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
 
        {/* Stock por bodega */}
        <div style={{
          background: 'white', border: '1px solid #e2e8f0',
          borderRadius: '10px', padding: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <span style={{ color: '#16a34a' }}><IconBodega /></span>
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
              Stock por bodega
            </h2>
          </div>
 
          {data.stock.por_bodega.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '13px' }}>Sin datos disponibles</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {data.stock.por_bodega.map(b => (
                <BarraProgreso
                  key={b.bodega}
                  nombre={b.bodega}
                  valor={b.stock}
                  total={data.stock.total_kilos}
                  colorBarra="#16a34a"
                />
              ))}
            </div>
          )}
        </div>
 
        {/* Stock por tipo de café */}
        <div style={{
          background: 'white', border: '1px solid #e2e8f0',
          borderRadius: '10px', padding: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <span style={{ color: '#d97706' }}><IconCafe /></span>
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
              Stock por tipo de café
            </h2>
          </div>
 
          {data.stock.por_tipo.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '13px' }}>Sin stock disponible</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {data.stock.por_tipo.map(t => (
                <BarraProgreso
                  key={t.tipo}
                  nombre={t.tipo}
                  valor={t.stock}
                  total={data.stock.total_kilos}
                  colorBarra="#d97706"
                />
              ))}
            </div>
          )}
        </div>
      </div>
 
      {/* ── Últimas compras + últimas ventas ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
 
        {/* Últimas compras */}
        <div style={{
          background: 'white', border: '1px solid #e2e8f0',
          borderRadius: '10px', padding: '20px',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '4px',
          }}>
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
              Últimas compras
            </h2>
            <button
              onClick={() => navigate('/compras')}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#16a34a', fontSize: '12px', fontWeight: 500, padding: '4px 0',
              }}
            >
              Ver todas <IconArrow />
            </button>
          </div>
 
          {data.ultimas_compras.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '12px' }}>
              Sin compras registradas
            </p>
          ) : (
            <div>
              {data.ultimas_compras.map(c => (
                <FilaReciente
                  key={c.id}
                  titulo={c.proveedor}
                  subtitulo={c.fecha}
                  monto={formatCOP(c.total)}
                />
              ))}
            </div>
          )}
        </div>
 
        {/* Últimas ventas */}
        <div style={{
          background: 'white', border: '1px solid #e2e8f0',
          borderRadius: '10px', padding: '20px',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '4px',
          }}>
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
              Últimas ventas
            </h2>
            <button
              onClick={() => navigate('/ventas')}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#16a34a', fontSize: '12px', fontWeight: 500, padding: '4px 0',
              }}
            >
              Ver todas <IconArrow />
            </button>
          </div>
 
          {data.ultimas_ventas.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '12px' }}>
              Sin ventas registradas
            </p>
          ) : (
            <div>
              {data.ultimas_ventas.map(v => (
                <FilaReciente
                  key={v.id}
                  titulo={v.cliente}
                  subtitulo={v.fecha}
                  monto={formatCOP(v.total)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
 
    </div>
  )
}