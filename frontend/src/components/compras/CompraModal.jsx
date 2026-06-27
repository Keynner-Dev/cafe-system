import { useState, useEffect, useRef } from 'react'
import { createCompra } from '../../api/compras'
import { getTerceros } from '../../api/terceros'
import { getTiposCafe, getBodegas } from '../../api/inventario'
import { getPreciosHoy } from '../../api/precios'
import { getLetrasPendientesCaficultor } from '../../api/letras'
import { useAuth } from '../../context/AuthContext'

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
const IconAlert = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
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
const IconCheck = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
    stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

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

const crearDetalleVacio = (bodegaDefault = '') => ({
  tipo_cafe: '', bodega: bodegaDefault, kilos: '', precio_kilo: '', es_deposito: false
})

function formatCOP(val) {
  return `$${Number(val || 0).toLocaleString('es-CO')}`
}

// ── Limpia el número de WhatsApp dejando solo dígitos (la API de wa.me
// no acepta '+' ni espacios; ej: '+573001234567' → '573001234567') ──
function limpiarNumeroWhatsApp(numero) {
  if (!numero) return ''
  return String(numero).replace(/\D/g, '')
}


function PantallaExito({ compra, telefonoWhatsapp, subtotalCafe, valorAbono, letraInfo, onClose, onNuevaCompra }) {

  const hayAbono = Number(valorAbono) > 0
  const totalFinal = hayAbono ? Math.max(subtotalCafe - Number(valorAbono), 0) : subtotalCafe

  // ── NUEVO: contexto de la letra abonada — saldo restante después
  // de este abono, y su fecha/id para que quede claro a qué deuda
  // corresponde el descuento (no solo "se descontó algo"). ──
  const saldoRestanteLetra = letraInfo ? Math.max(Number(letraInfo.saldo) - Number(valorAbono), 0) : 0
  const fechaLetraFmt = letraInfo
    ? new Date(letraInfo.fecha_creacion).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
    : ''

  const armarMensajeWhatsApp = () => {
    const fecha = new Date(compra.fecha + 'T12:00:00').toLocaleDateString('es-CO', {
        day: '2-digit', month: 'long', year: 'numeric',
    })

    const lineasDetalle = compra.detalles.map(d => {
        if (d.es_deposito) {
        return `  ☕ ${d.tipo_cafe_nombre}\n  📦 ${d.kilos} kg — _Depósito (liquidar después)_`
        }
        const subtotal = Number(d.kilos) * Number(d.precio_kilo)
        return (
        `  ☕ ${d.tipo_cafe_nombre}\n` +
        `  📦 ${Number(d.kilos).toLocaleString('es-CO')} kg × ${formatCOP(d.precio_kilo)}/kg\n` +
        `  💵 Subtotal: *${formatCOP(subtotal)}*`
        )
    }).join('\n\n')

    const separador = '━━━━━━━━━━━━━━━━━━━━━━'

    let msg = ''
    msg += `🌿 *CAFÉ SAN JOAQUÍN*\n`
    msg += `_Comprobante de compra_\n`
    msg += `${separador}\n\n`
    msg += `🧾 *Compra #${compra.id}*\n`
    msg += `📅 Fecha: ${fecha}\n`
    msg += `👤 Caficultor: *${compra.caficultor_nombre}*\n\n`
    msg += `${separador}\n`
    msg += `*DETALLE*\n`
    msg += `${separador}\n\n`
    msg += `${lineasDetalle}\n\n`
    msg += `${separador}\n`

    // ── Desglose si hubo abono a letra ──
    if (hayAbono) {
      msg += `💵 Subtotal café: *${formatCOP(subtotalCafe)}*\n`
      msg += `📋 Abono a letra${letraInfo ? ` #${letraInfo.id}` : ''}${fechaLetraFmt ? ` (creada ${fechaLetraFmt})` : ''}: *-${formatCOP(valorAbono)}*\n`
      if (letraInfo) {
        msg += `   _Saldo restante de la letra: ${formatCOP(saldoRestanteLetra)}_\n`
      }
      msg += `💰 *TOTAL PAGADO: ${formatCOP(totalFinal)}*\n`
    } else {
      msg += `💰 *TOTAL PAGADO: ${formatCOP(totalFinal)}*\n`
    }
    msg += `${separador}\n\n`

    if (compra.nota) {
        msg += `📝 _Nota: ${compra.nota}_\n\n`
    }

    msg += `_¡Gracias por su confianza!_ 🤝\n`
    msg += `_Café San Joaquín — Calidad desde el campo_`

    return encodeURIComponent(msg)
    }

  const handleWhatsApp = () => {
    const msg = armarMensajeWhatsApp()
    const numero = limpiarNumeroWhatsApp(telefonoWhatsapp)
    const url = numero
      ? `https://wa.me/${numero}?text=${msg}`
      : `https://wa.me/?text=${msg}`
    window.open(url, '_blank')
  }

  // ── Imprimible adaptado a 80mm (impresora térmica) ──
  const handleImprimir = () => {
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

  const totalesHTML = hayAbono ? `
    <div class="totales-desglose">
      <div class="fila-total"><span>Subtotal cafe</span><span>${formatCOP(subtotalCafe)}</span></div>
      <div class="fila-total fila-abono"><span>Abono a letra${letraInfo ? ` #${letraInfo.id}` : ''}</span><span>-${formatCOP(valorAbono)}</span></div>
      ${letraInfo ? `<div class="letra-detalle">Letra creada: ${fechaLetraFmt} | Saldo restante: ${formatCOP(saldoRestanteLetra)}</div>` : ''}
    </div>
    <div class="total-box">
      <span>TOTAL A PAGAR</span>
      <strong>${formatCOP(totalFinal)}</strong>
    </div>
  ` : `
    <div class="total-box">
      <span>TOTAL A PAGAR</span>
      <strong>${formatCOP(totalFinal)}</strong>
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
        @page {
          size: 80mm auto;
          margin: 2mm 3mm;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html {
          width: 74mm;
        }
        body {
          width: 74mm;
          height: fit-content;
          font-family: 'Courier New', Courier, monospace;
          color: #000000;
          font-size: 11px;
          line-height: 1.35;
        }
        .ticket {
          width: 100%;
          padding: 1mm 0;
        }

        .header { text-align: center; margin-bottom: 6px; }
        .header h1 { font-size: 13px; font-weight: 700; color: #000; letter-spacing: 0.5px; }
        .header p { font-size: 9px; color: #000; margin-top: 2px; }

        .sep { border: none; border-top: 1px dashed #000; margin: 5px 0; }
        .sep-double { border: none; border-top: 2px solid #000; margin: 5px 0; }

        .compra-info { text-align: center; margin-bottom: 5px; }
        .compra-info .num { font-size: 13px; font-weight: 700; color: #000; }
        .compra-info .fecha { font-size: 9px; color: #000; margin-top: 1px; }

        .caficultor { margin-bottom: 5px; }
        .caficultor label {
          display: block; font-size: 8px; color: #000;
          text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700;
        }
        .caficultor p { font-size: 11px; font-weight: 700; margin-top: 1px; word-wrap: break-word; color: #000; }

        .detalle-titulo {
          font-size: 8px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.05em;
          margin-bottom: 4px; color: #000;
        }

        .linea { margin-bottom: 6px; }
        .linea-tipo { font-size: 11px; font-weight: 700; color: #000; }
        .linea-sub { font-size: 9.5px; color: #000; }
        .linea-precio {
          display: flex; justify-content: space-between;
          font-size: 10px; margin-top: 1px; color: #000;
        }
        .linea-subtotal { font-weight: 700; }
        .linea-deposito { font-size: 9px; font-weight: 700; color: #000; margin-top: 1px; }

        .totales-desglose { margin: 5px 0 2px; }
        .fila-total {
          display: flex; justify-content: space-between;
          font-size: 10px; margin-bottom: 2px; color: #000;
        }
        .fila-abono { font-weight: 600; }
        .letra-detalle { font-size: 8.5px; color: #000; margin-bottom: 3px; line-height: 1.4; }

        .total-box { text-align: center; margin: 6px 0 4px; }
        .total-box span {
          font-size: 9px; display: block; color: #000;
          text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700;
        }
        .total-box strong {
          font-size: 18px; font-weight: 700; color: #000;
          display: block; margin-top: 2px;
        }

        .nota { font-size: 9px; color: #000; margin-bottom: 5px; word-wrap: break-word; }

        .footer { text-align: center; font-size: 8px; color: #000; margin-top: 8px; }

        @media print {
          html, body { width: 80mm; }
        }
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
          Generado el ${new Date().toLocaleDateString('es-CO')}
        </div>

      </div>
      <script>window.onload = () => window.print()</script>
    </body>
    </html>
  `)
  ventana.document.close()
}

  return (
    <div style={{ padding: '32px 24px', textAlign: 'center' }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        background: '#16a34a', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 16px',
        boxShadow: '0 4px 16px rgba(22,163,74,0.3)',
      }}>
        <IconCheck />
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>
        ¡Compra registrada!
      </h2>
      <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 4px' }}>
        Compra <strong>#{compra.id}</strong> — {compra.caficultor_nombre}
      </p>

      {/* ── Monto final: si hubo abono, se ve el desglose chiquito arriba
           del total grande, incluyendo a qué letra se abonó y cuánto
           saldo le queda ── */}
      {hayAbono && (
        <>
          <p style={{ fontSize: 12, color: '#92400e', margin: '0 0 2px' }}>
            {formatCOP(subtotalCafe)} − {formatCOP(valorAbono)} abono a letra{letraInfo ? ` #${letraInfo.id}` : ''}
          </p>
          {letraInfo && (
            <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 8px' }}>
              Letra del {fechaLetraFmt} — saldo restante: {formatCOP(saldoRestanteLetra)}
            </p>
          )}
        </>
      )}
      <p style={{ fontSize: 18, fontWeight: 700, color: '#16a34a', margin: '0 0 28px' }}>
        {formatCOP(totalFinal)}
      </p>

      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <button
          onClick={handleWhatsApp}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 8, padding: '11px', borderRadius: 8, border: 'none',
            background: '#25D366', color: 'white',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#1ebe5d'}
          onMouseLeave={e => e.currentTarget.style.background = '#25D366'}
        >
          <IconWhatsApp /> Enviar por WhatsApp
        </button>
        <button
          onClick={handleImprimir}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 8, padding: '11px', borderRadius: 8,
            border: '1px solid #e2e8f0', background: 'white',
            color: '#0f172a', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
          onMouseLeave={e => e.currentTarget.style.background = 'white'}
        >
          <IconPrint /> Imprimir
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={onNuevaCompra}
          style={{
            flex: 1, padding: '9px', borderRadius: 8,
            border: '1px solid #bbf7d0', background: '#f0fdf4',
            color: '#16a34a', fontSize: 13, fontWeight: 500, cursor: 'pointer',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#dcfce7'}
          onMouseLeave={e => e.currentTarget.style.background = '#f0fdf4'}
        >
          Nueva compra
        </button>
        <button
          onClick={onClose}
          style={{
            flex: 1, padding: '9px', borderRadius: 8,
            border: '1px solid #e2e8f0', background: 'white',
            color: '#475569', fontSize: 13, fontWeight: 500, cursor: 'pointer',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
          onMouseLeave={e => e.currentTarget.style.background = 'white'}
        >
          Cerrar
        </button>
      </div>
    </div>
  )
}

// ── Notificación flotante de letras pendientes ──
function NotificacionLetras({ letras, letraElegida, valorAbono, onElegirLetra, onCambiarValor }) {
  if (!letras || letras.length === 0) return null

  return (
    <div style={{
      border: '1px solid #fde68a', background: '#fffbeb',
      borderRadius: '8px', padding: '14px 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <div style={{ color: '#ca8a04', flexShrink: 0, marginTop: '1px' }}>
          <IconAlert />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#92400e' }}>
            Este caficultor tiene {letras.length} letra{letras.length > 1 ? 's' : ''} pendiente{letras.length > 1 ? 's' : ''}
          </p>
          <p style={{ margin: '2px 0 10px', fontSize: '12px', color: '#a16207' }}>
            Puedes abonar a una de ellas con esta compra. El abono se descuenta del total a pagar.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {letras.map(letra => (
              <label key={letra.id} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 10px', borderRadius: '6px', cursor: 'pointer',
                background: letraElegida === letra.id ? '#fef3c7' : 'white',
                border: `1px solid ${letraElegida === letra.id ? '#fbbf24' : '#fde68a'}`,
              }}>
                <input
                  type="radio"
                  name="letra"
                  checked={letraElegida === letra.id}
                  onChange={() => onElegirLetra(letra.id, letra.saldo)}
                  style={{ accentColor: '#ca8a04' }}
                />
                <span style={{ fontSize: '12px', color: '#78350f', flex: 1 }}>
                  Saldo pendiente: <strong>{formatCOP(letra.saldo)}</strong>
                  {' '}({new Date(letra.fecha_creacion).toLocaleDateString('es-CO')})
                </span>
              </label>
            ))}
          </div>

          {letraElegida && (
            <div style={{ marginTop: '10px' }}>
              <label style={{ ...labelStyle, fontSize: '11px', color: '#92400e' }}>
                Valor a abonar a la letra
              </label>
              <input
                type="number"
                value={valorAbono}
                onChange={e => onCambiarValor(e.target.value)}
                placeholder="0"
                min="0"
                style={{ ...inputStyle, fontSize: '12px', padding: '6px 10px', borderColor: '#fde68a' }}
                onFocus={e => e.target.style.borderColor = '#ca8a04'}
                onBlur={e => e.target.style.borderColor = '#fde68a'}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CompraModal({ onClose, onSaved }) {
  const { usuario } = useAuth()
  const esAdministrador = usuario?.rol === 'administrador'
  const bodegaUsuario = usuario?.bodega_id
  const bodegaUsuarioNombre = usuario?.bodega_nombre

  const [form, setForm]         = useState({ caficultor: '', fecha: hoy, nota: '' })
  const [detalles, setDetalles] = useState([crearDetalleVacio(esAdministrador ? bodegaUsuario : '')])
  const [compraCreadada,        setCompraCreadada] = useState(null)

  const [desgloseGuardado, setDesgloseGuardado] = useState({ subtotalCafe: 0, valorAbono: 0, letraInfo: null })

  const [busqueda, setBusqueda]                             = useState('')
  const [resultados, setResultados]                         = useState([])
  const [dropdownVisible, setDropdownVisible]               = useState(false)
  const [caficultorSeleccionado, setCaficultorSeleccionado] = useState(null)
  const [buscando, setBuscando]                             = useState(false)
  const dropdownRef = useRef(null)

  const [tiposCafe, setTiposCafe]   = useState([])
  const [bodegas, setBodegas]       = useState([])
  const [preciosHoy, setPreciosHoy] = useState([])
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState(null)

  const [letrasPendientes, setLetrasPendientes] = useState([])
  const [letraElegida, setLetraElegida]         = useState(null)
  const [valorAbono, setValorAbono]             = useState('')

  useEffect(() => {
    getTiposCafe().then(res => setTiposCafe(res.data))
    getBodegas().then(res => setBodegas(res.data))
    getPreciosHoy().then(res => setPreciosHoy(res.data))
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownVisible(false)
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
      getTerceros({ buscar: busqueda, tipo: 'caficultor' })
        .then(res => { setResultados(res.data); setDropdownVisible(true) })
        .finally(() => setBuscando(false))
    }, 300)
    return () => clearTimeout(timer)
  }, [busqueda])

  // ── FIX: sincroniza la bodega del administrador en todas las líneas
  // existentes en caso de que `usuario.bodega` no estuviera disponible
  // todavía en el primer render (ej. mientras AuthContext aún cargaba). ──
  useEffect(() => {
    if (esAdministrador && bodegaUsuario) {
      setDetalles(prev => prev.map(d => ({ ...d, bodega: bodegaUsuario })))
    }
  }, [bodegaUsuario, esAdministrador])

  const seleccionarCaficultor = (tercero) => {
    setCaficultorSeleccionado(tercero)
    setForm(prev => ({ ...prev, caficultor: tercero.id }))
    setBusqueda(tercero.nombre)
    setDropdownVisible(false)

    setLetraElegida(null)
    setValorAbono('')
    getLetrasPendientesCaficultor(tercero.id)
      .then(data => setLetrasPendientes(data))
      .catch(() => setLetrasPendientes([]))
  }

  const limpiarCaficultor = () => {
    setCaficultorSeleccionado(null)
    setForm(prev => ({ ...prev, caficultor: '' }))
    setBusqueda('')
    setResultados([])
    setLetrasPendientes([])
    setLetraElegida(null)
    setValorAbono('')
  }

  const elegirLetra = (letraId, saldo) => {
    setLetraElegida(letraId)
    setValorAbono(String(saldo))
  }

  const handleDetalleChange = (index, e) => {
    const { name, value, type, checked } = e.target
    const nuevos = [...detalles]
    nuevos[index] = { ...nuevos[index], [name]: type === 'checkbox' ? checked : value }
    if (name === 'tipo_cafe') {
      const precioHoy = preciosHoy.find(p => String(p.tipo_cafe) === String(value))
      if (precioHoy) nuevos[index].precio_kilo = precioHoy.precio
    }
    if (name === 'es_deposito' && checked) nuevos[index].precio_kilo = ''
    setDetalles(nuevos)
  }

  const agregarDetalle = () => setDetalles([
    ...detalles,
    crearDetalleVacio(esAdministrador ? bodegaUsuario : '')
  ])
  const eliminarDetalle = (index) => {
    if (detalles.length === 1) return
    setDetalles(detalles.filter((_, i) => i !== index))
  }


  const subtotalCafe = detalles.reduce((acc, d) => {
    if (d.es_deposito) return acc
    return acc + (Number(d.kilos) * Number(d.precio_kilo) || 0)
  }, 0)

  const valorAbonoNum = letraElegida ? (Number(valorAbono) || 0) : 0
  const totalAPagar = Math.max(subtotalCafe - valorAbonoNum, 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.caficultor) { setError('Debes seleccionar un caficultor.'); return }
    for (const d of detalles) {
      if (!d.es_deposito && !d.precio_kilo) {
        setError('Las compras normales requieren precio por kilo.')
        return
      }
      // ── FIX adicional: valida también que la bodega esté presente
      // antes de enviar, así nunca llega null al backend ──
      if (!d.bodega) {
        setError('Falta seleccionar la bodega en alguna línea de la compra.')
        return
      }
    }
    if (letraElegida) {
      const letra = letrasPendientes.find(l => l.id === letraElegida)
      if (!valorAbono || Number(valorAbono) <= 0) {
        setError('Ingresa el valor a abonar a la letra seleccionada.')
        return
      }
      if (Number(valorAbono) > Number(letra.saldo)) {
        setError(`El abono no puede superar el saldo de la letra (${formatCOP(letra.saldo)}).`)
        return
      }
  
      if (Number(valorAbono) > subtotalCafe) {
        setError(`El abono no puede superar el valor de la compra (${formatCOP(subtotalCafe)}).`)
        return
      }
    }

    setLoading(true)
    setError(null)
    try {
      const payload = { ...form, detalles }
      if (letraElegida) {
        payload.abono_letra = { letra_id: letraElegida, valor: Number(valorAbono) }
      }
      const res = await createCompra(payload)
      onSaved()
      // ── NUEVO: congela el desglose vigente en este momento exacto,
      // para que PantallaExito siempre muestre el desglose correcto
      // de ESTA compra, sin importar qué pase con el formulario después.
      // Incluye la letra completa (no solo su id) para poder mostrar su
      // fecha de creación y calcular el saldo restante en los comprobantes. ──
      const letraInfoGuardada = letraElegida
        ? letrasPendientes.find(l => l.id === letraElegida) || null
        : null
      setDesgloseGuardado({ subtotalCafe, valorAbono: valorAbonoNum, letraInfo: letraInfoGuardada })
      setCompraCreadada(res.data)
    } catch (err) {
      setError(err?.response?.data?.abono_letra?.[0] || 'Error al guardar la compra. Verifica los datos.')
    } finally {
      setLoading(false)
    }
  }

  const handleNuevaCompra = () => {
    setCompraCreadada(null)
    setForm({ caficultor: '', fecha: hoy, nota: '' })
    setDetalles([crearDetalleVacio(esAdministrador ? bodegaUsuario : '')])
    setBusqueda('')
    setCaficultorSeleccionado(null)
    setError(null)
    setLetrasPendientes([])
    setLetraElegida(null)
    setValorAbono('')
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
        width: '100%', maxWidth: compraCreadada ? '420px' : '720px',
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        transition: 'max-width 0.2s',
      }}>

        {compraCreadada ? (
          <PantallaExito
            compra={compraCreadada}
            telefonoWhatsapp={caficultorSeleccionado?.telefono_whatsapp}
            subtotalCafe={desgloseGuardado.subtotalCafe}
            valorAbono={desgloseGuardado.valorAbono}
            letraInfo={desgloseGuardado.letraInfo}
            onClose={onClose}
            onNuevaCompra={handleNuevaCompra}
          />
        ) : (
          <>
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

            <form onSubmit={handleSubmit}>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {error && (
                  <div style={{
                    background: '#fef2f2', border: '1px solid #fecaca',
                    borderRadius: '6px', padding: '10px 12px',
                    color: '#dc2626', fontSize: '12px',
                  }}>
                    {error}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

                  <div ref={dropdownRef} style={{ position: 'relative' }}>
                    <label style={labelStyle}>Caficultor *</label>
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
                          if (caficultorSeleccionado) limpiarCaficultor()
                        }}
                        placeholder="Buscar por nombre o cédula..."
                        style={{ ...inputStyle, paddingLeft: '32px', paddingRight: caficultorSeleccionado ? '32px' : '12px' }}
                        onFocus={focusGreen} onBlur={blurGray}
                        autoComplete="off"
                      />
                      {caficultorSeleccionado && (
                        <button
                          type="button" onClick={limpiarCaficultor}
                          style={{
                            position: 'absolute', right: '8px', top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: '#94a3b8', display: 'flex', alignItems: 'center', padding: '2px',
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
                          <div style={{ padding: '10px 12px', color: '#94a3b8', fontSize: '12px' }}>Buscando...</div>
                        ) : resultados.length === 0 ? (
                          <div style={{ padding: '10px 12px', color: '#94a3b8', fontSize: '12px' }}>No se encontraron caficultores.</div>
                        ) : resultados.map(r => (
                          <div
                            key={r.id} onClick={() => seleccionarCaficultor(r)}
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
                              <span style={{ color: '#94a3b8', fontSize: '12px', marginLeft: '8px' }}>{r.cedula}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <input
                      type="text" required value={form.caficultor} onChange={() => {}}
                      style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
                      tabIndex={-1}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Fecha *</label>
                    <input
                      type="date" value={form.fecha}
                      onChange={e => setForm({ ...form, fecha: e.target.value })}
                      required style={inputStyle}
                      onFocus={focusGreen} onBlur={blurGray}
                    />
                  </div>
                </div>

                <NotificacionLetras
                  letras={letrasPendientes}
                  letraElegida={letraElegida}
                  valorAbono={valorAbono}
                  onElegirLetra={elegirLetra}
                  onCambiarValor={setValorAbono}
                />

                <div>
                  <label style={labelStyle}>Nota</label>
                  <textarea
                    value={form.nota}
                    onChange={e => setForm({ ...form, nota: e.target.value })}
                    rows={2} placeholder="Observación opcional"
                    style={{ ...inputStyle, resize: 'vertical', minHeight: '60px' }}
                    onFocus={focusGreen} onBlur={blurGray}
                  />
                </div>

                <div>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginBottom: '12px',
                  }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                      Detalles de la compra
                    </p>
                    <button
                      type="button" onClick={agregarDetalle}
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
                        borderRadius: '8px', padding: '14px',
                        background: detalle.es_deposito ? '#fffbeb' : '#f8fafc',
                      }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
                          <div>
                            <label style={{ ...labelStyle, fontSize: '11px' }}>Tipo de café *</label>
                            <select name="tipo_cafe" value={detalle.tipo_cafe}
                              onChange={e => handleDetalleChange(index, e)} required
                              style={{ ...inputStyle, fontSize: '12px', padding: '6px 10px' }}
                              onFocus={focusGreen} onBlur={blurGray}
                            >
                              <option value="">Selecciona</option>
                              {tiposCafe.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                            </select>
                          </div>

                          {/* Bodega — automática y deshabilitada para administrador */}
                          <div>
                            <label style={{ ...labelStyle, fontSize: '11px' }}>Bodega *</label>
                            {esAdministrador ? (
                              <div style={{
                                ...inputDisabledStyle, fontSize: '12px', padding: '6px 10px',
                                display: 'flex', alignItems: 'center',
                              }}>
                                {bodegaUsuarioNombre || 'Sin bodega asignada'}
                              </div>
                            ) : (
                              <select name="bodega" value={detalle.bodega}
                                onChange={e => handleDetalleChange(index, e)} required
                                style={{ ...inputStyle, fontSize: '12px', padding: '6px 10px' }}
                                onFocus={focusGreen} onBlur={blurGray}
                              >
                                <option value="">Selecciona</option>
                                {bodegas.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                              </select>
                            )}
                          </div>

                          <div>
                            <label style={{ ...labelStyle, fontSize: '11px' }}>Kilos *</label>
                            <input type="number" name="kilos" value={detalle.kilos}
                              onChange={e => handleDetalleChange(index, e)}
                              required min="0" step="0.01" placeholder="0.00"
                              style={{ ...inputStyle, fontSize: '12px', padding: '6px 10px' }}
                              onFocus={focusGreen} onBlur={blurGray}
                            />
                          </div>
                          <div>
                            <label style={{ ...labelStyle, fontSize: '11px' }}>
                              Precio/kg {detalle.es_deposito ? '(depósito)' : '*'}
                            </label>
                            <input type="number" name="precio_kilo" value={detalle.precio_kilo}
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

                        <div style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          marginTop: '10px',
                        }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <div style={{ position: 'relative', width: '36px', height: '20px' }}>
                              <input type="checkbox" name="es_deposito" checked={detalle.es_deposito}
                                onChange={e => handleDetalleChange(index, e)}
                                style={{ opacity: 0, width: 0, height: 0 }}
                              />
                              <span style={{
                                position: 'absolute', inset: 0, borderRadius: '99px',
                                background: detalle.es_deposito ? '#ca8a04' : '#e2e8f0',
                                transition: 'background 0.2s', cursor: 'pointer',
                              }}>
                                <span style={{
                                  position: 'absolute', width: '14px', height: '14px',
                                  borderRadius: '50%', background: 'white', top: '3px',
                                  left: detalle.es_deposito ? '19px' : '3px',
                                  transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                }} />
                              </span>
                            </div>
                            <span style={{ fontSize: '12px', color: '#475569' }}>
                              Es depósito
                              <span style={{ color: '#94a3b8', marginLeft: '4px' }}>(liquidar después)</span>
                            </span>
                          </label>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                            {detalles.length > 1 && (
                              <button type="button" onClick={() => eliminarDetalle(index)}
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

          
                <div style={{
                  background: '#f0fdf4', border: '1px solid #bbf7d0',
                  borderRadius: '8px', padding: '14px 16px',
                  display: 'flex', flexDirection: 'column', gap: '8px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#475569' }}>
                      Subtotal café:
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                      {formatCOP(subtotalCafe)}
                    </span>
                  </div>

                  {letraElegida && valorAbonoNum > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#92400e' }}>
                        − Abono a letra:
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#ca8a04' }}>
                        {formatCOP(valorAbonoNum)}
                      </span>
                    </div>
                  )}

                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    paddingTop: '8px', borderTop: '1px solid #bbf7d0',
                  }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                      Total a pagar hoy:
                    </span>
                    <span style={{ fontSize: '20px', fontWeight: 700, color: '#16a34a' }}>
                      {formatCOP(totalAPagar)}
                    </span>
                  </div>
                </div>

              </div>

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
                <button type="submit" disabled={loading}
                  style={{
                    flex: 1, padding: '9px', border: 'none', borderRadius: '6px',
                    background: loading ? '#86efac' : '#16a34a', color: 'white',
                    fontSize: '13px', fontWeight: 500,
                    cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#15803d' }}
                  onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#16a34a' }}
                >
                  {loading ? 'Guardando...' : 'Registrar compra'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}