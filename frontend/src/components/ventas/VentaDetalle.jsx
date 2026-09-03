import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { updateVenta } from '../../api/ventas'
import { imprimirRemisionCarta } from '../../utils/imprimirRemisionCarta' // ÍTEM 31

const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)
const IconPrint = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 6 2 18 2 18 9"/>
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
    <rect x="6" y="14" width="12" height="8"/>
  </svg>
)

function Dato({ label, value }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
      <span style={{
        fontSize: '10px', color: '#94a3b8', fontWeight: 500,
        textTransform: 'uppercase', letterSpacing: '0.4px',
      }}>
        {label}
      </span>
      <span style={{ fontSize: '13px', color: '#0f172a' }}>{value}</span>
    </div>
  )
}

const fmt = (n) =>
  Number(n).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

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

export default function VentaDetalle({ venta, onClose, onUpdated }) {
  const { usuario } = useAuth()
  const esJefe = usuario?.rol === 'jefe'

  const [precioKilo, setPrecioKilo] = useState(venta.precio_kilo_jefe || '')
  const [guardando, setGuardando]   = useState(false)
  const [error, setError]           = useState('')
  const [guardado, setGuardado]     = useState(false)

  const handleGuardarJefe = async () => {
    setGuardando(true)
    setError('')
    try {
      await updateVenta(venta.id, { precio_kilo_jefe: precioKilo || null })
      setGuardado(true)
      onUpdated?.()
      setTimeout(() => setGuardado(false), 2000)
    } catch {
      setError('Error al guardar. Intenta de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  // ── ÍTEM 31: la remisión ahora se imprime en hoja Carta (EPSON
  // L3250), no como ticket térmico de 80mm. Toda la plantilla vive en
  // utils/imprimirRemisionCarta.js -- este componente solo la llama.
  const handleReimprimir = () => {
    imprimirRemisionCarta(venta, { pieTexto: 'Reimpreso el' })
  }

  const tieneCalidad = venta.detalles.some(
    d => d.muestra || d.factor || d.humedad || d.pasilla
  )

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(15, 23, 42, 0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 50, padding: '16px',
    }}>
      <div style={{
        background: 'white', borderRadius: '12px',
        width: '100%', maxWidth: '720px',
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        display: 'flex', flexDirection: 'column',
      }}>

        {/* ── Cabecera ── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          padding: '18px 20px', borderBottom: '1px solid #f1f5f9',
          position: 'sticky', top: 0, background: 'white', zIndex: 1,
        }}>
          <div>
            <p style={{
              fontSize: '10px', color: '#94a3b8', fontWeight: 500,
              textTransform: 'uppercase', letterSpacing: '0.4px', margin: 0,
            }}>
              Remisión
            </p>
            <h2 style={{
              fontSize: '18px', fontWeight: 700,
              fontFamily: 'monospace', color: '#16a34a', margin: '2px 0',
            }}>
              {venta.numero_remision}
            </h2>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
              {venta.fecha} — {venta.empresa_nombre}
              {venta.cuenta && (
                <span style={{ marginLeft: '6px', color: '#94a3b8' }}>
                  · Cuenta: {venta.cuenta}
                </span>
              )}
            </p>
          </div>
          <button onClick={onClose} style={{
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

          {/* ── SECCIÓN EXCLUSIVA JEFE ── */}
          {esJefe && (
            <div style={{
              background: '#fffbeb', border: '1px solid #fde68a',
              borderRadius: '10px', padding: '16px',
            }}>
              <p style={{
                fontSize: '11px', fontWeight: 600, color: '#92400e',
                textTransform: 'uppercase', letterSpacing: '0.4px',
                margin: '0 0 14px',
              }}>
                Gestión del jefe
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', alignItems: 'start' }}>
                <div>
                  <label style={{ ...labelStyle, color: '#92400e' }}>
                    Precio de venta por kilo
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute', left: '10px', top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#94a3b8', fontSize: '13px', pointerEvents: 'none',
                    }}>$</span>
                    <input
                      type="number"
                      value={precioKilo}
                      onChange={e => setPrecioKilo(e.target.value)}
                      placeholder="0"
                      min="0"
                      style={{ ...inputStyle, paddingLeft: '22px' }}
                      onFocus={e => e.target.style.borderColor = '#f59e0b'}
                      onBlur={e  => e.target.style.borderColor = '#e2e8f0'}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ ...labelStyle, color: '#92400e' }}>
                    Utilidad de la remisión
                  </label>
                  {venta.utilidad_total !== null && venta.utilidad_total !== undefined ? (
                    <div style={{
                      padding: '8px 12px', borderRadius: '6px',
                      background: venta.utilidad_total >= 0 ? '#f0fdf4' : '#fef2f2',
                      border: `1px solid ${venta.utilidad_total >= 0 ? '#bbf7d0' : '#fecaca'}`,
                      fontSize: '16px', fontWeight: 700,
                      color: venta.utilidad_total >= 0 ? '#16a34a' : '#dc2626',
                    }}>
                      {fmt(venta.utilidad_total)}
                    </div>
                  ) : (
                    <div style={{ ...inputStyle, background: '#f8fafc', color: '#94a3b8' }}>
                      Asigna el precio para calcularla
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div style={{
                  marginTop: '12px', background: '#fef2f2', border: '1px solid #fecaca',
                  borderRadius: '6px', padding: '8px 12px',
                  color: '#dc2626', fontSize: '12px',
                }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px' }}>
                <button
                  onClick={handleGuardarJefe}
                  disabled={guardando}
                  style={{
                    padding: '8px 20px', borderRadius: '6px', border: 'none',
                    background: guardado ? '#16a34a' : guardando ? '#fde68a' : '#f59e0b',
                    color: 'white', fontSize: '13px', fontWeight: 600,
                    cursor: guardando ? 'not-allowed' : 'pointer',
                  }}
                >
                  {guardado ? '✓ Guardado' : guardando ? 'Guardando...' : 'Guardar precio'}
                </button>
              </div>
            </div>
          )}

          {/* ── Tabla mercancía ── */}
          <div>
            <p style={{
              fontSize: '11px', fontWeight: 600, color: '#475569',
              marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.4px',
            }}>
              Mercancía
            </p>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#0f172a' }}>
                    {['Tipo', 'Bodega', 'Bultos', 'Kilos',
                      ...(tieneCalidad ? ['Muestra', 'Factor', 'Humedad %', 'Pasilla %'] : [])
                    ].map((col, i) => (
                      <th key={col} style={{
                        padding: '9px 14px', textAlign: i >= 2 ? 'right' : 'left',
                        color: '#e2e8f0', fontWeight: 500, fontSize: '11px',
                        whiteSpace: 'nowrap',
                      }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {venta.detalles.map(d => (
                    <tr key={d.id} style={{ borderTop: '1px solid #f1f5f9' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'white'}
                    >
                      <td style={{ padding: '9px 14px', color: '#0f172a', fontWeight: 500 }}>
                        {d.tipo_cafe_nombre}
                      </td>
                      <td style={{ padding: '9px 14px', color: '#475569' }}>
                        {d.bodega_nombre}
                      </td>
                      <td style={{ padding: '9px 14px', color: '#475569', textAlign: 'right' }}>
                        {d.bultos}
                      </td>
                      <td style={{ padding: '9px 14px', color: '#475569', textAlign: 'right' }}>
                        {Number(d.kilos).toLocaleString('es-CO')} kg
                      </td>
                      {tieneCalidad && (
                        <>
                          <td style={{ padding: '9px 14px', color: '#475569', textAlign: 'right' }}>{d.muestra || '—'}</td>
                          <td style={{ padding: '9px 14px', color: '#475569', textAlign: 'right' }}>{d.factor ?? '—'}</td>
                          <td style={{ padding: '9px 14px', color: '#475569', textAlign: 'right' }}>{d.humedad ?? '—'}</td>
                          <td style={{ padding: '9px 14px', color: '#475569', textAlign: 'right' }}>{d.pasilla ?? '—'}</td>
                        </>
                      )}
                    </tr>
                  ))}
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
                    {tieneCalidad && <td colSpan={4} />}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Conductor y vehículo ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', background: '#f8fafc' }}>
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
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', background: '#f8fafc' }}>
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
                  <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 2px' }}>
                    Pagadero por: {venta.flete_pagadero_por}
                  </p>
                )}
                {venta.flete_caja_bodega ? (
                  <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
                    Caja a cargo: <strong>{venta.flete_caja_bodega}</strong>
                    {venta.flete_descontado && (
                      <span style={{
                        marginLeft: '6px', background: '#dcfce7', color: '#15803d',
                        padding: '1px 6px', borderRadius: '4px', fontSize: '10px',
                      }}>
                        Descontado
                      </span>
                    )}
                  </p>
                ) : (
                  <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>Caja sin asignar</p>
                )}
              </div>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#16a34a' }}>
                {fmt(venta.flete_valor)}
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
        <div style={{
          padding: '16px 20px', borderTop: '1px solid #f1f5f9',
          display: 'flex', flexDirection: 'column', gap: '10px',
        }}>
          <button
            onClick={handleReimprimir}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 8, padding: '9px', borderRadius: 6,
              border: '1px solid #e2e8f0', background: 'white',
              color: '#0f172a', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
            onMouseLeave={e => e.currentTarget.style.background = 'white'}
          >
            <IconPrint /> Reimprimir remisión
          </button>
          <button onClick={onClose} style={{
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