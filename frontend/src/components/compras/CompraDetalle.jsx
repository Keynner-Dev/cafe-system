// ─── Iconos SVG inline ────────────────────────────────────────────────────────
const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

export default function CompraDetalle({ compra, onClose, onLiquidar }) {
  const formatCOP = (val) => `$${Number(val || 0).toLocaleString('es-CO')}`

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15, 23, 42, 0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 50, padding: '16px',
      }}
    >
      <div style={{
        background: 'white', borderRadius: '12px',
        width: '100%', maxWidth: '640px',
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }}>

        {/* ── Cabecera ── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '18px 20px', borderBottom: '1px solid #f1f5f9',
          position: 'sticky', top: 0, background: 'white', zIndex: 1,
        }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
              Compra #{compra.id}
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>
              {compra.fecha} — {compra.proveedor_nombre}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '30px', height: '30px', borderRadius: '6px',
              border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8' }}
          >
            <IconX />
          </button>
        </div>

        {/* ── Cuerpo ── */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

          {compra.detalles.map(d => (
            <div
              key={d.id}
              style={{
                border: d.es_deposito ? '1px solid #fde68a' : '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '14px',
                background: d.es_deposito ? '#fffbeb' : '#f8fafc',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>

                {/* Info izquierda */}
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                    {d.tipo_cafe_nombre}
                  </p>
                  <p style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    {d.bodega_nombre}
                  </p>
                  <p style={{ fontSize: '12px', color: '#475569', marginTop: '6px' }}>
                    {d.kilos} kg
                    {d.precio_kilo && ` × ${formatCOP(d.precio_kilo)}/kg`}
                  </p>
                </div>

                {/* Info derecha */}
                <div style={{ textAlign: 'right' }}>
                  {d.es_deposito ? (
                    <>
                      <span style={{
                        background: '#fef9c3', color: '#ca8a04',
                        fontSize: '11px', fontWeight: 600,
                        padding: '2px 8px', borderRadius: '99px',
                        display: 'inline-block', marginBottom: '6px',
                      }}>
                        Depósito
                      </span>
                      <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 6px' }}>
                        Pendiente: <strong>{d.kilos_pendientes_liquidar} kg</strong>
                      </p>
                      {Number(d.kilos_pendientes_liquidar) > 0 ? (
                        <button
                          onClick={() => onLiquidar(d)}
                          style={{
                            padding: '5px 12px', borderRadius: '5px', border: 'none',
                            background: '#ca8a04', color: 'white',
                            fontSize: '11px', fontWeight: 500, cursor: 'pointer',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#a16207'}
                          onMouseLeave={e => e.currentTarget.style.background = '#ca8a04'}
                        >
                          Liquidar
                        </button>
                      ) : (
                        <span style={{
                          background: '#f0fdf4', color: '#16a34a',
                          fontSize: '11px', fontWeight: 600,
                          padding: '2px 8px', borderRadius: '99px',
                          display: 'inline-block',
                        }}>
                          Liquidado ✓
                        </span>
                      )}
                    </>
                  ) : (
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                      {formatCOP(Number(d.kilos) * Number(d.precio_kilo))}
                    </span>
                  )}
                </div>
              </div>

              {/* Liquidaciones previas */}
              {d.es_deposito && d.liquidaciones?.length > 0 && (
                <div style={{
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid #fde68a',
                }}>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>
                    Liquidaciones registradas:
                  </p>
                  {d.liquidaciones.map(l => (
                    <div
                      key={l.id}
                      style={{
                        display: 'flex', justifyContent: 'space-between',
                        fontSize: '11px', color: '#475569',
                        padding: '3px 0',
                      }}
                    >
                      <span>{l.fecha} — {l.kilos} kg × {formatCOP(l.precio_kilo)}/kg</span>
                      <span style={{ fontWeight: 600 }}>{formatCOP(l.subtotal)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* ── Totales ── */}
          <div style={{
            background: '#f8fafc', border: '1px solid #e2e8f0',
            borderRadius: '8px', padding: '14px 16px',
            display: 'flex', flexDirection: 'column', gap: '8px',
            marginTop: '4px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Total pagado (normal + liquidaciones):
              </span>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                {formatCOP(compra.total)}
              </span>
            </div>
            {compra.tiene_deposito_pendiente && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#ca8a04' }}>
                  Kilos en depósito pendientes:
                </span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#ca8a04' }}>
                  {Number(compra.kilos_deposito_pendiente).toLocaleString('es-CO')} kg
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Pie ── */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid #f1f5f9' }}>
          <button
            onClick={onClose}
            style={{
              width: '100%', padding: '9px',
              border: '1px solid #e2e8f0', borderRadius: '6px',
              background: 'white', color: '#475569',
              fontSize: '13px', fontWeight: 500, cursor: 'pointer',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
            onMouseLeave={e => e.currentTarget.style.background = 'white'}
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  )
}