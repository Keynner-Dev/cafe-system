import { useEffect, useState } from 'react'
import { getTiposCafe, getBodegas, trasladar } from '../../api/inventario'

// ─── Iconos SVG inline ────────────────────────────────────────────────────────
const IconArrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
)
const IconArrowLg = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
)
const IconCheck = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IconAlert = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)
const IconTruck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13"/>
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
    <circle cx="5.5" cy="18.5" r="2.5"/>
    <circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
)
const IconWarehouse = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
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
  tipo_cafe: '',
  bodega_origen: '',
  bodega_destino: '',
  kilos: '',
  nota: '',
}

export default function TrasladosPage() {
  const [form, setForm]           = useState(initialForm)
  const [tiposCafe, setTiposCafe] = useState([])
  const [bodegas, setBodegas]     = useState([])
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const [exito, setExito]         = useState(null)

  useEffect(() => {
    getTiposCafe().then(res => setTiposCafe(res.data))
    getBodegas().then(res => setBodegas(res.data))
  }, [])

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError(null)
    setExito(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setExito(null)
    try {
      const res = await trasladar(form)
      setExito(res.data.mensaje)
      setForm(initialForm)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al procesar el traslado.')
    } finally {
      setLoading(false)
    }
  }

  const focusGreen = (e) => e.target.style.borderColor = '#16a34a'
  const blurGray   = (e) => e.target.style.borderColor = '#e2e8f0'

  const bodegasDestino = bodegas.filter(b => String(b.id) !== String(form.bodega_origen))
  const nombreOrigen   = bodegas.find(b => String(b.id) === String(form.bodega_origen))?.nombre
  const nombreDestino  = bodegas.find(b => String(b.id) === String(form.bodega_destino))?.nombre
  const nombreTipo     = tiposCafe.find(t => String(t.id) === String(form.tipo_cafe))?.nombre

  // El formulario está listo para mostrar el resumen visual
  const mostrarResumen = nombreOrigen && nombreDestino

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── Encabezado ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
            Traslados
          </h1>
          <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>
            Mover café entre bodegas del inventario
          </p>
        </div>
        {/* Contador de bodegas disponibles */}
        {bodegas.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 12px',
            background: 'white', border: '1px solid #e2e8f0',
            borderRadius: '6px', fontSize: '12px', color: '#64748b',
          }}>
            <IconWarehouse />
            {bodegas.length} bodegas disponibles
          </div>
        )}
      </div>

      {/* ── Mensajes de estado ── */}
      {exito && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          background: '#f0fdf4', border: '1px solid #bbf7d0',
          borderRadius: '8px', padding: '12px 16px',
          color: '#15803d', fontSize: '13px', fontWeight: 500,
        }}>
          <span style={{
            width: '24px', height: '24px', borderRadius: '50%',
            background: '#16a34a', display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </span>
          {exito}
        </div>
      )}

      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          background: '#fef2f2', border: '1px solid #fecaca',
          borderRadius: '8px', padding: '12px 16px',
          color: '#dc2626', fontSize: '13px', fontWeight: 500,
        }}>
          <span style={{
            width: '24px', height: '24px', borderRadius: '50%',
            background: '#dc2626', display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </span>
          {error}
        </div>
      )}

      {/* ── Layout principal ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '16px', alignItems: 'start' }}>

        {/* ── Formulario ── */}
        <div style={{
          background: 'white', border: '1px solid #e2e8f0',
          borderRadius: '10px', overflow: 'hidden',
        }}>
          <form onSubmit={handleSubmit}>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Sección 1: Qué trasladar */}
              <div>
                <p style={{
                  fontSize: '11px', fontWeight: 600, color: '#94a3b8',
                  textTransform: 'uppercase', letterSpacing: '0.6px',
                  margin: '0 0 12px 0',
                }}>
                  Qué trasladar
                </p>
                <div>
                  <label style={labelStyle}>Tipo de café <span style={{ color: '#dc2626' }}>*</span></label>
                  <select
                    name="tipo_cafe"
                    value={form.tipo_cafe}
                    onChange={handleChange}
                    required
                    style={inputStyle}
                    onFocus={focusGreen} onBlur={blurGray}
                  >
                    <option value="">Selecciona tipo de café</option>
                    {tiposCafe.map(t => (
                      <option key={t.id} value={t.id}>{t.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Separador */}
              <div style={{ borderTop: '1px solid #f1f5f9' }} />

              {/* Sección 2: De dónde a dónde */}
              <div>
                <p style={{
                  fontSize: '11px', fontWeight: 600, color: '#94a3b8',
                  textTransform: 'uppercase', letterSpacing: '0.6px',
                  margin: '0 0 12px 0',
                }}>
                  De dónde a dónde
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Bodega origen <span style={{ color: '#dc2626' }}>*</span></label>
                    <select
                      name="bodega_origen"
                      value={form.bodega_origen}
                      onChange={handleChange}
                      required
                      style={inputStyle}
                      onFocus={focusGreen} onBlur={blurGray}
                    >
                      <option value="">Selecciona</option>
                      {bodegas.map(b => (
                        <option key={b.id} value={b.id}>{b.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Bodega destino <span style={{ color: '#dc2626' }}>*</span></label>
                    <select
                      name="bodega_destino"
                      value={form.bodega_destino}
                      onChange={handleChange}
                      required
                      style={inputStyle}
                      onFocus={focusGreen} onBlur={blurGray}
                    >
                      <option value="">Selecciona</option>
                      {bodegasDestino.map(b => (
                        <option key={b.id} value={b.id}>{b.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Separador */}
              <div style={{ borderTop: '1px solid #f1f5f9' }} />

              {/* Sección 3: Cantidad y nota */}
              <div>
                <p style={{
                  fontSize: '11px', fontWeight: 600, color: '#94a3b8',
                  textTransform: 'uppercase', letterSpacing: '0.6px',
                  margin: '0 0 12px 0',
                }}>
                  Cantidad
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Kilos a trasladar <span style={{ color: '#dc2626' }}>*</span></label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="number"
                        name="kilos"
                        value={form.kilos}
                        onChange={handleChange}
                        required min="0.01" step="0.01"
                        placeholder="0.00"
                        style={{ ...inputStyle, paddingRight: '40px' }}
                        onFocus={focusGreen} onBlur={blurGray}
                      />
                      <span style={{
                        position: 'absolute', right: '12px', top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: '12px', color: '#94a3b8', pointerEvents: 'none',
                      }}>
                        kg
                      </span>
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Nota</label>
                    <textarea
                      name="nota"
                      value={form.nota}
                      onChange={handleChange}
                      rows={2}
                      placeholder="Observación opcional"
                      style={{ ...inputStyle, resize: 'vertical', minHeight: '60px', fontFamily: 'inherit' }}
                      onFocus={focusGreen} onBlur={blurGray}
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* ── Pie del formulario ── */}
            <div style={{
              padding: '16px 20px',
              borderTop: '1px solid #f1f5f9',
            }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  width: '100%', padding: '10px',
                  border: 'none', borderRadius: '6px',
                  background: loading ? '#86efac' : '#16a34a', color: 'white',
                  fontSize: '13px', fontWeight: 500,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#15803d' }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#16a34a' }}
              >
                <IconTruck />
                {loading ? 'Procesando traslado...' : 'Confirmar traslado'}
              </button>
            </div>
          </form>
        </div>

        {/* ── Panel derecho: resumen visual ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Tarjeta de resumen */}
          <div style={{
            background: 'white', border: '1px solid #e2e8f0',
            borderRadius: '10px', overflow: 'hidden',
          }}>
            <div style={{
              padding: '14px 16px',
              borderBottom: '1px solid #f1f5f9',
            }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                Resumen del traslado
              </p>
            </div>

            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

              {/* Tipo de café */}
              <div>
                <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 4px 0', fontWeight: 500 }}>
                  Tipo de café
                </p>
                <p style={{ fontSize: '13px', fontWeight: 600, color: nombreTipo ? '#0f172a' : '#cbd5e1', margin: 0 }}>
                  {nombreTipo || '—'}
                </p>
              </div>

              {/* Visualización origen → destino */}
              <div>
                <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 8px 0', fontWeight: 500 }}>
                  Ruta del traslado
                </p>
                {mostrarResumen ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {/* Origen */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '8px 12px',
                      background: '#eff6ff', border: '1px solid #bfdbfe',
                      borderRadius: '6px',
                    }}>
                      <div style={{
                        width: '6px', height: '6px', borderRadius: '50%',
                        background: '#2563eb', flexShrink: 0,
                      }} />
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#1d4ed8' }}>
                        {nombreOrigen}
                      </span>
                    </div>
                    {/* Flecha */}
                    <div style={{ display: 'flex', justifyContent: 'center', color: '#94a3b8' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <polyline points="19 12 12 19 5 12"/>
                      </svg>
                    </div>
                    {/* Destino */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '8px 12px',
                      background: '#f0fdf4', border: '1px solid #bbf7d0',
                      borderRadius: '6px',
                    }}>
                      <div style={{
                        width: '6px', height: '6px', borderRadius: '50%',
                        background: '#16a34a', flexShrink: 0,
                      }} />
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#15803d' }}>
                        {nombreDestino}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: '12px', color: '#cbd5e1', margin: 0 }}>
                    Selecciona origen y destino
                  </p>
                )}
              </div>

              {/* Kilos */}
              <div>
                <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 4px 0', fontWeight: 500 }}>
                  Cantidad
                </p>
                <p style={{ fontSize: form.kilos ? '20px' : '13px', fontWeight: 700, color: form.kilos ? '#0f172a' : '#cbd5e1', margin: 0 }}>
                  {form.kilos
                    ? <>{form.kilos} <span style={{ fontSize: '13px', fontWeight: 400, color: '#64748b' }}>kg</span></>
                    : '—'
                  }
                </p>
              </div>

            </div>
          </div>

          {/* Tarjeta informativa */}
          <div style={{
            background: '#fffbeb', border: '1px solid #fde68a',
            borderRadius: '10px', padding: '14px 16px',
          }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#92400e', margin: '0 0 4px 0' }}>
              Ten en cuenta
            </p>
            <p style={{ fontSize: '12px', color: '#78350f', margin: 0, lineHeight: '1.5' }}>
              El traslado descuenta kilos del inventario de la bodega origen y los suma a la bodega destino automáticamente.
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}