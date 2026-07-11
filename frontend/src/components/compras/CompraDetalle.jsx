import { useState } from 'react'

const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)
const IconWhatsApp = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.522 5.851L.057 23.5l5.799-1.52A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.006-1.368l-.36-.214-3.722.976.993-3.624-.235-.372A9.818 9.818 0 1 1 12 21.818z"/>
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

// ── Limpia el número de WhatsApp dejando solo dígitos (igual que en
// CompraModal.jsx — la API de wa.me no acepta '+' ni espacios) ──
function limpiarNumeroWhatsApp(numero) {
  if (!numero) return ''
  return String(numero).replace(/\D/g, '')
}

export default function CompraDetalle({ compra, onClose, onLiquidar }) {
  const [enviando, setEnviando] = useState(false)

  const formatCOP = (val) => `$${Number(val || 0).toLocaleString('es-CO')}`

  const abonosLetra = compra.abonos_letra || []
  const totalAbonos = abonosLetra.reduce((acc, a) => acc + Number(a.valor || 0), 0)
  const hayAbonos = totalAbonos > 0
  const totalRealPagado = Math.max(Number(compra.total || 0) - totalAbonos, 0)

  // ── Mensaje de WhatsApp (mismo formato que en CompraModal.jsx,
  // duplicado a propósito para no tocar ese archivo — ver nota en el
  // commit del ítem 16) ──
  const armarMensajeWhatsApp = () => {
    const fecha = new Date(compra.fecha + 'T12:00:00').toLocaleDateString('es-CO', {
      day: '2-digit', month: 'long', year: 'numeric',
    })

    const lineasDetalle = compra.detalles.map(d => {
      if (d.es_deposito) {
        return `• ${d.tipo_cafe_nombre}\n  ${d.kilos} kg — _Depósito (liquidar después)_`
      }
      const subtotal = Number(d.kilos) * Number(d.precio_kilo)
      return (
        `• ${d.tipo_cafe_nombre}\n` +
        `  ${Number(d.kilos).toLocaleString('es-CO')} kg × ${formatCOP(d.precio_kilo)}/kg\n` +
        `  Subtotal: *${formatCOP(subtotal)}*`
      )
    }).join('\n\n')

    const marco = '───────────────────────'

    let msg = ''
    msg += `╔═══════════════════════╗\n`
    msg += `  *CAFÉ SAN JOAQUÍN*\n`
    msg += `  _Comprobante de compra_\n`
    msg += `╚═══════════════════════╝\n\n`
    msg += `*Compra #${compra.id}* · ${fecha}\n`
    msg += `Caficultor: *${compra.caficultor_nombre}*\n\n`
    msg += `${marco}\n`
    msg += `*DETALLE*\n`
    msg += `${marco}\n`
    msg += `${lineasDetalle}\n\n`
    msg += `${marco}\n`

    if (hayAbonos) {
      msg += `Subtotal café: *${formatCOP(compra.total)}*\n`
      abonosLetra.forEach(a => {
        msg += `Abono a letra #${a.letra_id}: *-${formatCOP(a.valor)}*\n`
        msg += `_Saldo restante de la letra: ${formatCOP(a.saldo_letra_restante)}_\n`
      })
      msg += `*TOTAL PAGADO: ${formatCOP(totalRealPagado)}*\n`
    } else {
      msg += `*TOTAL PAGADO: ${formatCOP(totalRealPagado)}*\n`
    }
    msg += `${marco}\n\n`

    if (compra.nota) {
      msg += `_Nota: ${compra.nota}_\n\n`
    }

    msg += `_¡Gracias por su confianza!_\n`
    msg += `_Café San Joaquín — calidad desde el campo_`

    return encodeURIComponent(msg)
  }

  const handleReenviarWhatsApp = () => {
    setEnviando(true)
    const msg = armarMensajeWhatsApp()
    // ── compra.caficultor_telefono_whatsapp es el campo nuevo del
    // serializer (ítem 16). Si el caficultor no tiene teléfono guardado,
    // cae al comportamiento de abrir WhatsApp sin número, igual que en
    // CompraModal.jsx, para no romper el flujo. ──
    const numero = limpiarNumeroWhatsApp(compra.caficultor_telefono_whatsapp)
    const url = numero
      ? `https://wa.me/${numero}?text=${msg}`
      : `https://wa.me/?text=${msg}`
    window.open(url, '_blank')
    setEnviando(false)
  }

  // ── Imprimible 80mm (mismo formato que CompraModal.jsx) ──
  const handleReimprimir = () => {
    const fecha = new Date(compra.fecha + 'T12:00:00').toLocaleDateString('es-CO', {
      day: '2-digit', month: 'long', year: 'numeric',
    })
    const detallesHTML = compra.detalles.map(d => {
      if (d.es_deposito) {
        return `
          <div class="linea">
            <div class="linea-tipo">${d.tipo_cafe_nombre}</div>
            <div class="linea-sub">${d.bodega_nombre} · ${d.kilos} kg</div>
            <div class="linea-deposito">DEPOSITO — liquidar despues</div>
          </div>`
      }
      const subtotal = Number(d.kilos) * Number(d.precio_kilo)
      return `
        <div class="linea">
          <div class="linea-tipo">${d.tipo_cafe_nombre}</div>
          <div class="linea-sub">${d.bodega_nombre} · ${Number(d.kilos).toLocaleString('es-CO')} kg</div>
          <div class="linea-precio">
            <span>${formatCOP(d.precio_kilo)}/kg</span>
            <span class="linea-subtotal">${formatCOP(subtotal)}</span>
          </div>
        </div>`
    }).join('')

    const totalesHTML = hayAbonos ? `
      <div class="totales-desglose">
        <div class="fila-total"><span>Subtotal cafe</span><span>${formatCOP(compra.total)}</span></div>
        ${abonosLetra.map(a => `
          <div class="fila-total fila-abono"><span>Abono a letra #${a.letra_id}</span><span>-${formatCOP(a.valor)}</span></div>
          <div class="letra-detalle">Saldo restante: ${formatCOP(a.saldo_letra_restante)}</div>
        `).join('')}
      </div>
      <div class="total-box">
        <span>TOTAL A PAGAR</span>
        <strong>${formatCOP(totalRealPagado)}</strong>
      </div>
    ` : `
      <div class="total-box">
        <span>TOTAL A PAGAR</span>
        <strong>${formatCOP(totalRealPagado)}</strong>
      </div>
    `

    const ventana = window.open('', '_blank', 'width=400,height=600')
    ventana.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Compra #${compra.id} — Cafe San Joaquin</title>
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

          .sep { border: none; border-top: 1px dashed #000; margin: 5px 0; }
          .sep-double { border: none; border-top: 2px solid #000; margin: 5px 0; }

          .compra-info { text-align: center; margin-bottom: 5px; }
          .compra-info .num { font-size: 13px; font-weight: 700; }
          .compra-info .fecha { font-size: 9px; margin-top: 1px; }

          .caficultor { margin-bottom: 5px; }
          .caficultor label { display: block; font-size: 8px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; }
          .caficultor p { font-size: 11px; font-weight: 700; margin-top: 1px; word-wrap: break-word; }

          .detalle-titulo { font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }

          .linea { margin-bottom: 6px; }
          .linea-tipo { font-size: 11px; font-weight: 700; }
          .linea-sub { font-size: 9.5px; }
          .linea-precio { display: flex; justify-content: space-between; font-size: 10px; margin-top: 1px; }
          .linea-subtotal { font-weight: 700; }
          .linea-deposito { font-size: 9px; font-weight: 700; margin-top: 1px; }

          .totales-desglose { margin: 5px 0 2px; }
          .fila-total { display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 2px; }
          .fila-abono { font-weight: 600; }
          .letra-detalle { font-size: 8.5px; margin-bottom: 3px; line-height: 1.4; }

          .total-box { text-align: center; margin: 6px 0 4px; }
          .total-box span { font-size: 9px; display: block; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; }
          .total-box strong { font-size: 18px; font-weight: 700; display: block; margin-top: 2px; }

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
          <div class="compra-info">
            <div class="num">Compra #${compra.id}</div>
            <div class="fecha">${fecha}</div>
          </div>
          <div class="sep"></div>
          <div class="caficultor">
            <label>Caficultor</label>
            <p>${compra.caficultor_nombre}</p>
          </div>
          <div class="sep"></div>
          <div class="detalle-titulo">Detalle</div>
          ${detallesHTML}
          <div class="sep-double"></div>
          ${totalesHTML}
          ${compra.nota ? `<div class="sep"></div><p class="nota">Nota: ${compra.nota}</p>` : ''}
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
        width: '100%', maxWidth: '640px',
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
              Compra #{compra.id}
            </h2>
            {/* ← caficultor_nombre en vez de proveedor_nombre */}
            <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>
              {compra.fecha} — {compra.caficultor_nombre}
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
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

          {compra.detalles.map(d => (
            <div
              key={d.id}
              style={{
                border: d.es_deposito ? '1px solid #fde68a' : '1px solid #e2e8f0',
                borderRadius: '8px', padding: '14px',
                background: d.es_deposito ? '#fffbeb' : '#f8fafc',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>

                {/* Info izquierda */}
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                    {d.tipo_cafe_nombre}
                  </p>
                  <p style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    {d.bodega_nombre}
                  </p>
                  <p style={{ fontSize: '12px', color: '#475569', marginTop: '6px' }}>
                    {d.kilos} kg
                    {d.precio_kilo && ` × ${formatCOP(d.precio_kilo)}/kg`}
                  </p>
                </div>

                {/* Info derecha */}
                <div style={{ textAlign: 'right' }}>
                  {d.es_deposito ? (
                    <>
                      <span style={{
                        background: '#fef9c3', color: '#ca8a04',
                        fontSize: '11px', fontWeight: 600,
                        padding: '2px 8px', borderRadius: '99px',
                        display: 'inline-block', marginBottom: '6px',
                      }}>
                        Depósito
                      </span>
                      <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 6px' }}>
                        Pendiente: <strong>{d.kilos_pendientes_liquidar} kg</strong>
                      </p>
                      {Number(d.kilos_pendientes_liquidar) > 0 ? (
                        <button
                          onClick={() => onLiquidar(d)}
                          style={{
                            padding: '5px 12px', borderRadius: '5px', border: 'none',
                            background: '#ca8a04', color: 'white',
                            fontSize: '11px', fontWeight: 500, cursor: 'pointer',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#a16207'}
                          onMouseLeave={e => e.currentTarget.style.background = '#ca8a04'}
                        >
                          Liquidar
                        </button>
                      ) : (
                        <span style={{
                          background: '#f0fdf4', color: '#16a34a',
                          fontSize: '11px', fontWeight: 600,
                          padding: '2px 8px', borderRadius: '99px',
                          display: 'inline-block',
                        }}>
                          Liquidado
                        </span>
                      )}
                    </>
                  ) : (
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                      {formatCOP(Number(d.kilos) * Number(d.precio_kilo))}
                    </span>
                  )}
                </div>
              </div>

              {/* Liquidaciones previas */}
              {d.es_deposito && d.liquidaciones?.length > 0 && (
                <div style={{
                  marginTop: '12px', paddingTop: '12px',
                  borderTop: '1px solid #fde68a',
                }}>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>
                    Liquidaciones registradas:
                  </p>
                  {d.liquidaciones.map(l => (
                    <div
                      key={l.id}
                      style={{
                        display: 'flex', justifyContent: 'space-between',
                        fontSize: '11px', color: '#475569', padding: '3px 0',
                      }}
                    >
                      <span>{l.fecha} — {l.kilos} kg × {formatCOP(l.precio_kilo)}/kg</span>
                      <span style={{ fontWeight: 600 }}>{formatCOP(l.subtotal)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* ── Totales ── */}
          <div style={{
            background: '#f8fafc', border: '1px solid #e2e8f0',
            borderRadius: '8px', padding: '14px 16px',
            display: 'flex', flexDirection: 'column', gap: '8px',
            marginTop: '4px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Subtotal café (normal + liquidaciones):
              </span>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                {formatCOP(compra.total)}
              </span>
            </div>

            {/* ── ÍTEM 16: si hubo abono a letra desde esta compra,
                 se muestra el desglose y el total real pagado ── */}
            {hayAbonos && (
              <>
                {abonosLetra.map(a => (
                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#92400e' }}>
                      − Abono a letra #{a.letra_id}:
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#ca8a04' }}>
                      {formatCOP(a.valor)}
                    </span>
                  </div>
                ))}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  paddingTop: '8px', borderTop: '1px solid #e2e8f0',
                }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
                    Total pagado en efectivo:
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#16a34a' }}>
                    {formatCOP(totalRealPagado)}
                  </span>
                </div>
              </>
            )}

            {compra.tiene_deposito_pendiente && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#ca8a04' }}>
                  Kilos en depósito pendientes:
                </span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#ca8a04' }}>
                  {Number(compra.kilos_deposito_pendiente).toLocaleString('es-CO')} kg
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Pie ── */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: '10px',
          padding: '16px 20px', borderTop: '1px solid #f1f5f9',
        }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleReenviarWhatsApp}
              disabled={enviando}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 8, padding: '9px', borderRadius: 6, border: 'none',
                background: '#25D366', color: 'white',
                fontSize: '13px', fontWeight: 600, cursor: enviando ? 'not-allowed' : 'pointer',
                opacity: enviando ? 0.7 : 1,
              }}
              onMouseEnter={e => { if (!enviando) e.currentTarget.style.background = '#1ebe5d' }}
              onMouseLeave={e => { if (!enviando) e.currentTarget.style.background = '#25D366' }}
            >
              <IconWhatsApp /> Reenviar WhatsApp
            </button>
            <button
              onClick={handleReimprimir}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 8, padding: '9px', borderRadius: 6,
                border: '1px solid #e2e8f0', background: 'white',
                color: '#0f172a', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}
            >
              <IconPrint /> Reimprimir
            </button>
          </div>

          <button
            onClick={onClose}
            style={{
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