import { useState, useEffect } from 'react'

const crearFormularioInicial = (campos) => {
  const form = { activo: true }

  campos.forEach(campo => {
    form[campo.name] = ''
  })

  return form
}

// ── Íconos SVG inline ──
const IconoCerrar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const IconoAlerta = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
)

export default function ItemModal({ titulo, item, campos, onClose, onSubmit }) {
  const [form, setForm] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
  if (item) {
    setForm(item)
  } else {
    setForm(crearFormularioInicial(campos))
  }
}, [item, campos])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await onSubmit(form)
      onClose()
    } catch {
      setError('Error al guardar. Verifica los datos e intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // Estilos de input base
  const inputStyle = {
    width: '100%',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    padding: '9px 12px',
    fontSize: '14px',
    color: '#0f172a',
    outline: 'none',
    background: 'white',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  }

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '6px',
  }

  return (
    /* Overlay */
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: '16px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Tarjeta del modal */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        width: '100%',
        maxWidth: '460px',
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 24px',
          borderBottom: '1px solid #e2e8f0',
        }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a', margin: 0 }}>
              {item ? `Editar ${titulo}` : `Nuevo ${titulo}`}
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '3px 0 0 0' }}>
              {item ? 'Modifica los campos y guarda los cambios.' : 'Completa los campos para crear el registro.'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              background: 'white',
              color: '#64748b',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#f8fafc'
              e.currentTarget.style.color = '#0f172a'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'white'
              e.currentTarget.style.color = '#64748b'
            }}
          >
            <IconoCerrar />
          </button>
        </div>

        {/* Cuerpo */}
        <div style={{ padding: '24px' }}>

          {/* Mensaje de error */}
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
              padding: '10px 14px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              color: '#dc2626',
              fontSize: '13px',
            }}>
              <IconoAlerta />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Campos dinámicos */}
              {campos.map(campo => (
                <div key={campo.name}>
                  <label style={labelStyle}>
                    {campo.label}
                    {campo.required && (
                      <span style={{ color: '#dc2626', marginLeft: '3px' }}>*</span>
                    )}
                  </label>

                  {campo.type === 'textarea' ? (
                    <textarea
                      name={campo.name}
                      value={form[campo.name] || ''}
                      onChange={handleChange}
                      rows={3}
                      placeholder={campo.placeholder}
                      style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                      onFocus={e => e.target.style.borderColor = '#16a34a'}
                      onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    />
                  ) : (
                    <input
                      type={campo.type || 'text'}
                      name={campo.name}
                      value={form[campo.name] || ''}
                      onChange={handleChange}
                      required={campo.required}
                      placeholder={campo.placeholder}
                      style={inputStyle}
                      onFocus={e => e.target.style.borderColor = '#16a34a'}
                      onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    />
                  )}
                </div>
              ))}

              {/* Toggle Activo */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                background: '#f8fafc',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
              }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: '500', color: '#0f172a', margin: 0 }}>Estado</p>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
                    {form.activo ? 'El registro está activo y visible en el sistema.' : 'El registro está inactivo.'}
                  </p>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>
                    {form.activo ? 'Activo' : 'Inactivo'}
                  </span>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="checkbox"
                      name="activo"
                      id="activo"
                      checked={form.activo ?? true}
                      onChange={handleChange}
                      style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                    />
                    <div
                      onClick={() => setForm(prev => ({ ...prev, activo: !prev.activo }))}
                      style={{
                        width: '40px',
                        height: '22px',
                        borderRadius: '11px',
                        backgroundColor: form.activo ? '#16a34a' : '#cbd5e1',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                      }}
                    >
                      <div style={{
                        position: 'absolute',
                        top: '3px',
                        left: form.activo ? '21px' : '3px',
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        backgroundColor: 'white',
                        transition: 'left 0.2s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      }} />
                    </div>
                  </div>
                </label>
              </div>

              {/* Botones */}
              <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    flex: 1,
                    padding: '9px 16px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    background: 'white',
                    cursor: 'pointer',
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
                    flex: 1,
                    padding: '9px 16px',
                    backgroundColor: loading ? '#86efac' : '#16a34a',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#15803d' }}
                  onMouseLeave={e => { if (!loading) e.currentTarget.style.backgroundColor = '#16a34a' }}
                >
                  {loading ? 'Guardando...' : item ? 'Guardar cambios' : 'Crear registro'}
                </button>
              </div>

            </div>
          </form>
        </div>
      </div>
    </div>
  )
}