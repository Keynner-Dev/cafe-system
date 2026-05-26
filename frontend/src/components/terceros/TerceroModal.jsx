import { useState, useEffect } from 'react'
import { createTercero, updateTercero } from '../../api/terceros'

// ─── Icono cerrar ─────────────────────────────────────────────────────────────
const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
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

const initialForm = {
  nombre: '',
  tipo: 'cliente',
  telefono: '',
  direccion: '',
  activo: true,
}

export default function TerceroModal({ tercero, onClose, onSaved }) {
  const [form, setForm]       = useState(initialForm)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  // Si viene un tercero, es edición — cargamos sus datos
  useEffect(() => {
    if (tercero) setForm(tercero)
    else setForm(initialForm)
  }, [tercero])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (tercero) await updateTercero(tercero.id, form)
      else         await createTercero(form)
      onSaved()
      onClose()
    } catch {
      setError('Error al guardar. Verifica los datos e intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // Cierra al hacer clic en el backdrop (fuera del modal)
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
        width: '100%', maxWidth: '480px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        overflow: 'hidden',
      }}>

        {/* ── Cabecera del modal ── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '18px 20px',
          borderBottom: '1px solid #f1f5f9',
        }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
              {tercero ? 'Editar tercero' : 'Nuevo tercero'}
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>
              {tercero ? `Modificando: ${tercero.nombre}` : 'Completa los datos del cliente o proveedor'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '30px', height: '30px', borderRadius: '6px',
              border: 'none', background: 'transparent', cursor: 'pointer',
              color: '#94a3b8',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8' }}
          >
            <IconX />
          </button>
        </div>

        {/* ── Cuerpo del formulario ── */}
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

            {/* Nombre */}
            <div>
              <label style={labelStyle}>Nombre completo *</label>
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                required
                placeholder="Ej: Juan García"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#16a34a'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            {/* Tipo */}
            <div>
              <label style={labelStyle}>Tipo *</label>
              <select
                name="tipo"
                value={form.tipo}
                onChange={handleChange}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#16a34a'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              >
                <option value="cliente">Cliente</option>
                <option value="proveedor">Proveedor</option>
                <option value="ambos">Ambos</option>
              </select>
            </div>

            {/* Teléfono */}
            <div>
              <label style={labelStyle}>Teléfono</label>
              <input
                name="telefono"
                value={form.telefono || ''}
                onChange={handleChange}
                placeholder="Ej: 3001234567"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#16a34a'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            {/* Dirección */}
            <div>
              <label style={labelStyle}>Dirección</label>
              <textarea
                name="direccion"
                value={form.direccion || ''}
                onChange={handleChange}
                rows={2}
                placeholder="Dirección del tercero"
                style={{ ...inputStyle, resize: 'vertical', minHeight: '60px' }}
                onFocus={e => e.target.style.borderColor = '#16a34a'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            {/* Activo (toggle-style checkbox) */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: '#f8fafc', borderRadius: '6px', padding: '10px 12px',
            }}>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 500, color: '#0f172a', margin: 0 }}>Estado activo</p>
                <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0' }}>
                  Los terceros inactivos no aparecen en formularios de compra/venta
                </p>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '22px', flexShrink: 0 }}>
                <input
                  type="checkbox"
                  name="activo"
                  checked={form.activo}
                  onChange={handleChange}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute', inset: 0, borderRadius: '99px', cursor: 'pointer',
                  background: form.activo ? '#16a34a' : '#e2e8f0',
                  transition: 'background 0.2s',
                }}>
                  <span style={{
                    position: 'absolute',
                    width: '16px', height: '16px', borderRadius: '50%',
                    background: 'white', top: '3px',
                    left: form.activo ? '21px' : '3px',
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }} />
                </span>
              </label>
            </div>

          </div>

          {/* ── Pie del modal ── */}
          <div style={{
            display: 'flex', gap: '10px',
            padding: '16px 20px',
            borderTop: '1px solid #f1f5f9',
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
                background: loading ? '#86efac' : '#16a34a',
                color: 'white',
                fontSize: '13px', fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#15803d' }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#16a34a' }}
            >
              {loading ? 'Guardando...' : tercero ? 'Guardar cambios' : 'Crear tercero'}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}