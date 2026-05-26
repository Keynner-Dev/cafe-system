import { useState, useEffect } from 'react'
import { createCompra } from '../../api/compras'
import { getTerceros } from '../../api/terceros'
import { getTiposCafe, getBodegas } from '../../api/inventario'
import { getPreciosHoy } from '../../api/precios'

// ─── Iconos SVG inline ────────────────────────────────────────────────────────
const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)
const IconPlus = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)
const IconTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" /><path d="M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
)

// ─── Estilos reutilizables ────────────────────────────────────────────────────
const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  border: '1px solid #e2e8f0', borderRadius: '6px',
  padding: '8px 12px', fontSize: '13px', color: '#0f172a',
  outline: 'none', background: 'white',
}
const inputDisabledStyle = {
  ...inputStyle,
  background: '#f8fafc', color: '#94a3b8', cursor: 'not-allowed',
}
const labelStyle = {
  display: 'block', fontSize: '12px', fontWeight: 500,
  color: '#475569', marginBottom: '5px',
}

const hoy = new Date().toISOString().split('T')[0]
const detalleVacio = { tipo_cafe: '', bodega: '', kilos: '', precio_kilo: '', es_deposito: false }

export default function CompraModal({ onClose, onSaved }) {
  const [form, setForm]           = useState({ proveedor: '', fecha: hoy, nota: '' })
  const [detalles, setDetalles]   = useState([{ ...detalleVacio }])
  const [proveedores, setProveedores] = useState([])
  const [tiposCafe, setTiposCafe] = useState([])
  const [bodegas, setBodegas]     = useState([])
  const [preciosHoy, setPreciosHoy] = useState([])
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)

  useEffect(() => {
    getTerceros().then(res =>
      setProveedores(res.data.filter(t => t.tipo === 'proveedor' || t.tipo === 'ambos'))
    )
    getTiposCafe().then(res => setTiposCafe(res.data))
    getBodegas().then(res => setBodegas(res.data))
    getPreciosHoy().then(res => setPreciosHoy(res.data))
  }, [])

  const handleDetalleChange = (index, e) => {
    const { name, value, type, checked } = e.target
    const nuevos = [...detalles]
    nuevos[index] = { ...nuevos[index], [name]: type === 'checkbox' ? checked : value }

    if (name === 'tipo_cafe') {
      const precioHoy = preciosHoy.find(p => String(p.tipo_cafe) === String(value))
      if (precioHoy) nuevos[index].precio_kilo = precioHoy.precio
    }
    if (name === 'es_deposito' && checked) {
      nuevos[index].precio_kilo = ''
    }

    setDetalles(nuevos)
  }

  const agregarDetalle = () => setDetalles([...detalles, { ...detalleVacio }])
  const eliminarDetalle = (index) => {
    if (detalles.length === 1) return
    setDetalles(detalles.filter((_, i) => i !== index))
  }

  const totalCompra = detalles.reduce((acc, d) => {
    if (d.es_deposito) return acc
    return acc + (Number(d.kilos) * Number(d.precio_kilo) || 0)
  }, 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    for (const d of detalles) {
      if (!d.es_deposito && !d.precio_kilo) {
        setError('Las compras normales requieren precio por kilo.')
        return
      }
    }
    setLoading(true)
    setError(null)
    try {
      await createCompra({ ...form, detalles })
      onSaved()
      onClose()
    } catch {
      setError('Error al guardar la compra. Verifica los datos.')
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
        width: '100%', maxWidth: '720px',
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
              Nueva compra
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>
              Registra los detalles de la compra de café
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
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

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

            {/* Datos generales */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Proveedor *</label>
                <select
                  value={form.proveedor}
                  onChange={e => setForm({ ...form, proveedor: e.target.value })}
                  required
                  style={inputStyle}
                  onFocus={focusGreen} onBlur={blurGray}
                >
                  <option value="">Selecciona proveedor</option>
                  {proveedores.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Fecha *</label>
                <input
                  type="date"
                  value={form.fecha}
                  onChange={e => setForm({ ...form, fecha: e.target.value })}
                  required
                  style={inputStyle}
                  onFocus={focusGreen} onBlur={blurGray}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Nota</label>
              <textarea
                value={form.nota}
                onChange={e => setForm({ ...form, nota: e.target.value })}
                rows={2}
                placeholder="Observación opcional"
                style={{ ...inputStyle, resize: 'vertical', minHeight: '60px' }}
                onFocus={focusGreen} onBlur={blurGray}
              />
            </div>

            {/* ── Detalles ── */}
            <div>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: '12px',
              }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                  Detalles de la compra
                </p>
                <button
                  type="button"
                  onClick={agregarDetalle}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '6px 12px', borderRadius: '6px',
                    border: '1px solid #bbf7d0', background: '#f0fdf4',
                    color: '#16a34a', fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#dcfce7'}
                  onMouseLeave={e => e.currentTarget.style.background = '#f0fdf4'}
                >
                  <IconPlus /> Agregar línea
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {detalles.map((detalle, index) => (
                  <div key={index} style={{
                    border: detalle.es_deposito ? '1px solid #fde68a' : '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '14px',
                    background: detalle.es_deposito ? '#fffbeb' : '#f8fafc',
                  }}>
                    {/* Grid de campos */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ ...labelStyle, fontSize: '11px' }}>Tipo de café *</label>
                        <select
                          name="tipo_cafe"
                          value={detalle.tipo_cafe}
                          onChange={e => handleDetalleChange(index, e)}
                          required
                          style={{ ...inputStyle, fontSize: '12px', padding: '6px 10px' }}
                          onFocus={focusGreen} onBlur={blurGray}
                        >
                          <option value="">Selecciona</option>
                          {tiposCafe.map(t => (
                            <option key={t.id} value={t.id}>{t.nombre}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ ...labelStyle, fontSize: '11px' }}>Bodega *</label>
                        <select
                          name="bodega"
                          value={detalle.bodega}
                          onChange={e => handleDetalleChange(index, e)}
                          required
                          style={{ ...inputStyle, fontSize: '12px', padding: '6px 10px' }}
                          onFocus={focusGreen} onBlur={blurGray}
                        >
                          <option value="">Selecciona</option>
                          {bodegas.map(b => (
                            <option key={b.id} value={b.id}>{b.nombre}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ ...labelStyle, fontSize: '11px' }}>Kilos *</label>
                        <input
                          type="number"
                          name="kilos"
                          value={detalle.kilos}
                          onChange={e => handleDetalleChange(index, e)}
                          required min="0" step="0.01"
                          placeholder="0.00"
                          style={{ ...inputStyle, fontSize: '12px', padding: '6px 10px' }}
                          onFocus={focusGreen} onBlur={blurGray}
                        />
                      </div>
                      <div>
                        <label style={{ ...labelStyle, fontSize: '11px' }}>
                          Precio/kg {detalle.es_deposito ? '(depósito)' : '*'}
                        </label>
                        <input
                          type="number"
                          name="precio_kilo"
                          value={detalle.precio_kilo}
                          onChange={e => handleDetalleChange(index, e)}
                          disabled={detalle.es_deposito}
                          min="0" step="0.01"
                          placeholder={detalle.es_deposito ? 'Al liquidar' : '0.00'}
                          style={detalle.es_deposito
                            ? { ...inputDisabledStyle, fontSize: '12px', padding: '6px 10px' }
                            : { ...inputStyle, fontSize: '12px', padding: '6px 10px' }
                          }
                          onFocus={focusGreen} onBlur={blurGray}
                        />
                      </div>
                    </div>

                    {/* Fila inferior: depósito toggle + subtotal + eliminar */}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      marginTop: '10px',
                    }}>
                      {/* Toggle depósito */}
                      <label style={{
                        display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                      }}>
                        <div style={{ position: 'relative', width: '36px', height: '20px' }}>
                          <input
                            type="checkbox"
                            name="es_deposito"
                            checked={detalle.es_deposito}
                            onChange={e => handleDetalleChange(index, e)}
                            style={{ opacity: 0, width: 0, height: 0 }}
                          />
                          <span style={{
                            position: 'absolute', inset: 0, borderRadius: '99px',
                            background: detalle.es_deposito ? '#ca8a04' : '#e2e8f0',
                            transition: 'background 0.2s', cursor: 'pointer',
                          }}>
                            <span style={{
                              position: 'absolute',
                              width: '14px', height: '14px', borderRadius: '50%',
                              background: 'white', top: '3px',
                              left: detalle.es_deposito ? '19px' : '3px',
                              transition: 'left 0.2s',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                            }} />
                          </span>
                        </div>
                        <span style={{ fontSize: '12px', color: '#475569' }}>
                          Es depósito
                          <span style={{ color: '#94a3b8', marginLeft: '4px' }}>(liquidar después)</span>
                        </span>
                      </label>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* Subtotal */}
                        {!detalle.es_deposito && detalle.kilos && detalle.precio_kilo && (
                          <span style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>
                            ${(Number(detalle.kilos) * Number(detalle.precio_kilo)).toLocaleString('es-CO')}
                          </span>
                        )}
                        {detalle.es_deposito && detalle.kilos && (
                          <span style={{ fontSize: '11px', fontWeight: 600, color: '#ca8a04' }}>
                            {detalle.kilos} kg en depósito
                          </span>
                        )}
                        {/* Botón eliminar línea */}
                        {detalles.length > 1 && (
                          <button
                            type="button"
                            onClick={() => eliminarDetalle(index)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '4px',
                              padding: '4px 8px', borderRadius: '5px', border: 'none',
                              background: '#fef2f2', color: '#dc2626',
                              fontSize: '11px', fontWeight: 500, cursor: 'pointer',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                            onMouseLeave={e => e.currentTarget.style.background = '#fef2f2'}
                          >
                            <IconTrash /> Eliminar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Total ── */}
            <div style={{
              background: '#f0fdf4', border: '1px solid #bbf7d0',
              borderRadius: '8px', padding: '14px 16px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#475569' }}>
                Total a pagar hoy:
              </span>
              <span style={{ fontSize: '20px', fontWeight: 700, color: '#16a34a' }}>
                ${totalCompra.toLocaleString('es-CO')}
              </span>
            </div>

          </div>

          {/* ── Pie ── */}
          <div style={{
            display: 'flex', gap: '10px',
            padding: '16px 20px', borderTop: '1px solid #f1f5f9',
            position: 'sticky', bottom: 0, background: 'white',
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
              {loading ? 'Guardando...' : 'Registrar compra'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}