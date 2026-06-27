import { useState } from 'react'
import { consultarPortalCaficultor } from '../../api/portal'

// ── Paleta propia del portal — intencionalmente distinta al panel
// interno (que usa #0f172a / #16a34a). Cálida, evoca café y cosecha,
// porque este es el único punto del sistema que ve gente externa.
const COLOR = {
  fondo:        '#FAF6F0',
  fondoTarjeta: '#FFFFFF',
  borde:        '#E8DCC8',
  cafeOscuro:   '#3D2817',
  cafeClaro:    '#C9A876',
  terracota:    '#A8551F',
  oliva:        '#6B7F4F',
  ambar:        '#C77B3D',
  textoSuave:   '#8A7560',
}

const fmt = (n) =>
  Number(n || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

const fmtFecha = (f) =>
  new Date(f).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })

// ── Construye una lista unificada de movimientos (compras + abonos +
// letras) ordenada por fecha, para la línea de tiempo de la tarjeta.
// Esto vive aquí (no en el backend) porque es puramente de presentación:
// el backend ya entrega los tres tipos de datos por separado y eso es
// correcto — mezclarlos es una decisión de cómo se ve, no de qué existe.
function construirMovimientos(data) {
  const movimientos = []

  data.compras.forEach(c => {
    movimientos.push({
      tipo: 'compra',
      fecha: c.fecha,
      titulo: `Compra — ${c.detalles.map(d => `${d.kilos} kg ${d.tipo_cafe}`).join(', ')}`,
      valor: c.total,
      signo: '+',
      color: COLOR.oliva,
    })
  })

  data.letras_cambio.forEach(l => {
    movimientos.push({
      tipo: 'letra',
      fecha: l.creado_en,
      titulo: 'Letra de cambio — adelanto',
      valor: l.valor_total,
      signo: '',
      color: COLOR.terracota,
    })
  })

  data.cuentas_por_pagar.forEach(cp => {
    if (cp.valor_pagado > 0) {
      movimientos.push({
        tipo: 'abono',
        fecha: cp.creado_en,
        titulo: 'Abono a vale',
        valor: cp.valor_pagado,
        signo: '',
        color: COLOR.ambar,
      })
    }
  })

  return movimientos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
}

function FormularioCedula({ onBuscar, cargando, error }) {
  const [cedula, setCedula] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!cedula.trim()) return
    onBuscar(cedula.trim())
  }

  return (
    <div style={{
      minHeight: '100vh', background: COLOR.fondo,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <p style={{
            fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase',
            color: COLOR.terracota, margin: '0 0 8px', fontWeight: 600,
          }}>Café San</p>
          <h1 style={{
            fontFamily: 'Georgia, serif', fontSize: 26, fontWeight: 600,
            color: COLOR.cafeOscuro, margin: 0,
          }}>Portal del caficultor</h1>
          <p style={{ fontSize: 14, color: COLOR.textoSuave, margin: '8px 0 0' }}>
            Consulta tus compras, vales y letras de cambio
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{
          background: COLOR.fondoTarjeta, border: `1px solid ${COLOR.borde}`,
          borderRadius: 16, padding: 24,
        }}>
          <label style={{
            display: 'block', fontSize: 13, fontWeight: 600,
            color: COLOR.cafeOscuro, marginBottom: 8,
          }}>
            Número de cédula
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={15}
            value={cedula}
            onChange={e => setCedula(e.target.value.replace(/\D/g, ''))}
            placeholder="Ej: 10452998"
            autoFocus
            style={{
              width: '100%', boxSizing: 'border-box', fontSize: 16,
              padding: '12px 14px', borderRadius: 10,
              border: `1px solid ${COLOR.borde}`, outline: 'none',
              color: COLOR.cafeOscuro, marginBottom: 14,
            }}
          />

          {error && (
            <div style={{
              background: '#FBEAE5', border: '1px solid #E8B8A8',
              borderRadius: 8, padding: '10px 12px', marginBottom: 14,
              color: '#8A3A1F', fontSize: 13,
            }}>{error}</div>
          )}

          <button
            type="submit"
            disabled={cargando || !cedula.trim()}
            style={{
              width: '100%', padding: 13, borderRadius: 10, border: 'none',
              background: cargando ? COLOR.cafeClaro : COLOR.terracota,
              color: COLOR.fondo, fontSize: 15, fontWeight: 600,
              cursor: cargando ? 'not-allowed' : 'pointer',
            }}
          >
            {cargando ? 'Consultando...' : 'Consultar'}
          </button>
        </form>

        <p style={{
          textAlign: 'center', fontSize: 12, color: COLOR.textoSuave,
          marginTop: 20,
        }}>
          ¿Tienes dudas sobre tu información? Comunícate con tu punto de acopio.
        </p>
      </div>
    </div>
  )
}

function TarjetaResultado({ data, onVolver }) {
  const { tercero, resumen } = data
  const movimientos = construirMovimientos(data)
  const saldoTotal = resumen.saldo_vales + resumen.saldo_letras

  return (
    <div style={{ minHeight: '100vh', background: COLOR.fondo, padding: '32px 16px' }}>
      <div style={{
        maxWidth: 420, margin: '0 auto', background: COLOR.fondoTarjeta,
        borderRadius: 16, border: `1px solid ${COLOR.borde}`, overflow: 'hidden',
      }}>

        <div style={{ background: COLOR.cafeOscuro, padding: '28px 24px 24px' }}>
          <p style={{
            fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase',
            color: COLOR.cafeClaro, margin: '0 0 6px',
          }}>Café San — portal caficultor</p>
          <h1 style={{
            fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 600,
            color: COLOR.fondo, margin: 0,
          }}>Hola, {tercero.nombre.split(' ')[0]}</h1>
          <p style={{ fontSize: 13, color: COLOR.cafeClaro, margin: '4px 0 0' }}>
            Cédula {tercero.cedula}
          </p>
        </div>

        <div style={{ padding: '20px 24px' }}>

          <div style={{
            background: COLOR.fondoTarjeta, border: `1px solid ${COLOR.borde}`,
            borderRadius: 12, padding: '18px 20px', marginBottom: 18,
          }}>
            <p style={{ fontSize: 12, color: COLOR.textoSuave, margin: '0 0 4px' }}>
              Saldo pendiente total
            </p>
            <p style={{
              fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 600,
              color: COLOR.terracota, margin: 0,
            }}>{fmt(saldoTotal)}</p>
            <p style={{ fontSize: 12, color: COLOR.textoSuave, margin: '6px 0 0' }}>
              {data.letras_cambio.length} letra(s) · {data.cuentas_por_pagar.length} vale(s)
            </p>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20,
          }}>
            <div style={{ background: '#F3F0E8', borderRadius: 10, padding: '12px 14px' }}>
              <p style={{ fontSize: 11, color: COLOR.textoSuave, margin: '0 0 2px' }}>Total comprado</p>
              <p style={{ fontSize: 16, fontWeight: 600, color: COLOR.cafeOscuro, margin: 0 }}>
                {fmt(resumen.total_comprado)}
              </p>
            </div>
            <div style={{ background: '#F3F0E8', borderRadius: 10, padding: '12px 14px' }}>
              <p style={{ fontSize: 11, color: COLOR.textoSuave, margin: '0 0 2px' }}>Compras totales</p>
              <p style={{ fontSize: 16, fontWeight: 600, color: COLOR.cafeOscuro, margin: 0 }}>
                {resumen.total_compras}
              </p>
            </div>
          </div>

          <p style={{
            fontSize: 13, fontWeight: 600, color: COLOR.cafeOscuro,
            margin: '0 0 10px',
          }}>Movimientos recientes</p>

          {movimientos.length === 0 ? (
            <p style={{
              textAlign: 'center', color: COLOR.textoSuave, fontSize: 13, padding: '24px 0',
            }}>Todavía no tienes movimientos registrados.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {movimientos.slice(0, 8).map((m, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: COLOR.fondoTarjeta, border: `1px solid ${COLOR.borde}`,
                  borderRadius: 10, padding: '12px 14px',
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: m.color, flexShrink: 0,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 13, color: COLOR.cafeOscuro, margin: 0,
                      fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>{m.titulo}</p>
                    <p style={{ fontSize: 11, color: COLOR.textoSuave, margin: '2px 0 0' }}>
                      {fmtFecha(m.fecha)}
                    </p>
                  </div>
                  <p style={{ fontSize: 13, color: m.color, fontWeight: 600, margin: 0, flexShrink: 0 }}>
                    {m.signo}{fmt(m.valor)}
                  </p>
                </div>
              ))}
            </div>
          )}

          <button onClick={onVolver} style={{
            width: '100%', marginTop: 18, background: 'transparent',
            color: COLOR.terracota, border: `1px solid ${COLOR.terracota}`,
            borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 600,
            cursor: 'pointer',
          }}>
            Consultar otra cédula
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PortalCaficultorPage() {
  const [data, setData]       = useState(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError]     = useState(null)

  const handleBuscar = async (cedula) => {
    setCargando(true)
    setError(null)
    try {
      const res = await consultarPortalCaficultor(cedula)
      setData(res.data)
    } catch (e) {
      if (e.response?.status === 404) {
        setError(e.response.data.detail)
      } else if (e.response?.status === 429) {
        setError('Demasiados intentos. Espera un momento y vuelve a intentar.')
      } else {
        setError('No pudimos completar la consulta. Intenta de nuevo en un momento.')
      }
    } finally {
      setCargando(false)
    }
  }

  if (data) {
    return <TarjetaResultado data={data} onVolver={() => setData(null)} />
  }

  return <FormularioCedula onBuscar={handleBuscar} cargando={cargando} error={error} />
}