import { useEffect, useState } from 'react'
import { getCompras, deleteCompra } from '../../api/compras'
import { getBodegas, getTiposCafe } from '../../api/inventario'
import { useAuth } from '../../context/AuthContext'
import CompraModal from '../../components/compras/CompraModal'
import LiquidacionModal from '../../components/compras/LiquidacionModal'
import CompraDetalle from '../../components/compras/CompraDetalle'
import AbonoModal from '../../components/cuentasPagar/AbonoModal'
import EstadoError from '../../components/common/EstadoError' // NUEVO

// ─── Iconos SVG inline ────────────────────────────────────────────────────────
const IconPlus = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)
const IconEye = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
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
const IconDeuda = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
  </svg>
)
const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)
const IconSortAsc = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
  </svg>
)
const IconSortDesc = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
  </svg>
)
const IconChevronLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)
const IconChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
)

// ─── Badge depósito ───────────────────────────────────────────────────────────
function BadgeDeposito({ tiene, kilos }) {
  if (tiene) {
    return (
      <span style={{
        background: '#fefce8', color: '#ca8a04',
        fontSize: '11px', fontWeight: 600,
        padding: '2px 8px', borderRadius: '99px',
        whiteSpace: 'nowrap',
      }}>
        {Number(kilos).toLocaleString('es-CO')} kg pendientes
      </span>
    )
  }
  return (
    <span style={{
      background: '#f0fdf4', color: '#16a34a',
      fontSize: '11px', fontWeight: 600,
      padding: '2px 8px', borderRadius: '99px',
    }}>
      Al día
    </span>
  )
}

// ─── Badge deuda ──────────────────────────────────────────────────────────────
function BadgeDeuda({ cuenta }) {
  if (!cuenta) return null

  const estilos = {
    pendiente: { bg: '#fef2f2', color: '#dc2626', label: 'Con deuda' },
    parcial:   { bg: '#fef2f2', color: '#dc2626', label: 'Con deuda' },
    pagado:    { bg: '#f0fdf4', color: '#16a34a', label: 'Pagado'    },
  }

  const s = estilos[cuenta.estado] || { bg: '#f1f5f9', color: '#475569', label: cuenta.estado }

  return (
    <span style={{
      background: s.bg, color: s.color,
      fontSize: '11px', fontWeight: 600,
      padding: '2px 8px', borderRadius: '99px',
      whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  )
}

// ── ÍTEM 17: traduce el nombre de campo que usa la UI (mismo de antes,
// para no tener que tocar el <select> de "Ordenar por") al nombre real
// que entiende el backend vía ?ordering=. 'total' → 'total_anotado'
// porque Compra.total es una @property, no una columna SQL -- el
// backend expone una anotación aparte para poder ordenar por ella
// (ver CompraViewSet.ordering_fields en views.py). ──
const CAMPO_ORDEN_BACKEND = {
  id: 'id',
  fecha: 'fecha',
  caficultor: 'caficultor__nombre',
  total: 'total_anotado',
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function ComprasPage() {
  const { usuario } = useAuth()
  const esJefe = usuario?.rol === 'jefe'

  const [compras, setCompras]                         = useState([])
  const [totalCompras, setTotalCompras]               = useState(0)   // ← NUEVO (ítem 17)
  const [loading, setLoading]                         = useState(true)
  const [errorCarga, setErrorCarga]                   = useState(false) // NUEVO
  const [modalOpen, setModalOpen]                     = useState(false)
  const [liquidacionOpen, setLiquidacionOpen]         = useState(false)
  const [detalleOpen, setDetalleOpen]                 = useState(false)
  const [compraSeleccionada, setCompraSeleccionada]   = useState(null)
  const [detalleSeleccionado, setDetalleSeleccionado] = useState(null)
  const [abonoOpen, setAbonoOpen]                     = useState(false)
  const [cuentaSeleccionada, setCuentaSeleccionada]   = useState(null)

  // ── Búsqueda y ordenamiento ──
  const [busqueda, setBusqueda]               = useState('')
  const [busquedaDebounced, setBusquedaDebounced] = useState('')  // ← NUEVO
  const [ordenCampo, setOrdenCampo]           = useState('id')
  const [ordenDir, setOrdenDir]               = useState('desc')

  // ── NUEVO (ítem 17): filtros combinables de bodega y tipo de café ──
  const [bodegas, setBodegas]           = useState([])
  const [tiposCafe, setTiposCafe]       = useState([])
  const [filtroBodega, setFiltroBodega] = useState('')
  const [filtroTipoCafe, setFiltroTipoCafe] = useState('')

  // ── NUEVO (ítem 17): filtro por rango de fechas — el backend ya lo
  // soportaba desde el principio (CompraFilter.fecha_desde/fecha_hasta),
  // solo faltaban los controles visuales ──
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('')
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('')

  useEffect(() => {
    // Solo el jefe puede filtrar por bodega (un administrador ya está
    // limitado a la suya, así que el select no le aporta nada — igual
    // que la columna "Bodega" de la tabla, que también es esJefe-only)
    if (esJefe) getBodegas().then(res => setBodegas(res.data.results ?? res.data))
    getTiposCafe().then(res => setTiposCafe(res.data.results ?? res.data))
  }, [])

  // ── ÍTEM 17: paginación ──
  const [pagina, setPagina]   = useState(1)
  const PAGE_SIZE = 10  // debe coincidir con settings.REST_FRAMEWORK['PAGE_SIZE']
  const totalPaginas = Math.max(1, Math.ceil(totalCompras / PAGE_SIZE))

  // ── Debounce de la búsqueda (mismo patrón de 300ms que ya usa
  // CompraModal.jsx para buscar caficultor) — evita pegarle al backend
  // en cada tecla que escribe el usuario ──
  useEffect(() => {
    const timer = setTimeout(() => {
      setBusquedaDebounced(busqueda)
      setPagina(1)  // toda búsqueda nueva vuelve a la página 1
    }, 300)
    return () => clearTimeout(timer)
  }, [busqueda])

  // ── ÍTEM 17: cuando cambia búsqueda, orden o página, se vuelve a
  // pedir al backend -- ya NO se filtra/ordena en memoria sobre una
  // lista completa, porque ahora el backend solo entrega 10 a la vez ──
  const cargarCompras = () => {
    setLoading(true)
    const params = {
      page: pagina,
      ordering: ordenDir === 'desc'
        ? `-${CAMPO_ORDEN_BACKEND[ordenCampo]}`
        : CAMPO_ORDEN_BACKEND[ordenCampo],
    }
    if (busquedaDebounced.trim()) params.buscar = busquedaDebounced.trim()
    if (filtroBodega) params.bodega = filtroBodega
    if (filtroTipoCafe) params.tipo_cafe = filtroTipoCafe
    if (filtroFechaDesde) params.fecha_desde = filtroFechaDesde
    if (filtroFechaHasta) params.fecha_hasta = filtroFechaHasta

    getCompras(params)
      .then(res => {
        setCompras(res.data.results)
        setTotalCompras(res.data.count)
        setErrorCarga(false) // NUEVO: limpia el error si un reintento funciona
      })
      .catch(() => {
        // NUEVO: antes, si esto fallaba, la tabla quedaba vacía en silencio
        // como si de verdad no hubiera compras registradas. Ahora se avisa.
        setErrorCarga(true)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    cargarCompras()
  }, [pagina, busquedaDebounced, ordenCampo, ordenDir, filtroBodega, filtroTipoCafe, filtroFechaDesde, filtroFechaHasta])

  const handleVerDetalle = (compra) => {
    setCompraSeleccionada(compra)
    setDetalleOpen(true)
  }

  const handleLiquidar = (detalle) => {
    setDetalleSeleccionado(detalle)
    setLiquidacionOpen(true)
  }

  const handleEliminar = async (id) => {
    if (!confirm('¿Eliminar esta compra? También se eliminarán sus movimientos de inventario.')) return
    try {
      await deleteCompra(id)
      // ── Si eliminamos el último registro de la página actual y no
      // somos la página 1, retrocedemos una página para no quedar
      // viendo una página vacía ──
      if (compras.length === 1 && pagina > 1) {
        setPagina(p => p - 1)
      } else {
        cargarCompras()
      }
    } catch {
      alert('No se pudo eliminar.')
    }
  }

  const handleVerDeuda = (cuenta) => {
    setCuentaSeleccionada(cuenta)
    setAbonoOpen(true)
  }

  const formatCOP = (val) => `$${Number(val || 0).toLocaleString('es-CO')}`

  // Columnas del thead según rol
  const columnas = ['#', 'Fecha', 'Caficultor', 'Total', 'Depósito', 'Deuda', ...(esJefe ? ['Bodega'] : []), 'Acciones']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── Encabezado ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
            Compras
          </h1>
          <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>
            Registro de compras de café y gestión de depósitos
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: '#16a34a', color: 'white',
            border: 'none', borderRadius: '6px',
            padding: '8px 14px', fontSize: '13px', fontWeight: 500,
            cursor: 'pointer',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#15803d'}
          onMouseLeave={e => e.currentTarget.style.background = '#16a34a'}
        >
          <IconPlus /> Nueva compra
        </button>
      </div>

      {/* ── Búsqueda y ordenamiento ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>

        {/* Búsqueda */}
        <div style={{ position: 'relative', flex: '1', minWidth: '200px', maxWidth: '320px' }}>
          <span style={{
            position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
            color: '#94a3b8', pointerEvents: 'none', display: 'flex', alignItems: 'center',
          }}>
            <IconSearch />
          </span>
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por caficultor..."
            style={{
              width: '100%', boxSizing: 'border-box',
              paddingLeft: '34px', paddingRight: '12px',
              paddingTop: '8px', paddingBottom: '8px',
              border: '1px solid #e2e8f0', borderRadius: '6px',
              fontSize: '13px', color: '#0f172a',
              outline: 'none', background: 'white',
            }}
            onFocus={e => e.target.style.borderColor = '#16a34a'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          />
        </div>

        {/* ── NUEVO (ítem 17): filtro por bodega — solo jefe ── */}
        {esJefe && bodegas.length > 0 && (
          <select
            value={filtroBodega}
            onChange={e => { setFiltroBodega(e.target.value); setPagina(1) }}
            style={{
              border: '1px solid #e2e8f0', borderRadius: '6px',
              padding: '6px 10px', fontSize: '12px', color: '#0f172a',
              background: 'white', outline: 'none', cursor: 'pointer',
            }}
            onFocus={e => e.target.style.borderColor = '#16a34a'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          >
            <option value="">Todas las bodegas</option>
            {bodegas.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
          </select>
        )}

        {/* ── NUEVO (ítem 17): filtro por tipo de café ── */}
        {tiposCafe.length > 0 && (
          <select
            value={filtroTipoCafe}
            onChange={e => { setFiltroTipoCafe(e.target.value); setPagina(1) }}
            style={{
              border: '1px solid #e2e8f0', borderRadius: '6px',
              padding: '6px 10px', fontSize: '12px', color: '#0f172a',
              background: 'white', outline: 'none', cursor: 'pointer',
            }}
            onFocus={e => e.target.style.borderColor = '#16a34a'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          >
            <option value="">Todos los tipos de café</option>
            {tiposCafe.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </select>
        )}

        {/* ── NUEVO (ítem 17): filtro por rango de fechas ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <input
            type="date"
            value={filtroFechaDesde}
            onChange={e => { setFiltroFechaDesde(e.target.value); setPagina(1) }}
            title="Fecha desde"
            style={{
              border: '1px solid #e2e8f0', borderRadius: '6px',
              padding: '6px 8px', fontSize: '12px', color: '#0f172a',
              background: 'white', outline: 'none',
            }}
            onFocus={e => e.target.style.borderColor = '#16a34a'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          />
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>—</span>
          <input
            type="date"
            value={filtroFechaHasta}
            onChange={e => { setFiltroFechaHasta(e.target.value); setPagina(1) }}
            title="Fecha hasta"
            min={filtroFechaDesde || undefined}
            style={{
              border: '1px solid #e2e8f0', borderRadius: '6px',
              padding: '6px 8px', fontSize: '12px', color: '#0f172a',
              background: 'white', outline: 'none',
            }}
            onFocus={e => e.target.style.borderColor = '#16a34a'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          />
        </div>

        {/* Ordenamiento */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>Ordenar por</span>
          <select
            value={ordenCampo}
            onChange={e => { setOrdenCampo(e.target.value); setPagina(1) }}
            style={{
              border: '1px solid #e2e8f0', borderRadius: '6px',
              padding: '6px 10px', fontSize: '12px', color: '#0f172a',
              background: 'white', outline: 'none', cursor: 'pointer',
            }}
            onFocus={e => e.target.style.borderColor = '#16a34a'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          >
            <option value="id">ID</option>
            <option value="fecha">Fecha</option>
            <option value="caficultor">Caficultor</option>
            <option value="total">Total</option>
          </select>
          <button
            onClick={() => { setOrdenDir(d => d === 'asc' ? 'desc' : 'asc'); setPagina(1) }}
            title={ordenDir === 'asc' ? 'Ascendente' : 'Descendente'}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '32px', height: '32px', borderRadius: '6px',
              border: '1px solid #e2e8f0', background: 'white',
              color: '#475569', cursor: 'pointer',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
            onMouseLeave={e => e.currentTarget.style.background = 'white'}
          >
            {ordenDir === 'asc' ? <IconSortAsc /> : <IconSortDesc />}
          </button>
        </div>

        {/* ── NUEVO (ítem 17): limpiar filtros, mismo patrón visual que
             ya usa GastosPage.jsx ── */}
        {(busqueda || filtroBodega || filtroTipoCafe || filtroFechaDesde || filtroFechaHasta) && (
          <button
            onClick={() => {
              setBusqueda('')
              setFiltroBodega('')
              setFiltroTipoCafe('')
              setFiltroFechaDesde('')
              setFiltroFechaHasta('')
              setPagina(1)
            }}
            style={{
              padding: '6px 12px', fontSize: '12px', borderRadius: '6px',
              border: '1px solid #e2e8f0', background: 'white',
              color: '#64748b', cursor: 'pointer',
            }}
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* ── Error de carga (NUEVO) ── */}
      {errorCarga && !loading && (
        <EstadoError
          mensaje="No se pudieron cargar las compras. Verifica tu conexión e intenta de nuevo."
          onReintentar={cargarCompras}
        />
      )}

      {/* ── Tabla ── */}
      {loading ? (
        <div style={{ color: '#94a3b8', fontSize: '13px', padding: '20px 0' }}>
          Cargando compras...
        </div>
      ) : errorCarga ? null : (
        <div style={{
          background: 'white', border: '1px solid #e2e8f0',
          borderRadius: '10px', overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#0f172a' }}>
                {columnas.map(col => (
                  <th key={col} style={{
                    padding: '11px 16px', textAlign: 'left',
                    color: '#e2e8f0', fontWeight: 500, fontSize: '12px',
                    whiteSpace: 'nowrap',
                  }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {compras.length === 0 ? (
                <tr>
                  <td colSpan={columnas.length} style={{
                    padding: '40px', textAlign: 'center',
                    color: '#94a3b8', fontSize: '13px',
                  }}>
                    {busqueda ? 'No se encontraron resultados.' : 'No hay compras registradas aún.'}
                  </td>
                </tr>
              ) : (
                compras.map(c => (
                  <tr
                    key={c.id}
                    style={{ borderTop: '1px solid #f1f5f9', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'white'}
                  >
                    <td style={{ padding: '11px 16px', color: '#94a3b8' }}>{c.id}</td>
                    <td style={{ padding: '11px 16px', fontWeight: 500, color: '#0f172a' }}>{c.fecha}</td>
                    <td style={{ padding: '11px 16px', color: '#475569' }}>{c.caficultor_nombre}</td>
                    <td style={{ padding: '11px 16px', fontWeight: 600, color: '#0f172a' }}>
                      {formatCOP(c.total)}
                    </td>
                    <td style={{ padding: '11px 16px' }}>
                      <BadgeDeposito
                        tiene={c.tiene_deposito_pendiente}
                        kilos={c.kilos_deposito_pendiente}
                      />
                    </td>
                    <td style={{ padding: '11px 16px' }}>
                      <BadgeDeuda cuenta={c.cuenta_por_pagar} />
                    </td>

                    {/* Columna bodega — solo jefe */}
                    {esJefe && (
                      <td style={{ padding: '11px 16px', color: '#475569', fontSize: '12px' }}>
                        {(c.bodegas || []).join(', ') || '—'}
                      </td>
                    )}

                    <td style={{ padding: '11px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => handleVerDetalle(c)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '4px',
                            padding: '5px 10px', borderRadius: '5px', border: 'none',
                            background: '#eff6ff', color: '#2563eb',
                            fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#dbeafe'}
                          onMouseLeave={e => e.currentTarget.style.background = '#eff6ff'}
                        >
                          <IconEye /> Ver
                        </button>

                        {c.cuenta_por_pagar && (
                          <button
                            onClick={() => handleVerDeuda(c.cuenta_por_pagar)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '4px',
                              padding: '5px 10px', borderRadius: '5px', border: 'none',
                              background: c.cuenta_por_pagar.estado === 'pagado'
                                ? '#f0fdf4' : '#fef2f2',
                              color: c.cuenta_por_pagar.estado === 'pagado'
                                ? '#16a34a' : '#dc2626',
                              fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background =
                              c.cuenta_por_pagar.estado === 'pagado' ? '#dcfce7' : '#fee2e2'}
                            onMouseLeave={e => e.currentTarget.style.background =
                              c.cuenta_por_pagar.estado === 'pagado' ? '#f0fdf4' : '#fef2f2'}
                          >
                            <IconDeuda /> Ver deuda
                          </button>
                        )}

                        <button
                          onClick={() => handleEliminar(c.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '4px',
                            padding: '5px 10px', borderRadius: '5px', border: 'none',
                            background: '#fef2f2', color: '#dc2626',
                            fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                          onMouseLeave={e => e.currentTarget.style.background = '#fef2f2'}
                        >
                          <IconTrash /> Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* ── ÍTEM 17: pie de tabla con conteo real + controles de
               paginación. totalCompras viene de res.data.count (el
               backend ya sabe cuántas hay en TOTAL, no solo en esta
               página) ── */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 16px', borderTop: '1px solid #f1f5f9',
            flexWrap: 'wrap', gap: '10px',
          }}>
            <span style={{ color: '#94a3b8', fontSize: '12px' }}>
              {busqueda
                ? `${totalCompras} resultado(s) para "${busqueda}"`
                : `${totalCompras} compra(s) registrada(s)`
              }
            </span>

            {totalPaginas > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={() => setPagina(p => Math.max(1, p - 1))}
                  disabled={pagina === 1}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '28px', height: '28px', borderRadius: '6px',
                    border: '1px solid #e2e8f0', background: 'white',
                    color: pagina === 1 ? '#cbd5e1' : '#475569',
                    cursor: pagina === 1 ? 'not-allowed' : 'pointer',
                  }}
                >
                  <IconChevronLeft />
                </button>
                <span style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                  Página {pagina} de {totalPaginas}
                </span>
                <button
                  onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                  disabled={pagina === totalPaginas}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '28px', height: '28px', borderRadius: '6px',
                    border: '1px solid #e2e8f0', background: 'white',
                    color: pagina === totalPaginas ? '#cbd5e1' : '#475569',
                    cursor: pagina === totalPaginas ? 'not-allowed' : 'pointer',
                  }}
                >
                  <IconChevronRight />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modales ── */}
      {modalOpen && (
        <CompraModal onClose={() => setModalOpen(false)} onSaved={cargarCompras} />
      )}
      {detalleOpen && compraSeleccionada && (
        <CompraDetalle
          compra={compraSeleccionada}
          onClose={() => setDetalleOpen(false)}
          onLiquidar={handleLiquidar}
        />
      )}
      {liquidacionOpen && detalleSeleccionado && (
        <LiquidacionModal
          detalle={detalleSeleccionado}
          onClose={() => {
            setLiquidacionOpen(false)
            setDetalleOpen(false)
          }}
          onSaved={cargarCompras}
        />
      )}
      {abonoOpen && cuentaSeleccionada && (
        <AbonoModal
          cuenta={cuentaSeleccionada}
          onClose={() => {
            setAbonoOpen(false)
            setCuentaSeleccionada(null)
          }}
          onSaved={cargarCompras}
        />
      )}
    </div>
  )
}