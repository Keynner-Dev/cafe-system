// ─── Icono SVG inline ─────────────────────────────────────────────────────────
const IconWifiOff = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
    <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
    <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
    <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
    <line x1="12" y1="20" x2="12.01" y2="20" />
  </svg>
)

// ─── EstadoError ──────────────────────────────────────────────────────────────
// Reemplaza el patrón de "tabla vacía en silencio" cuando falla una carga de
// datos. Úsalo dentro de las páginas de listado (Compras, Ventas, Terceros,
// Gastos, Caja, Traslados, Letras, Cuentas por Pagar) en el .catch() de la
// petición principal, en vez de dejar la tabla vacía sin explicación.
//
// Uso:
//   const [errorCarga, setErrorCarga] = useState(false)
//   ...
//   getCompras(params)
//     .then(res => { ...; setErrorCarga(false) })
//     .catch(() => setErrorCarga(true))
//     .finally(() => setLoading(false))
//   ...
//   {errorCarga && <EstadoError onReintentar={cargar} />}
export default function EstadoError({
  mensaje = 'No se pudieron cargar los datos. Verifica tu conexión e intenta de nuevo.',
  onReintentar,
}) {
  return (
    <div style={{
      background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px',
      padding: '20px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <IconWifiOff />
        <p style={{ fontSize: '13px', color: '#dc2626', margin: 0 }}>
          {mensaje}
        </p>
      </div>

      {onReintentar && (
        <button
          onClick={onReintentar}
          style={{
            background: 'white', color: '#dc2626', border: '1px solid #fecaca',
            borderRadius: '6px', padding: '7px 14px',
            fontSize: '12px', fontWeight: 500, cursor: 'pointer', flexShrink: 0,
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
          onMouseLeave={e => e.currentTarget.style.background = 'white'}
        >
          Reintentar
        </button>
      )}
    </div>
  )
}