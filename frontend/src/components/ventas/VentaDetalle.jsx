// ─── Iconos SVG inline ────────────────────────────────────────────────────────
const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

// ─── Fila de dato ─────────────────────────────────────────────────────────────
function Dato({ label, value }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
      <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
        {label}
      </span>
      <span style={{ fontSize: '13px', color: '#0f172a' }}>{value}</span>
    </div>
  )
}

export default function VentaDetalle({ venta, onClose }) {
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
        width: '100%', maxWidth: '660px',
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }}>

        {/* ── Cabecera ── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          padding: '18px 20px', borderBottom: '1px solid #f1f5f9',
          position: 'sticky', top: 0, background: 'white', zIndex: 1,
        }}>
          <div>
            <p style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.4px', margin: 0 }}>
              Remisión
            </p>
            <h2 style={{
              fontSize: '18px', fontWeight: 700,
              fontFamily: 'monospace', color: '#16a34a',
              margin: '2px 0',
            }}>
              {venta.numero_remision}
            </h2>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
              {venta.fecha} — {venta.cliente_nombre}
              {venta.cuenta && (
                <span style={{ marginLeft: '6px', color: '#94a3b8' }}>· Cuenta: {venta.cuenta}</span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '30px', height: '30px', borderRadius: '6px',
              border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8',
              flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8' }}
          >
            <IconX />
          </button>
        </div>

        {/* ── Cuerpo ── */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* ── Tabla de mercancía ── */}
          <div>
            <p style={{ fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Mercancía
            </p>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#0f172a' }}>
                    {['Tipo', 'Bodega', 'Bultos', 'Kilos'].map((col, i) => (
                      <th key={col} style={{
                        padding: '9px 14px', textAlign: i >= 2 ? 'right' : 'left',
                        color: '#e2e8f0', fontWeight: 500, fontSize: '11px',
                      }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {venta.detalles.map(d => (
                    <tr key={d.id}
                      style={{ borderTop: '1px solid #f1f5f9' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'white'}
                    >
                      <td style={{ padding: '9px 14px', color: '#0f172a', fontWeight: 500 }}>{d.tipo_cafe_nombre}</td>
                      <td style={{ padding: '9px 14px', color: '#475569' }}>{d.bodega_nombre}</td>
                      <td style={{ padding: '9px 14px', color: '#475569', textAlign: 'right' }}>{d.bultos}</td>
                      <td style={{ padding: '9px 14px', color: '#475569', textAlign: 'right' }}>
                        {Number(d.kilos).toLocaleString('es-CO')} kg
                      </td>
                    </tr>
                  ))}
                  {/* Fila de totales */}
                  <tr style={{ borderTop: '2px solid #e2e8f0', background: '#f8fafc' }}>
                    <td colSpan={2} style={{ padding: '9px 14px', fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                      Total
                    </td>
                    <td style={{ padding: '9px 14px', fontWeight: 700, color: '#0f172a', textAlign: 'right' }}>
                      {venta.total_bultos} bultos
                    </td>
                    <td style={{ padding: '9px 14px', fontWeight: 700, color: '#0f172a', textAlign: 'right' }}>
                      {Number(venta.total_kilos).toLocaleString('es-CO')} kg
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Conductor y vehículo ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>

            {/* Conductor */}
            <div style={{
              border: '1px solid #e2e8f0', borderRadius: '8px',
              padding: '14px', background: '#f8fafc',
            }}>
              <p style={{ fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Conductor
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Dato label="Nombre"    value={venta.conductor_nombre} />
                <Dato label="Cédula"    value={venta.conductor_cedula} />
                <Dato label="Dirección" value={venta.conductor_direccion} />
                <Dato label="Teléfono"  value={venta.conductor_telefono} />
              </div>
            </div>

            {/* Vehículo */}
            <div style={{
              border: '1px solid #e2e8f0', borderRadius: '8px',
              padding: '14px', background: '#f8fafc',
            }}>
              <p style={{ fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Vehículo
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Dato label="Clase"  value={venta.vehiculo_clase} />
                <Dato label="Placas" value={venta.vehiculo_placas} />
                <Dato label="Marca"  value={venta.vehiculo_marca} />
                <Dato label="Color"  value={venta.vehiculo_color} />
                <Dato label="Modelo" value={venta.vehiculo_modelo} />
              </div>
            </div>
          </div>

          {/* ── Flete ── */}
          {Number(venta.flete_valor) > 0 && (
            <div style={{
              background: '#f0fdf4', border: '1px solid #bbf7d0',
              borderRadius: '8px', padding: '12px 16px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#15803d', margin: '0 0 2px' }}>Flete</p>
                {venta.flete_pagadero_por && (
                  <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
                    Pagadero por: {venta.flete_pagadero_por}
                  </p>
                )}
              </div>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#16a34a' }}>
                ${Number(venta.flete_valor).toLocaleString('es-CO')}
              </span>
            </div>
          )}

          {/* ── Nota ── */}
          {venta.nota && (
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
              <strong style={{ color: '#475569' }}>Nota:</strong> {venta.nota}
            </p>
          )}

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