import { useState, useEffect } from 'react'
import { getTerceroPerfil } from '../../api/terceros'

const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const IconUser = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)
const IconCompra = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
)
const IconVale = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="9" y1="13" x2="15" y2="13"/>
    <line x1="9" y1="17" x2="13" y2="17"/>
  </svg>
)
const IconLetra = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)

const fmt = (n) =>
  Number(n || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

const TIPO_LABEL = {
  empresa: 'Empresa',
  caficultor: 'Caficultor',
  ambos: 'Ambos',
}

const ESTADO_STYLE = {
  pendiente: { bg: '#fef2f2', color: '#dc2626' },
  parcial:   { bg: '#fefce8', color: '#ca8a04' },
  pagado:    { bg: '#f0fdf4', color: '#16a34a' },
}

function SeccionHeader({ icono, titulo, count, colorIcono }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <span style={{ color: colorIcono }}>{icono}</span>
      <h3 style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', margin: 0 }}>{titulo}</h3>
      {count !== undefined && (
        <span style={{
          fontSize: 11, fontWeight: 600, background: '#f1f5f9',
          color: '#64748b', padding: '1px 8px', borderRadius: 99,
        }}>{count}</span>
      )}
    </div>
  )
}

export default function TerceroPerfil({ terceroId, onClose }) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [tab, setTab]         = useState('compras')

  useEffect(() => {
    getTerceroPerfil(terceroId)
      .then(res => setData(res.data))
      .catch(() => setError('No se pudo cargar el perfil.'))
      .finally(() => setLoading(false))
  }, [terceroId])

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div onClick={handleBackdrop} style={{
      position: 'fixed', inset: 0,
      background: 'rgba(15,23,42,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 50, padding: 16,
    }}>
      <div style={{
        background: 'white', borderRadius: 12,
        width: '100%', maxWidth: 780,
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        display: 'flex', flexDirection: 'column',
      }}>

        {/* Cabecera */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '18px 20px', borderBottom: '1px solid #f1f5f9',
          position: 'sticky', top: 0, background: 'white', zIndex: 1,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: '#f0fdf4', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: '#16a34a',
            }}>
              <IconUser />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                {loading ? 'Cargando...' : data?.tercero?.nombre}
              </h2>
              {data?.tercero && (
                <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>
                  {TIPO_LABEL[data.tercero.tipo]}
                  {data.tercero.cedula && ` · CC ${data.tercero.cedula}`}
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 30, height: 30, borderRadius: 6, border: 'none',
            background: 'transparent', cursor: 'pointer', color: '#94a3b8',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <IconX />
          </button>
        </div>

        {/* Cuerpo */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 60 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%',
              border: '3px solid #e2e8f0', borderTopColor: '#16a34a',
              animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        ) : error ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#dc2626', fontSize: 14 }}>{error}</div>
        ) : (
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Tarjetas resumen */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
              {[
                { label: 'Total compras', value: data.resumen.total_compras, suffix: 'compra(s)', color: '#2563eb', bg: '#eff6ff' },
                { label: 'Total comprado', value: fmt(data.resumen.total_comprado), color: '#16a34a', bg: '#f0fdf4' },
                { label: 'Saldo vales', value: fmt(data.resumen.saldo_vales), color: '#ca8a04', bg: '#fefce8' },
                { label: 'Saldo letras', value: fmt(data.resumen.saldo_letras), color: '#dc2626', bg: '#fef2f2' },
              ].map((card, i) => (
                <div key={i} style={{
                  background: card.bg, borderRadius: 8,
                  padding: '12px 14px',
                }}>
                  <p style={{ fontSize: 11, color: '#64748b', margin: 0, fontWeight: 500 }}>{card.label}</p>
                  <p style={{ fontSize: 18, fontWeight: 700, color: card.color, margin: '4px 0 0' }}>
                    {card.value}
                    {card.suffix && <span style={{ fontSize: 11, fontWeight: 400, color: '#94a3b8', marginLeft: 4 }}>{card.suffix}</span>}
                  </p>
                </div>
              ))}
            </div>

            {/* Datos del tercero */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '14px 16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                {[
                  { label: 'Teléfono', value: data.tercero.telefono },
                  { label: 'WhatsApp', value: data.tercero.telefono_whatsapp },
                  { label: 'Dirección', value: data.tercero.direccion },
                  { label: 'Estado', value: data.tercero.activo ? 'Activo' : 'Inactivo' },
                ].filter(d => d.value).map((d, i) => (
                  <div key={i}>
                    <p style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600,
                      textTransform: 'uppercase', letterSpacing: '0.4px', margin: 0 }}>{d.label}</p>
                    <p style={{ fontSize: 13, color: '#0f172a', margin: '2px 0 0' }}>{d.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #e2e8f0', paddingBottom: 0 }}>
              {[
                { key: 'compras', label: 'Compras', count: data.compras.length, icono: <IconCompra /> },
                { key: 'vales', label: 'Vales', count: data.cuentas_por_pagar.length, icono: <IconVale /> },
                { key: 'letras', label: 'Letras de cambio', count: data.letras_cambio.length, icono: <IconLetra /> },
              ].map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 14px', fontSize: 13, fontWeight: 600,
                    border: 'none', cursor: 'pointer', borderRadius: '6px 6px 0 0',
                    background: tab === t.key ? 'white' : 'transparent',
                    color: tab === t.key ? '#16a34a' : '#64748b',
                    borderBottom: tab === t.key ? '2px solid #16a34a' : '2px solid transparent',
                    marginBottom: -1,
                  }}>
                  {t.icono}
                  {t.label}
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    background: tab === t.key ? '#f0fdf4' : '#f1f5f9',
                    color: tab === t.key ? '#16a34a' : '#94a3b8',
                    padding: '1px 6px', borderRadius: 99,
                  }}>{t.count}</span>
                </button>
              ))}
            </div>

            {/* Tab Compras */}
            {tab === 'compras' && (
              <div>
                <SeccionHeader icono={<IconCompra />} titulo="Historial de compras"
                  count={data.compras.length} colorIcono="#2563eb" />
                {data.compras.length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
                    Sin compras registradas</p>
                ) : (
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: '#0f172a' }}>
                          {['#', 'Fecha', 'Detalle', 'Total'].map(col => (
                            <th key={col} style={{ padding: '9px 14px', textAlign: 'left',
                              fontSize: 11, fontWeight: 600, color: '#e2e8f0',
                              textTransform: 'uppercase', letterSpacing: '0.05em' }}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.compras.map((c, i) => (
                          <tr key={c.id}
                            style={{ background: i % 2 === 0 ? 'white' : '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '9px 14px', color: '#16a34a', fontWeight: 700, fontFamily: 'monospace' }}>
                              #{c.id}
                            </td>
                            <td style={{ padding: '9px 14px', color: '#475569' }}>{c.fecha}</td>
                            <td style={{ padding: '9px 14px', color: '#475569' }}>
                              {c.detalles.map((d, j) => (
                                <span key={j} style={{ display: 'block', fontSize: 12 }}>
                                  {d.tipo_cafe} — {d.kilos} kg
                                  {d.es_deposito ? (
                                    <span style={{ color: '#ca8a04', marginLeft: 4, fontSize: 11 }}>
                                      {d.liquidado ? '(Liquidado)' : '(Depósito pendiente)'}
                                    </span>
                                  ) : (
                                    d.precio_kilo && (
                                      <span style={{ color: '#94a3b8', marginLeft: 4, fontSize: 11 }}>
                                        × {fmt(d.precio_kilo)}/kg
                                      </span>
                                    )
                                  )}
                                </span>
                              ))}
                            </td>
                            <td style={{ padding: '9px 14px', fontWeight: 700, color: '#0f172a' }}>
                              {fmt(c.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Tab Vales */}
            {tab === 'vales' && (
              <div>
                <SeccionHeader icono={<IconVale />} titulo="Cuentas por pagar (Vales)"
                  count={data.cuentas_por_pagar.length} colorIcono="#ca8a04" />
                {data.cuentas_por_pagar.length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
                    Sin vales registrados</p>
                ) : (
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: '#0f172a' }}>
                          {['#', 'Total', 'Abonado', 'Saldo', 'Estado'].map(col => (
                            <th key={col} style={{ padding: '9px 14px', textAlign: 'left',
                              fontSize: 11, fontWeight: 600, color: '#e2e8f0',
                              textTransform: 'uppercase', letterSpacing: '0.05em' }}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.cuentas_por_pagar.map((cp, i) => {
                          const est = ESTADO_STYLE[cp.estado] || ESTADO_STYLE.pendiente
                          return (
                            <tr key={cp.id}
                              style={{ background: i % 2 === 0 ? 'white' : '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '9px 14px', color: '#94a3b8', fontFamily: 'monospace' }}>#{cp.id}</td>
                              <td style={{ padding: '9px 14px', fontWeight: 600, color: '#0f172a' }}>{fmt(cp.valor_total)}</td>
                              <td style={{ padding: '9px 14px', color: '#16a34a', fontWeight: 600 }}>{fmt(cp.valor_pagado)}</td>
                              <td style={{ padding: '9px 14px', color: '#dc2626', fontWeight: 700 }}>{fmt(cp.saldo)}</td>
                              <td style={{ padding: '9px 14px' }}>
                                <span style={{ background: est.bg, color: est.color,
                                  fontSize: 11, fontWeight: 600, padding: '2px 8px',
                                  borderRadius: 99, textTransform: 'capitalize' }}>
                                  {cp.estado}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Tab Letras */}
            {tab === 'letras' && (
              <div>
                <SeccionHeader icono={<IconLetra />} titulo="Letras de cambio"
                  count={data.letras_cambio.length} colorIcono="#dc2626" />
                {data.letras_cambio.length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
                    Sin letras de cambio registradas</p>
                ) : (
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: '#0f172a' }}>
                          {['#', 'Total', 'Abonado', 'Saldo', 'Estado', 'Notas'].map(col => (
                            <th key={col} style={{ padding: '9px 14px', textAlign: 'left',
                              fontSize: 11, fontWeight: 600, color: '#e2e8f0',
                              textTransform: 'uppercase', letterSpacing: '0.05em' }}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.letras_cambio.map((l, i) => {
                          const est = ESTADO_STYLE[l.estado] || ESTADO_STYLE.pendiente
                          return (
                            <tr key={l.id}
                              style={{ background: i % 2 === 0 ? 'white' : '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '9px 14px', color: '#94a3b8', fontFamily: 'monospace' }}>#{l.id}</td>
                              <td style={{ padding: '9px 14px', fontWeight: 600, color: '#0f172a' }}>{fmt(l.valor_total)}</td>
                              <td style={{ padding: '9px 14px', color: '#16a34a', fontWeight: 600 }}>{fmt(l.valor_abonado)}</td>
                              <td style={{ padding: '9px 14px', color: '#dc2626', fontWeight: 700 }}>{fmt(l.saldo)}</td>
                              <td style={{ padding: '9px 14px' }}>
                                <span style={{ background: est.bg, color: est.color,
                                  fontSize: 11, fontWeight: 600, padding: '2px 8px',
                                  borderRadius: 99, textTransform: 'capitalize' }}>
                                  {l.estado}
                                </span>
                              </td>
                              <td style={{ padding: '9px 14px', color: '#64748b', fontSize: 12 }}>
                                {l.notas || '—'}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* Pie */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid #f1f5f9', position: 'sticky', bottom: 0, background: 'white' }}>
          <button onClick={onClose} style={{
            width: '100%', padding: 9, border: '1px solid #e2e8f0',
            borderRadius: 6, background: 'white', color: '#475569',
            fontSize: 13, fontWeight: 500, cursor: 'pointer',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
            onMouseLeave={e => e.currentTarget.style.background = 'white'}>
            Cerrar
          </button>
        </div>

      </div>
    </div>
  )
}