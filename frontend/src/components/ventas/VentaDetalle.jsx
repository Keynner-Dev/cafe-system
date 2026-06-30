import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { updateVenta } from '../../api/ventas'

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

  const handleReimprimir = () => {
    const fecha = new Date(venta.fecha + 'T12:00:00').toLocaleDateString('es-CO', {
      day: '2-digit', month: 'long', year: 'numeric',
    })

    const bloquesMercancia = venta.detalles.map(d => {
      const calidad = [
        d.muestra ? `Muestra: ${d.muestra}` : '',
        d.factor  ? `Factor: ${d.factor}`   : '',
        d.humedad ? `Humedad: ${d.humedad}%` : '',
        d.pasilla ? `Pasilla: ${d.pasilla}%` : '',
      ].filter(Boolean).join(' | ')

      return `
        <div class="linea">
          <div class="linea-tipo">${d.tipo_cafe_nombre}</div>
          <div class="linea-sub">${d.bodega_nombre}</div>
          <div class="linea-row">
            <span>${d.bultos} bulto${d.bultos !== 1 ? 's' : ''}</span>
            <span class="linea-kilos">${Number(d.kilos).toLocaleString('es-CO')} kg</span>
          </div>
          ${calidad ? `<div class="linea-calidad">${calidad}</div>` : ''}
        </div>`
    }).join('')

    const ventana = window.open('', '_blank', 'width=400,height=700')
    ventana.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${venta.numero_remision} — Cafe San Joaquin</title>
        <style>
          @page { size: 80mm auto; margin: 2mm 3mm; }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          html { width: 74mm; }
          body {
            width: 74mm;
            height: fit-content;
            font-family: 'Courier New', Courier, monospace;
            color: #000000;
            font-size: 11px;
            line-height: 1.35;
          }
          .ticket { width: 100%; padding: 1mm 0; }
          .header { text-align: center; margin-bottom: 6px; }
          .header h1 { font-size: 13px; font-weight: 700; letter-spacing: 0.5px; }
          .header p { font-size: 9px; margin-top: 2px; }
          .sep        { border: none; border-top: 1px dashed #000; margin: 5px 0; }
          .sep-solid  { border: none; border-top: 1px solid #000;  margin: 5px 0; }
          .sep-double { border: none; border-top: 2px solid #000;  margin: 6px 0; }
          .rem-info { text-align: center; margin-bottom: 5px; }
          .rem-info .num   { font-size: 13px; font-weight: 700; }
          .rem-info .fecha { font-size: 9px; margin-top: 1px; }
          .empresa { text-align: center; margin-bottom: 5px; }
          .empresa label { font-size: 8px; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 700; }
          .empresa p { font-size: 11px; font-weight: 700; margin-top: 1px; word-wrap: break-word; }
          .empresa .cuenta { font-size: 9.5px; margin-top: 2px; }
          .seccion-titulo { font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 3px; }
          .dato-row { display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 2px; }
          .dato-row .val { font-weight: 600; text-align: right; max-width: 55%; word-break: break-word; }
          .dato-full { font-size: 10px; margin-bottom: 2px; word-wrap: break-word; }
          .detalle-titulo { font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 4px; }
          .linea { margin-bottom: 6px; }
          .linea-tipo { font-size: 11px; font-weight: 700; }
          .linea-sub  { font-size: 9.5px; }
          .linea-row  { display: flex; justify-content: space-between; font-size: 10px; margin-top: 1px; }
          .linea-kilos  { font-weight: 700; }
          .linea-calidad { font-size: 9px; margin-top: 1px; }
          .totales { margin: 4px 0; }
          .total-row { display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; margin-bottom: 2px; }
          .flete { font-size: 10px; margin-bottom: 4px; word-wrap: break-word; }
          .flete strong { font-weight: 700; }
          .nota { font-size: 9px; margin-bottom: 5px; word-wrap: break-word; }
          .footer { text-align: center; font-size: 8px; margin-top: 8px; }
          @media print { html, body { width: 80mm; } }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="header">
            <h1>CAFE SAN JOAQUIN</h1>
            <p>NIT. 901659573-6</p>
          </div>
          <div class="sep"></div>
          <div class="rem-info">
            <div class="num">${venta.numero_remision}</div>
            <div class="fecha">${fecha}</div>
          </div>
          <div class="empresa">
            <label>Empresa compradora</label>
            <p>${venta.empresa_nombre}</p>
            ${venta.cuenta ? `<div class="cuenta">Cuenta: ${venta.cuenta}</div>` : ''}
          </div>
          <div class="sep"></div>
          <div class="seccion-titulo">Conductor</div>
          <div class="dato-full"><strong>${venta.conductor_nombre}</strong> — CC ${venta.conductor_cedula}</div>
          ${venta.conductor_telefono ? `<div class="dato-full">${venta.conductor_telefono}</div>` : ''}
          ${venta.conductor_direccion ? `<div class="dato-full">${venta.conductor_direccion}</div>` : ''}
          <div class="sep-solid" style="margin-top:5px"></div>
          <div class="seccion-titulo">Vehiculo</div>
          <div class="dato-row"><span>Placas</span><span class="val">${venta.vehiculo_placas}</span></div>
          ${venta.vehiculo_clase  ? `<div class="dato-row"><span>Clase</span><span class="val">${venta.vehiculo_clase}</span></div>`  : ''}
          ${venta.vehiculo_marca  ? `<div class="dato-row"><span>Marca</span><span class="val">${venta.vehiculo_marca}</span></div>`  : ''}
          ${venta.vehiculo_color  ? `<div class="dato-row"><span>Color</span><span class="val">${venta.vehiculo_color}</span></div>`  : ''}
          ${venta.vehiculo_modelo ? `<div class="dato-row"><span>Modelo</span><span class="val">${venta.vehiculo_modelo}</span></div>` : ''}
          <div class="sep"></div>
          <div class="detalle-titulo">Mercancia</div>
          ${bloquesMercancia}
          <div class="sep-double"></div>
          <div class="totales">
            <div class="total-row"><span>Total bultos</span><span>${venta.total_bultos}</span></div>
            <div class="total-row"><span>Total kilos</span><span>${Number(venta.total_kilos).toLocaleString('es-CO')} kg</span></div>
          </div>
          ${venta.flete_valor && Number(venta.flete_valor) > 0 ? `
          <div class="sep"></div>
          <div class="flete">
            <strong>Flete:</strong> ${fmt(venta.flete_valor)}
            ${venta.flete_pagadero_por ? `<br>Pagadero por: ${venta.flete_pagadero_por}` : ''}
          </div>` : ''}
          ${venta.nota ? `<div class="sep"></div><p class="nota">Nota: ${venta.nota}</p>` : ''}
          <div class="sep"></div>
          <div class="footer">
            Cafe San Joaquin SAS<br>
            Reimpreso el ${new Date().toLocaleDateString('es-CO')}
          </div>
        </div>
        <script>window.onload = () => window.print()</script>
      </body>
      </html>
    `)
    ventana.document.close()
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