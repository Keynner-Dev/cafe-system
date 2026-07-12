import { useState } from 'react'

// ── Logo del ticket (ítem 23) — versión monocroma (negro sobre
// transparente), en base64 para no depender de una ruta de assets del
// bundler: funciona igual en desarrollo y en build de producción, y no
// se rompe si el archivo se mueve. Fuente: logo oficial de Cafe San,
// convertido a blanco y negro y recortado. ──
const LOGO_TICKET_BASE64 = 'data:image/png;base64,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'

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
            font-size: 12px;
            line-height: 1.4;
            -webkit-font-smoothing: none;
          }
          .ticket { width: 100%; padding: 1mm 0; }

          /* ── Ítem 23: encabezado con logo + Cafe San + Jimmi Martinez + NIT ── */
          .header { text-align: center; margin-bottom: 7px; }
          .header .logo { width: 62px; height: auto; display: block; margin: 0 auto 4px; }
          .header h1 { font-size: 16px; font-weight: 700; letter-spacing: 0.5px; }
          .header .propietario { font-size: 11px; font-weight: 700; margin-top: 2px; }
          .header .nit { font-size: 10px; margin-top: 2px; }

          .sep { border: none; border-top: 1px dashed #000; margin: 6px 0; }
          .sep-double { border: none; border-top: 2px solid #000; margin: 6px 0; }

          .compra-info { text-align: center; margin-bottom: 5px; }
          .compra-info .num { font-size: 14px; font-weight: 700; }
          .compra-info .fecha { font-size: 10px; margin-top: 1px; }

          .caficultor { margin-bottom: 5px; }
          .caficultor label { display: block; font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; }
          .caficultor p { font-size: 12px; font-weight: 700; margin-top: 1px; word-wrap: break-word; }

          .detalle-titulo { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }

          .linea { margin-bottom: 7px; }
          .linea-tipo { font-size: 12px; font-weight: 700; }
          .linea-sub { font-size: 10.5px; }
          .linea-precio { display: flex; justify-content: space-between; font-size: 11px; margin-top: 1px; }
          .linea-subtotal { font-weight: 700; }
          .linea-deposito { font-size: 10px; font-weight: 700; margin-top: 1px; }

          .totales-desglose { margin: 5px 0 2px; }
          .fila-total { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px; }
          .fila-abono { font-weight: 600; }
          .letra-detalle { font-size: 9.5px; margin-bottom: 3px; line-height: 1.4; }

          .total-box { text-align: center; margin: 6px 0 4px; }
          .total-box span { font-size: 10px; display: block; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; }
          .total-box strong { font-size: 20px; font-weight: 700; display: block; margin-top: 2px; }

          .nota { font-size: 10px; margin-bottom: 5px; word-wrap: break-word; }
          .footer { text-align: center; font-size: 9.5px; margin-top: 8px; line-height: 1.5; }
          .footer .telefono { font-weight: 700; }

          @media print { html, body { width: 80mm; } }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="header">
            <img class="logo" src="${LOGO_TICKET_BASE64}" alt="Cafe San" />
            <h1>Cafe San</h1>
            <p class="propietario">Jimmi Martinez</p>
            <p class="nit">NIT. 901659573-8</p>
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
            Tel: <span class="telefono">3126164059</span><br>
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