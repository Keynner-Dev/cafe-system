import { useState, useEffect } from 'react'

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
const initialForm = { tipo_cafe: '', precio: '', fecha: hoy, nota: '' }

export default function PrecioModal({ precio, tiposCafe, onClose, onSubmit, onSaved }) {
  const [form, setForm]       = useState(initialForm)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  useEffect(() => {
    if (precio) setForm(precio)
    else setForm(initialForm)
  }, [precio])

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await onSubmit(form)
      onClose()
    } catch (err) {
      const msg = err.response?.data
      if (msg?.non_field_errors) {
        setError('Ya existe un precio para este tipo de café en esta fecha.')
      } else {
        setError('Error al guardar. Verifica los datos.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  const focusGreen = (e) => e.target.style.borderColor = '#16a34a'
  const blurGray   = (e) => e.target.style.borderColor = '#e2e8f0'

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
        width: '100%', maxWidth: '440px',
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
              {precio ? 'Editar precio' : 'Nuevo precio'}
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>
              {precio
                ? `Modificando precio del ${precio.fecha}`
                : 'Registra el precio del café por tipo y fecha'
              }
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

        {/* ── Formulario ── */}
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

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
                onFocus={focusGreen} onBlur={blurGray}
              />
            </div>

            {/* Tipo de café */}
            <div>
              <label style={labelStyle}>Tipo de café *</label>
              <select
                name="tipo_cafe"
                value={form.tipo_cafe}
                onChange={handleChange}
                required
                style={inputStyle}
                onFocus={focusGreen} onBlur={blurGray}
              >
                <option value="">Selecciona un tipo</option>
                {tiposCafe.map(t => (
                  <option key={t.id} value={t.id}>{t.nombre}</option>
                ))}
              </select>
            </div>

            {/* Precio */}
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
                  name="precio"
                  value={form.precio}
                  onChange={handleChange}
                  required min="0" step="0.01"
                  placeholder="0.00"
                  style={{ ...inputStyle, paddingLeft: '22px' }}
                  onFocus={focusGreen} onBlur={blurGray}
                />
              </div>
            </div>

            {/* Nota */}
            <div>
              <label style={labelStyle}>Nota</label>
              <textarea
                name="nota"
                value={form.nota || ''}
                onChange={handleChange}
                rows={2}
                placeholder="Observación opcional"
                style={{ ...inputStyle, resize: 'vertical', minHeight: '60px' }}
                onFocus={focusGreen} onBlur={blurGray}
              />
            </div>

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
                background: loading ? '#86efac' : '#16a34a', color: 'white',
                fontSize: '13px', fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#15803d' }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#16a34a' }}
            >
              {loading ? 'Guardando...' : precio ? 'Guardar cambios' : 'Crear precio'}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}