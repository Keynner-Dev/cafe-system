import { useState } from 'react'
import { createLiquidacion } from '../../api/compras'

// ─── Iconos SVG inline ────────────────────────────────────────────────────────
const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

// ─── Estilos reutilizables ────────────────────────────────────────────────────
const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  border: '1px solid #e2e8f0', borderRadius: '6px',
  padding: '8px 12px', fontSize: '13px', color: '#0f172a',
  outline: 'none', background: 'white',
}
const labelStyle = {
  display: 'block', fontSize: '12px', fontWeight: 500,
  color: '#475569', marginBottom: '5px',
}

const hoy = new Date().toISOString().split('T')[0]

export default function LiquidacionModal({ detalle, onClose, onSaved }) {
  const [form, setForm] = useState({
    detalle_compra: detalle.id,
    kilos: '',
    precio_kilo: '',
    fecha: hoy,
    nota: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (Number(form.kilos) > Number(detalle.kilos_pendientes_liquidar)) {
      setError(`No puedes liquidar más de ${detalle.kilos_pendientes_liquidar} kg disponibles.`)
      return
    }
    setLoading(true)
    setError(null)
    try {
      await createLiquidacion(form)
      onSaved()
      onClose()
    } catch {
      setError('Error al registrar la liquidación.')
    } finally {
      setLoading(false)
    }
  }

  const subtotal  = Number(form.kilos) * Number(form.precio_kilo) || 0
  const focusGold = (e) => e.target.style.borderColor = '#ca8a04'
  const blurGray  = (e) => e.target.style.borderColor = '#e2e8f0'

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15, 23, 42, 0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 60, padding: '16px',
      }}
    >
      <div style={{
        background: 'white', borderRadius: '12px',
        width: '100%', maxWidth: '460px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        overflow: 'hidden',
      }}>

        {/* ── Cabecera ── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '18px 20px', borderBottom: '1px solid #f1f5f9',
        }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
              Liquidar depósito
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>
              Registra el precio y los kilos a liquidar
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
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Info del depósito */}
            <div style={{
              background: '#fffbeb', border: '1px solid #fde68a',
              borderRadius: '8px', padding: '12px 14px',
            }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#92400e', margin: '0 0 2px' }}>
                {detalle.tipo_cafe_nombre}
              </p>
              <p style={{ fontSize: '11px', color: '#ca8a04', margin: '0 0 6px' }}>
                {detalle.bodega_nombre}
              </p>
              <p style={{ fontSize: '12px', color: '#78350f', margin: 0 }}>
                Disponible para liquidar:{' '}
                <strong>{detalle.kilos_pendientes_liquidar} kg</strong>
              </p>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fecaca',
                borderRadius: '6px', padding: '10px 12px',
                color: '#dc2626', fontSize: '12px',
              }}>
                {error}
              </div>
            )}

            {/* Fecha */}
            <div>
              <label style={labelStyle}>Fecha *</label>
              <input
                type="date"
                name="fecha"
                value={form.fecha}
                onChange={handleChange}
                required
                style={inputStyle}
                onFocus={focusGold} onBlur={blurGray}
              />
            </div>

            {/* Kilos */}
            <div>
              <label style={labelStyle}>
                Kilos a liquidar * (máx: {detalle.kilos_pendientes_liquidar} kg)
              </label>
              <input
                type="number"
                name="kilos"
                value={form.kilos}
                onChange={handleChange}
                required
                min="0.01"
                max={detalle.kilos_pendientes_liquidar}
                step="0.01"
                placeholder="0.00"
                style={inputStyle}
                onFocus={focusGold} onBlur={blurGray}
              />
            </div>

            {/* Precio por kilo */}
            <div>
              <label style={labelStyle}>Precio por kilo *</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: '10px', top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8', fontSize: '13px', pointerEvents: 'none',
                }}>
                  $
                </span>
                <input
                  type="number"
                  name="precio_kilo"
                  value={form.precio_kilo}
                  onChange={handleChange}
                  required min="0" step="0.01"
                  placeholder="0.00"
                  style={{ ...inputStyle, paddingLeft: '22px' }}
                  onFocus={focusGold} onBlur={blurGray}
                />
              </div>
            </div>

            {/* Nota */}
            <div>
              <label style={labelStyle}>Nota</label>
              <textarea
                name="nota"
                value={form.nota}
                onChange={handleChange}
                rows={2}
                placeholder="Observación opcional"
                style={{ ...inputStyle, resize: 'vertical', minHeight: '60px' }}
                onFocus={focusGold} onBlur={blurGray}
              />
            </div>

            {/* Total preview */}
            {subtotal > 0 && (
              <div style={{
                background: '#fffbeb', border: '1px solid #fde68a',
                borderRadius: '8px', padding: '12px 14px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#475569' }}>
                  Total a pagar:
                </span>
                <span style={{ fontSize: '18px', fontWeight: 700, color: '#ca8a04' }}>
                  ${subtotal.toLocaleString('es-CO')}
                </span>
              </div>
            )}

          </div>

          {/* ── Pie ── */}
          <div style={{
            display: 'flex', gap: '10px',
            padding: '16px 20px', borderTop: '1px solid #f1f5f9',
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, padding: '9px',
                border: '1px solid #e2e8f0', borderRadius: '6px',
                background: 'white', color: '#475569',
                fontSize: '13px', fontWeight: 500, cursor: 'pointer',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1, padding: '9px',
                border: 'none', borderRadius: '6px',
                background: loading ? '#fde68a' : '#ca8a04', color: 'white',
                fontSize: '13px', fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#a16207' }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#ca8a04' }}
            >
              {loading ? 'Guardando...' : 'Liquidar depósito'}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}