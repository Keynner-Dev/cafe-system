import { useState, useEffect } from 'react'
import { createTercero, updateTercero } from '../../api/terceros'

const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

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
  nombre:    '',
  tipo:      'caficultor',
  cedula:    '',
  telefono:  '',
  direccion: '',
  activo:    true,
}

export default function TerceroModal({ tercero, onClose, onSaved }) {
  const [form,    setForm]    = useState(initialForm)
  const [numero,  setNumero]  = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    if (tercero) {
      // Si el teléfono guardado ya tiene +57, lo separamos
      const tel = tercero.telefono || ''
      const limpio = tel.startsWith('+57') ? tel.replace('+57', '') : tel
      setNumero(limpio)
      setForm({ ...tercero, telefono: '' })
    } else {
      setForm(initialForm)
      setNumero('')
    }
  }, [tercero])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleNumero = (e) => {
    // Solo dígitos, máximo 10
    const val = e.target.value.replace(/\D/g, '').slice(0, 10)
    setNumero(val)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const telefonoCompleto = numero ? `+57${numero}` : ''
      const payload = {
        ...form,
        telefono:          telefonoCompleto,
        telefono_whatsapp: telefonoCompleto,
      }
      if (tercero) await updateTercero(tercero.id, payload)
      else         await createTercero(payload)
      onSaved()
      onClose()
    } catch {
      setError('Error al guardar. Verifica los datos e intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const focusGreen = (e) => e.target.style.borderColor = '#16a34a'
  const blurGray   = (e) => e.target.style.borderColor = '#e2e8f0'

  return (
    <div
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
        maxHeight: '90vh',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>

        {/* ── Cabecera ── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '18px 20px', borderBottom: '1px solid #f1f5f9',
          flexShrink: 0,
        }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
              {tercero ? 'Editar tercero' : 'Nuevo tercero'}
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px', margin: '2px 0 0' }}>
              {tercero
                ? `Modificando: ${tercero.nombre}`
                : 'Completa los datos de la empresa o caficultor'}
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
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', flex: 1 }}>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

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
                onFocus={focusGreen} onBlur={blurGray}
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
                onFocus={focusGreen} onBlur={blurGray}
              >
                <option value="empresa">Empresa</option>
                <option value="caficultor">Caficultor</option>
                <option value="ambos">Ambos</option>
              </select>
            </div>

            {/* Cédula */}
            <div>
              <label style={labelStyle}>
                Cédula / NIT
                <span style={{ color: '#94a3b8', fontWeight: 400, marginLeft: '4px' }}>
                  (usado para búsqueda y portal)
                </span>
              </label>
              <input
                name="cedula"
                value={form.cedula || ''}
                onChange={handleChange}
                placeholder="Ej: 1234567890"
                style={inputStyle}
                onFocus={focusGreen} onBlur={blurGray}
              />
            </div>

            {/* Teléfono unificado con selector país */}
            <div>
              <label style={labelStyle}>Teléfono</label>
              <div style={{
                display: 'flex', border: '1px solid #e2e8f0',
                borderRadius: '6px', overflow: 'hidden',
              }}
                onFocusCapture={e => e.currentTarget.style.borderColor = '#16a34a'}
                onBlurCapture={e  => e.currentTarget.style.borderColor = '#e2e8f0'}
              >
                {/* País fijo Colombia */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '0 10px', background: '#f8fafc',
                  borderRight: '1px solid #e2e8f0', flexShrink: 0,
                }}>
                  <span style={{ fontSize: '16px', lineHeight: 1 }}>🇨🇴</span>
                  <span style={{ fontSize: '13px', color: '#475569', fontWeight: 500 }}>+57</span>
                </div>

                {/* Input número */}
                <input
                  type="tel"
                  value={numero}
                  onChange={handleNumero}
                  placeholder="300 123 4567"
                  style={{
                    flex: 1, border: 'none', outline: 'none',
                    padding: '8px 12px', fontSize: '13px',
                    color: '#0f172a', background: 'transparent',
                  }}
                />

                {/* Preview número completo */}
                {numero && (
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    padding: '0 10px', fontSize: '11px',
                    color: '#94a3b8', borderLeft: '1px solid #f1f5f9',
                    whiteSpace: 'nowrap', background: '#f8fafc',
                  }}>
                    +57{numero}
                  </div>
                )}
              </div>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: '4px 0 0' }}>
                Este número se usará también para WhatsApp
              </p>
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
                onFocus={focusGreen} onBlur={blurGray}
              />
            </div>

            {/* Toggle activo */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: '#f8fafc', borderRadius: '6px', padding: '10px 12px',
            }}>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 500, color: '#0f172a', margin: 0 }}>
                  Estado activo
                </p>
                <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0' }}>
                  Los terceros inactivos no aparecen en formularios de compra/venta
                </p>
              </div>
              <label style={{
                position: 'relative', display: 'inline-block',
                width: '40px', height: '22px', flexShrink: 0,
              }}>
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

          {/* ── Pie ── */}
          <div style={{
            display: 'flex', gap: '10px',
            padding: '16px 20px', borderTop: '1px solid #f1f5f9',
            flexShrink: 0,
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
              {loading ? 'Guardando...' : tercero ? 'Guardar cambios' : 'Crear tercero'}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}