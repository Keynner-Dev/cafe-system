import { useState, useEffect, useRef, useCallback } from 'react'
import { createVenta } from '../../api/ventas'
import { getTerceros } from '../../api/terceros'
import { getTiposCafe, getBodegas } from '../../api/inventario'

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
const IconSearch = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
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
const focusGreen = (e) => e.target.style.borderColor = '#16a34a'
const blurGray   = (e) => e.target.style.borderColor = '#e2e8f0'

function Seccion({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '4px 0 16px' }}>
      <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
    </div>
  )
}

const hoy = new Date().toISOString().split('T')[0]
const detalleVacio = {
  tipo_cafe: '', bodega: '', bultos: '', kilos: '',
  muestra: '', factor: '', humedad: '', pasilla: '',
}
const initialForm = {
  fecha: hoy, empresa: '', cuenta: '',          // ← "empresa" en vez de "cliente"
  conductor_nombre: '', conductor_cedula: '',
  conductor_direccion: '', conductor_telefono: '',
  vehiculo_clase: '', vehiculo_placas: '',
  vehiculo_marca: '', vehiculo_color: '', vehiculo_modelo: '',
  flete_valor: '', flete_pagadero_por: '', nota: '',
}

export default function VentaModal({ onClose, onSaved }) {
  const [form, setForm]         = useState(initialForm)
  const [detalles, setDetalles] = useState([{ ...detalleVacio }])

  // ── estados del buscador de empresa ──
  const [busqueda, setBusqueda]                     = useState('')
  const [resultados, setResultados]                 = useState([])
  const [dropdownVisible, setDropdownVisible]       = useState(false)
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null)
  const [buscando, setBuscando]                     = useState(false)
  const dropdownRef = useRef(null)

  const [tiposCafe, setTiposCafe] = useState([])
  const [bodegas, setBodegas]     = useState([])
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    getTiposCafe().then(res => setTiposCafe(res.data))
    getBodegas().then(res => setBodegas(res.data))
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownVisible(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (busqueda.length < 2) {
      setResultados([])
      setDropdownVisible(false)
      return
    }
    setBuscando(true)
    const timer = setTimeout(() => {
      getTerceros({ buscar: busqueda, tipo: 'empresa' })
        .then(res => {
          setResultados(res.data)
          setDropdownVisible(true)
        })
        .finally(() => setBuscando(false))
    }, 300)
    return () => clearTimeout(timer)
  }, [busqueda])

  const seleccionarEmpresa = (tercero) => {
    setEmpresaSeleccionada(tercero)
    setForm(prev => ({ ...prev, empresa: tercero.id }))
    setBusqueda(tercero.nombre)
    setDropdownVisible(false)
  }

  const limpiarEmpresa = () => {
    setEmpresaSeleccionada(null)
    setForm(prev => ({ ...prev, empresa: '' }))
    setBusqueda('')
    setResultados([])
  }

  const handleChange = useCallback((e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }, [])

  const handleDetalleChange = useCallback((index, e) => {
    const { name, value } = e.target
    setDetalles(prev => {
      const nuevos = [...prev]
      nuevos[index] = { ...nuevos[index], [name]: value }
      return nuevos
    })
  }, [])

  const agregarDetalle  = useCallback(() => setDetalles(prev => [...prev, { ...detalleVacio }]), [])
  const eliminarDetalle = useCallback((i) => {
    setDetalles(prev => prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i))
  }, [])

  const totalKilos  = detalles.reduce((acc, d) => acc + (Number(d.kilos)  || 0), 0)
  const totalBultos = detalles.reduce((acc, d) => acc + (Number(d.bultos) || 0), 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!form.empresa) {
        setError('Debes seleccionar una empresa.')
        return
    }
    if (loading || submitted) return
    setSubmitted(true)
    setLoading(true)
    setError(null)
    try {
        const detallesLimpios = detalles.map(d => ({
        ...d,
        muestra: d.muestra || null,
        factor: d.factor === '' ? null : d.factor,
        humedad: d.humedad === '' ? null : d.humedad,
        pasilla: d.pasilla === '' ? null : d.pasilla,
        }))
        await createVenta({ ...form, detalles: detallesLimpios })
        onSaved()
        onClose()
    } catch (err) {
        setSubmitted(false)
        const data = err.response?.data
        if (data?.stock) setError(data.stock.join(' | '))
        else setError('Error al guardar. Verifica los datos.')
    } finally {
        setLoading(false)
    }
    }

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
        width: '100%', maxWidth: '760px',
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
              Nueva remisión
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>
              El número se genera automáticamente
            </p>
          </div>
          <button type="button" onClick={onClose}
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

            {error && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fecaca',
                borderRadius: '6px', padding: '10px 12px',
                color: '#dc2626', fontSize: '12px',
              }}>
                {error}
              </div>
            )}

            <Seccion label="Datos generales" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>

              <div>
                <label style={labelStyle}>Fecha *</label>
                <input type="date" name="fecha" value={form.fecha}
                  onChange={handleChange} required
                  style={inputStyle} onFocus={focusGreen} onBlur={blurGray}
                />
              </div>

              {/* ── Buscador de empresa ── */}
              <div ref={dropdownRef} style={{ position: 'relative' }}>
                <label style={labelStyle}>Empresa *</label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: '10px', top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8', pointerEvents: 'none',
                    display: 'flex', alignItems: 'center',
                  }}>
                    <IconSearch />
                  </span>
                  <input
                    type="text"
                    value={busqueda}
                    onChange={e => {
                      setBusqueda(e.target.value)
                      if (empresaSeleccionada) limpiarEmpresa()
                    }}
                    placeholder="Buscar por nombre o NIT..."
                    style={{ ...inputStyle, paddingLeft: '32px', paddingRight: empresaSeleccionada ? '32px' : '12px' }}
                    onFocus={focusGreen} onBlur={blurGray}
                    autoComplete="off"
                  />
                  {empresaSeleccionada && (
                    <button
                      type="button"
                      onClick={limpiarEmpresa}
                      style={{
                        position: 'absolute', right: '8px', top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none', border: 'none',
                        cursor: 'pointer', color: '#94a3b8',
                        display: 'flex', alignItems: 'center', padding: '2px',
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = '#dc2626'}
                      onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                    >
                      <IconX />
                    </button>
                  )}
                </div>

                {dropdownVisible && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0,
                    background: 'white', border: '1px solid #e2e8f0',
                    borderRadius: '6px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                    zIndex: 10, marginTop: '2px', maxHeight: '200px', overflowY: 'auto',
                  }}>
                    {buscando ? (
                      <div style={{ padding: '10px 12px', color: '#94a3b8', fontSize: '12px' }}>
                        Buscando...
                      </div>
                    ) : resultados.length === 0 ? (
                      <div style={{ padding: '10px 12px', color: '#94a3b8', fontSize: '12px' }}>
                        No se encontraron empresas.
                      </div>
                    ) : (
                      resultados.map(r => (
                        <div key={r.id} onClick={() => seleccionarEmpresa(r)}
                          style={{
                            padding: '9px 12px', cursor: 'pointer',
                            fontSize: '13px', color: '#0f172a',
                            borderBottom: '1px solid #f1f5f9',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f0fdf4'}
                          onMouseLeave={e => e.currentTarget.style.background = 'white'}
                        >
                          <span style={{ fontWeight: 500 }}>{r.nombre}</span>
                          {r.cedula && (
                            <span style={{ color: '#94a3b8', fontSize: '12px', marginLeft: '8px' }}>
                              {r.cedula}
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                <input type="text" required value={form.empresa} onChange={() => {}}
                  style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
                  tabIndex={-1}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Cuenta</label>
                <input type="text" name="cuenta" value={form.cuenta}
                  onChange={handleChange} placeholder="Ej: SMS, CP, Practices..."
                  style={inputStyle} onFocus={focusGreen} onBlur={blurGray}
                />
              </div>
            </div>

            {/* ── Mercancía ── */}
            <Seccion label="Mercancía" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {detalles.map((d, i) => (
                <div key={i} style={{
                  border: '1px solid #e2e8f0', borderRadius: '8px',
                  padding: '14px', background: '#f8fafc',
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ ...labelStyle, fontSize: '11px' }}>Tipo de café *</label>
                      <select name="tipo_cafe" value={d.tipo_cafe}
                        onChange={e => handleDetalleChange(i, e)} required
                        style={{ ...inputStyle, fontSize: '12px', padding: '6px 10px' }}
                        onFocus={focusGreen} onBlur={blurGray}
                      >
                        <option value="">Selecciona</option>
                        {tiposCafe.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ ...labelStyle, fontSize: '11px' }}>Bodega *</label>
                      <select name="bodega" value={d.bodega}
                        onChange={e => handleDetalleChange(i, e)} required
                        style={{ ...inputStyle, fontSize: '12px', padding: '6px 10px' }}
                        onFocus={focusGreen} onBlur={blurGray}
                      >
                        <option value="">Selecciona</option>
                        {bodegas.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ ...labelStyle, fontSize: '11px' }}>Bultos *</label>
                      <input type="number" name="bultos" value={d.bultos}
                        onChange={e => handleDetalleChange(i, e)} required min="1"
                        placeholder="0"
                        style={{ ...inputStyle, fontSize: '12px', padding: '6px 10px' }}
                        onFocus={focusGreen} onBlur={blurGray}
                      />
                    </div>
                    <div>
                      <label style={{ ...labelStyle, fontSize: '11px' }}>Kilos *</label>
                      <input type="number" name="kilos" value={d.kilos}
                        onChange={e => handleDetalleChange(i, e)} required min="0.01" step="0.01"
                        placeholder="0.00"
                        style={{ ...inputStyle, fontSize: '12px', padding: '6px 10px' }}
                        onFocus={focusGreen} onBlur={blurGray}
                      />
                    </div>
                    {/* ── Campos opcionales de calidad ── */}
                    <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #e2e8f0' }}>
                        <p style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                            Calidad (opcional)
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
                            <div>
                            <label style={{ ...labelStyle, fontSize: '11px' }}>Muestra</label>
                            <input type="text" name="muestra" value={d.muestra}
                                onChange={e => handleDetalleChange(i, e)} placeholder="Ref."
                                style={{ ...inputStyle, fontSize: '12px', padding: '6px 10px' }}
                                onFocus={focusGreen} onBlur={blurGray}
                            />
                            </div>
                            <div>
                            <label style={{ ...labelStyle, fontSize: '11px' }}>Factor</label>
                            <input type="number" name="factor" value={d.factor} step="0.01"
                                onChange={e => handleDetalleChange(i, e)} placeholder="0.00"
                                style={{ ...inputStyle, fontSize: '12px', padding: '6px 10px' }}
                                onFocus={focusGreen} onBlur={blurGray}
                            />
                            </div>
                            <div>
                            <label style={{ ...labelStyle, fontSize: '11px' }}>Humedad %</label>
                            <input type="number" name="humedad" value={d.humedad} step="0.01"
                                onChange={e => handleDetalleChange(i, e)} placeholder="0.00"
                                style={{ ...inputStyle, fontSize: '12px', padding: '6px 10px' }}
                                onFocus={focusGreen} onBlur={blurGray}
                            />
                            </div>
                            <div>
                            <label style={{ ...labelStyle, fontSize: '11px' }}>Pasilla %</label>
                            <input type="number" name="pasilla" value={d.pasilla} step="0.01"
                                onChange={e => handleDetalleChange(i, e)} placeholder="0.00"
                                style={{ ...inputStyle, fontSize: '12px', padding: '6px 10px' }}
                                onFocus={focusGreen} onBlur={blurGray}
                            />
                            </div>
                        </div>
                    </div>
                  </div>
                  {detalles.length > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                      <button type="button" onClick={() => eliminarDetalle(i)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '4px',
                          padding: '4px 8px', borderRadius: '5px', border: 'none',
                          background: '#fef2f2', color: '#dc2626',
                          fontSize: '11px', fontWeight: 500, cursor: 'pointer',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                        onMouseLeave={e => e.currentTarget.style.background = '#fef2f2'}
                      >
                        <IconTrash /> Eliminar línea
                      </button>
                    </div>
                  )}
                </div>
              ))}

              <button type="button" onClick={agregarDetalle}
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '6px 12px', borderRadius: '6px', alignSelf: 'flex-start',
                  border: '1px solid #bbf7d0', background: '#f0fdf4',
                  color: '#16a34a', fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#dcfce7'}
                onMouseLeave={e => e.currentTarget.style.background = '#f0fdf4'}
              >
                <IconPlus /> Agregar tipo de café
              </button>
            </div>

            {(totalKilos > 0 || totalBultos > 0) && (
              <div style={{
                background: '#f8fafc', border: '1px solid #e2e8f0',
                borderRadius: '6px', padding: '10px 14px',
                display: 'flex', gap: '24px',
              }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Total bultos: <strong style={{ color: '#0f172a' }}>{totalBultos}</strong>
                </span>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Total kilos: <strong style={{ color: '#0f172a' }}>{totalKilos.toLocaleString('es-CO')} kg</strong>
                </span>
              </div>
            )}

            {/* ── Conductor ── */}
            <Seccion label="Datos del conductor" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {[
                { name: 'conductor_nombre',    label: 'Nombre *',   placeholder: 'Nombre completo',  required: true },
                { name: 'conductor_cedula',    label: 'Cédula *',   placeholder: 'Número de cédula', required: true },
                { name: 'conductor_direccion', label: 'Dirección',  placeholder: 'Dirección' },
                { name: 'conductor_telefono',  label: 'Teléfono',   placeholder: 'Teléfono' },
              ].map(field => (
                <div key={field.name}>
                  <label style={labelStyle}>{field.label}</label>
                  <input type="text" name={field.name} value={form[field.name]}
                    onChange={handleChange} required={field.required}
                    placeholder={field.placeholder}
                    style={inputStyle} onFocus={focusGreen} onBlur={blurGray}
                  />
                </div>
              ))}
            </div>

            {/* ── Vehículo ── */}
            <Seccion label="Datos del vehículo" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
              {[
                { name: 'vehiculo_clase',  label: 'Clase',    placeholder: 'Ej: Camión' },
                { name: 'vehiculo_placas', label: 'Placas *', placeholder: 'Ej: AJH 274', required: true },
                { name: 'vehiculo_marca',  label: 'Marca',    placeholder: 'Ej: Dodge' },
                { name: 'vehiculo_color',  label: 'Color',    placeholder: 'Ej: Vinotinto' },
                { name: 'vehiculo_modelo', label: 'Modelo',   placeholder: 'Año modelo' },
              ].map(field => (
                <div key={field.name}>
                  <label style={labelStyle}>{field.label}</label>
                  <input type="text" name={field.name} value={form[field.name]}
                    onChange={handleChange} required={field.required}
                    placeholder={field.placeholder}
                    style={inputStyle} onFocus={focusGreen} onBlur={blurGray}
                  />
                </div>
              ))}
            </div>

            {/* ── Flete ── */}
            <Seccion label="Flete" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Valor del flete</label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: '10px', top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8', fontSize: '13px', pointerEvents: 'none',
                  }}>$</span>
                  <input type="number" name="flete_valor" value={form.flete_valor}
                    onChange={handleChange} min="0" step="0.01" placeholder="0"
                    style={{ ...inputStyle, paddingLeft: '22px' }}
                    onFocus={focusGreen} onBlur={blurGray}
                  />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Pagadero por</label>
                <input type="text" name="flete_pagadero_por" value={form.flete_pagadero_por}
                  onChange={handleChange} placeholder="Quien paga el flete"
                  style={inputStyle} onFocus={focusGreen} onBlur={blurGray}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Nota</label>
              <textarea name="nota" value={form.nota} onChange={handleChange} rows={2}
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
            position: 'sticky', bottom: 0, background: 'white',
          }}>
            <button type="button" onClick={onClose}
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
            <button type="submit" disabled={loading || submitted}
              style={{
                flex: 1, padding: '9px', border: 'none', borderRadius: '6px',
                background: (loading || submitted) ? '#86efac' : '#16a34a',
                color: 'white', fontSize: '13px', fontWeight: 500,
                cursor: (loading || submitted) ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (!loading && !submitted) e.currentTarget.style.background = '#15803d' }}
              onMouseLeave={e => { if (!loading && !submitted) e.currentTarget.style.background = '#16a34a' }}
            >
              {loading ? 'Guardando...' : 'Registrar remisión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}