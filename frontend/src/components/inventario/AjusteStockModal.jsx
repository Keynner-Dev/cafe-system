import { useState } from 'react'
import { createAjusteStock } from '../../api/inventario'

const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const formatKg = (valor) => {
  const n = Number(valor) || 0
  return n.toLocaleString('es-CO', { maximumFractionDigits: 2 })
}

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  border: '1px solid #e2e8f0', borderRadius: '6px',
  padding: '9px 12px', fontSize: '14px', color: '#0f172a',
  outline: 'none', background: 'white',
}
const labelStyle = {
  display: 'block', fontSize: '12px', fontWeight: 500,
  color: '#475569', marginBottom: '5px',
}

// ── ÍTEM 26: ajuste manual de stock, solo Jimmi. Dos modos --
// "cantidad exacta" (ahora hay X kg) o "sumar/restar" (+/- X kg) --
// con un toggle entre ellos. Sin cierre por click en el fondo
// (ítem 13), solo por el botón X o "Cancelar". ──
export default function AjusteStockModal({ fila, onClose, onSaved }) {
  const [modo, setModo] = useState('delta') // 'delta' | 'exacto'
  const [valor, setValor] = useState('')
  const [motivo, setMotivo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const stockActual = Number(fila.stock_actual) || 0

  const resultadoPreview = () => {
    if (valor === '' || Number.isNaN(Number(valor))) return null
    const n = Number(valor)
    return modo === 'exacto' ? n : stockActual + n
  }
  const preview = resultadoPreview()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (valor === '' || Number.isNaN(Number(valor))) {
      setError('Ingresa una cantidad válida.'); return
    }
    if (!motivo.trim()) {
      setError('El motivo es obligatorio.'); return
    }
    setLoading(true)
    setError('')
    try {
      await createAjusteStock({
        bodega: fila.bodega_id,
        tipo_cafe: fila.tipo_cafe_id,
        modo,
        valor,
        motivo: motivo.trim(),
      })
      onSaved?.()
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo aplicar el ajuste.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 60, padding: '16px',
    }}>
      <div style={{
        background: 'white', borderRadius: '12px',
        width: '100%', maxWidth: '440px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          padding: '18px 20px', borderBottom: '1px solid #f1f5f9',
        }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
              Ajustar stock
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>
              {fila.bodega_nombre} — {fila.tipo_cafe_nombre} · actual: {formatKg(stockActual)} kg
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

        <form onSubmit={handleSubmit}>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{
              background: '#eff6ff', border: '1px solid #bfdbfe',
              borderRadius: '6px', padding: '10px 12px',
              fontSize: '12px', color: '#1e40af',
            }}>
              Esto corrige kilos (ej. café mojado que se secó, un conteo
              físico distinto al sistema). No mueve dinero ni afecta el
              costo promedio de este tipo de café.
            </div>

            {error && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fecaca',
                borderRadius: '6px', padding: '10px 12px',
                color: '#dc2626', fontSize: '12px',
              }}>
                {error}
              </div>
            )}

            <div>
              <label style={labelStyle}>Tipo de ajuste</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[
                  { valor: 'delta', label: 'Sumar / restar' },
                  { valor: 'exacto', label: 'Cantidad exacta' },
                ].map(op => (
                  <button
                    key={op.valor}
                    type="button"
                    onClick={() => { setModo(op.valor); setValor('') }}
                    style={{
                      flex: 1, padding: '7px', borderRadius: '6px', fontSize: '12px',
                      fontWeight: 600, cursor: 'pointer', border: '1px solid',
                      background: modo === op.valor ? '#0f172a' : 'white',
                      color: modo === op.valor ? 'white' : '#475569',
                      borderColor: modo === op.valor ? '#0f172a' : '#e2e8f0',
                    }}
                  >
                    {op.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={labelStyle}>
                {modo === 'delta' ? 'Kilos a sumar (+) o restar (-)' : 'Cantidad final en kg'}
              </label>
              <input
                type="number"
                step="0.01"
                value={valor}
                onChange={e => setValor(e.target.value)}
                placeholder={modo === 'delta' ? 'Ej: -45 o 120' : 'Ej: 500'}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#16a34a'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                autoFocus
              />
              {preview !== null && !Number.isNaN(preview) && (
                <p style={{
                  fontSize: '11px', marginTop: '5px',
                  color: preview < 0 ? '#dc2626' : '#64748b',
                }}>
                  Quedaría en {formatKg(preview)} kg
                  {preview < 0 && ' — no es válido, el stock no puede quedar negativo'}
                </p>
              )}
            </div>

            <div>
              <label style={labelStyle}>Motivo del ajuste *</label>
              <textarea
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
                placeholder="Ej: café mojado que se secó, se pasa a Café Seco..."
                style={{ ...inputStyle, resize: 'vertical', minHeight: '70px' }}
                onFocus={e => e.target.style.borderColor = '#16a34a'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>
          </div>

          <div style={{
            display: 'flex', gap: '10px',
            padding: '16px 20px', borderTop: '1px solid #f1f5f9',
          }}>
            <button type="button" onClick={onClose}
              style={{
                flex: 1, padding: '9px', border: '1px solid #e2e8f0', borderRadius: '6px',
                background: 'white', color: '#475569', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button type="submit" disabled={loading || preview < 0}
              style={{
                flex: 1, padding: '9px', border: 'none', borderRadius: '6px',
                background: (loading || preview < 0) ? '#86efac' : '#16a34a',
                color: 'white', fontSize: '13px', fontWeight: 500,
                cursor: (loading || preview < 0) ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Guardando...' : 'Aplicar ajuste'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}