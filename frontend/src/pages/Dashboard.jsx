import { useEffect, useState } from 'react'
import { getDashboard } from '../api/dashboard'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const formatCOP = (val) => `$${Number(val || 0).toLocaleString('es-CO', { maximumFractionDigits: 0 })}`
const formatKg  = (val) => `${Number(val || 0).toLocaleString('es-CO')} kg`

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
const IconCaja = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    <line x1="12" y1="12" x2="12" y2="16" />
    <line x1="10" y1="14" x2="14" y2="14" />
  </svg>
)
const IconCoin = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M14.5 9a2.5 2.5 0 0 0-2.5-1c-1.5 0-2.5.8-2.5 2s1 1.7 2.5 2 2.5.8 2.5 2-1 2-2.5 2a2.5 2.5 0 0 1-2.5-1" />
    <line x1="12" y1="6" x2="12" y2="7.5" />
    <line x1="12" y1="16.5" x2="12" y2="18" />
  </svg>
)
const IconCxP = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="9" y1="13" x2="15" y2="13"/>
    <line x1="9" y1="17" x2="13" y2="17"/>
  </svg>
)
const IconAlerta = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
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

function CardMetrica({ icono, label, valor, sub, accentColor, bgColor }) {
  return (
    <div style={{
      background: 'white', border: '1px solid #e2e8f0',
      borderRadius: '10px', padding: '20px',
      display: 'flex', alignItems: 'center', gap: '16px',
    }}>
      <div style={{
        width: '48px', height: '48px', borderRadius: '10px',
        background: bgColor, display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: accentColor, flexShrink: 0,
      }}>
        {icono}
      </div>
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
          width: `${pct}%`, background: colorBarra, height: '6px',
          borderRadius: '99px', transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  )
}

function FilaReciente({ titulo, subtitulo, monto }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '10px 0', borderBottom: '1px solid #f1f5f9',
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

const PERIODO_LABELS = { dia: 'Hoy', semana: '7 días', mes: 'Este mes' }

export default function Dashboard() {
  const { usuario } = useAuth()
  const esJefe = usuario?.rol === 'jefe'
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState('dia')
  const navigate = useNavigate()

  useEffect(() => {
    getDashboard()
      .then(res => setData(res.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        <style>{`
          @keyframes shimmer {
            0%   { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Skeleton height={28} width={200} />
          <Skeleton height={16} width={300} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {[1,2,3,4,5].map(i => (
            <div key={i} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px' }}>
              <Skeleton height={80} />
            </div>
          ))}
        </div>
      </div>
    )
  }

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

  const fechaFormateada = new Date(data.hoy + 'T12:00:00').toLocaleDateString('es-CO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  const promedioActual = data.promedio_compra[periodo]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── Encabezado ── */}
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
          Dashboard{!esJefe && data.bodega_nombre ? ` — ${data.bodega_nombre}` : ''}
        </h1>
        <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px', textTransform: 'capitalize' }}>
          {esJefe ? 'Resumen general — ' : 'Resumen del día — '}{fechaFormateada}
        </p>
      </div>

      {/* ── Métricas principales ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <CardMetrica
          icono={<IconCompras />}
          label="Compras hoy"
          valor={formatCOP(data.compras.total_hoy)}
          sub={`${data.compras.cantidad_hoy} compra(s)`}
          accentColor="#2563eb"
          bgColor="#eff6ff"
        />
        <CardMetrica
          icono={<IconStock />}
          label="Stock total"
          valor={formatKg(data.stock.total_kilos)}
          sub={esJefe ? 'En todas las bodegas' : data.bodega_nombre}
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
        <CardMetrica
          icono={<IconVentas />}
          label="Remisiones hoy"
          valor={formatKg(data.remisiones.kilos_hoy)}
          sub={`${data.remisiones.cantidad_hoy} remisión(es)`}
          accentColor="#16a34a"
          bgColor="#f0fdf4"
        />
        {esJefe ? (
          <CardMetrica
            icono={<IconCaja />}
            label="Caja consolidada"
            valor={formatCOP(data.caja.consolidado)}
            sub={`${data.caja.por_bodega.length} bodega(s)`}
            accentColor="#475569"
            bgColor="#f1f5f9"
          />
        ) : (
          <CardMetrica
            icono={<IconCaja />}
            label="Saldo en caja"
            valor={formatCOP(data.caja.saldo)}
            sub={data.caja.bodega}
            accentColor="#475569"
            bgColor="#f1f5f9"
          />
        )}
        {esJefe && (
          <CardMetrica
            icono={<IconCxP />}
            label="Cuentas por pagar"
            valor={formatCOP(data.cuentas_por_pagar.saldo_pendiente)}
            sub={`${data.cuentas_por_pagar.cantidad} pendiente(s)`}
            accentColor="#dc2626"
            bgColor="#fef2f2"
          />
        )}
      </div>

      {/* ── Promedio de compra del periodo ── */}
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '14px', flexWrap: 'wrap', gap: '10px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#16a34a' }}><IconCoin /></span>
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
              Promedio de compra
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['dia', 'semana', 'mes'].map(p => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                style={{
                  padding: '5px 14px', borderRadius: '6px', fontSize: '12px',
                  fontWeight: 600, cursor: 'pointer', border: '1px solid',
                  background: periodo === p ? '#0f172a' : 'white',
                  color: periodo === p ? 'white' : '#475569',
                  borderColor: periodo === p ? '#0f172a' : '#e2e8f0',
                }}
              >
                {PERIODO_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        {promedioActual.kilos > 0 ? (
        <>
            <p style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            {formatCOP(promedioActual.precio_promedio)}
            <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 400 }}> / kg promedio pagado</span>
            </p>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
            {formatKg(promedioActual.kilos)} comprados en {promedioActual.cantidad_compras} compra(s)
            </p>

            {promedioActual.por_tipo && promedioActual.por_tipo.length > 1 && (
            <div style={{
                marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #f1f5f9',
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px',
            }}>
                {promedioActual.por_tipo.map((t, i) => (
                <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px' }}>
                    <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>{t.tipo_cafe}</p>
                    <p style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '2px 0 0' }}>
                    {formatCOP(t.precio_promedio)}<span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 400 }}>/kg</span>
                    </p>
                    <p style={{ fontSize: '10px', color: '#94a3b8', margin: '2px 0 0' }}>{formatKg(t.kilos)}</p>
                </div>
                ))}
            </div>
            )}
        </>
        ) : (
        <p style={{ color: '#94a3b8', fontSize: '13px' }}>
            Sin compras registradas en este periodo
        </p>
        )}
      </div>

      {/* ── Costo promedio del inventario (WAC) ── */}
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <span style={{ color: '#16a34a' }}><IconCoin /></span>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
            Costo promedio del inventario
          </h2>
        </div>
        {data.costo_inventario.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: '13px' }}>Sin inventario valorizado</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
            {data.costo_inventario.map((c, i) => (
              <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                  {esJefe ? `${c.bodega} — ${c.tipo_cafe}` : c.tipo_cafe}
                </p>
                <p style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', margin: '4px 0 0' }}>
                  {formatCOP(c.costo_promedio)}
                  <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 400 }}>/kg</span>
                </p>
                <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0' }}>
                  {formatKg(c.kilos)} en stock
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Pendientes por gestionar (solo jefe) ── */}
      {esJefe && (
        <div style={{ background: 'white', border: '1px solid #fde68a', borderRadius: '10px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#ca8a04' }}><IconAlerta /></span>
              <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                Pendientes por gestionar
              </h2>
            </div>
            {data.pendientes_gestion.length > 0 && (
              <span style={{
                fontSize: '11px', background: '#fefce8', color: '#ca8a04',
                padding: '2px 10px', borderRadius: '99px', fontWeight: 600,
              }}>
                {data.pendientes_gestion.length}
              </span>
            )}
          </div>
          {data.pendientes_gestion.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '12px' }}>
              Todo al día, no hay remisiones pendientes
            </p>
          ) : (
            <div style={{ marginTop: '8px' }}>
              {data.pendientes_gestion.map(p => (
                <div key={p.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 0', borderBottom: '1px solid #f1f5f9',
                }}>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                      {p.numero_remision} — {p.empresa}
                    </p>
                    <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0' }}>
                      {p.fecha} · Falta: {p.falta.map(f => f === 'precio' ? 'precio por kilo' : 'caja de flete').join(', ')}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/ventas')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '4px',
                      fontSize: '12px', fontWeight: 600, padding: '6px 12px',
                      borderRadius: '6px', border: '1px solid #fde68a',
                      background: '#fffbeb', color: '#92400e', cursor: 'pointer',
                    }}
                  >
                    Revisar <IconArrow />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Stock por bodega + por tipo ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: esJefe ? '1fr 1fr' : '1fr',
        gap: '16px',
      }}>
        {esJefe && (
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px' }}>
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
        )}

        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px' }}>
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
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
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
                  titulo={c.caficultor}
                  subtitulo={c.fecha}
                  monto={formatCOP(c.total)}
                />
              ))}
            </div>
          )}
        </div>

        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
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
                  titulo={`${v.numero_remision} — ${v.empresa}`}
                  subtitulo={v.fecha}
                  monto={formatKg(v.kilos)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}