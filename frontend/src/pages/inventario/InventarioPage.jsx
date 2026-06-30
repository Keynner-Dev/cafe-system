import { useEffect, useState } from 'react'
import {
  getTiposCafe, createTipoCafe, updateTipoCafe, deleteTipoCafe,
  getBodegas, createBodega, updateBodega, deleteBodega,
  getStockDetallado
} from '../../api/inventario'
import ItemModal from '../../components/inventario/ItemModal'
import { useAuth } from '../../context/AuthContext'

// ─── Iconos SVG inline ────────────────────────────────────────────────────────
const IconPlus = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)
const IconEdit = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)
const IconTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
)
const IconFilter = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
)

// ─── Badge de estado ──────────────────────────────────────────────────────────
function BadgeEstado({ activo }) {
  return (
    <span style={{
      background: activo ? '#f0fdf4' : '#fef2f2',
      color: activo ? '#16a34a' : '#dc2626',
      fontSize: '11px', fontWeight: 600,
      padding: '2px 8px', borderRadius: '99px',
    }}>
      {activo ? 'Activo' : 'Inactivo'}
    </span>
  )
}

const camposTipoCafe = [
  { name: 'nombre', label: 'Nombre', required: true, placeholder: 'Ej: Café seco' },
  { name: 'descripcion', label: 'Descripción', type: 'textarea', placeholder: 'Descripción opcional' },
]

const camposBodega = [
  { name: 'nombre', label: 'Nombre', required: true, placeholder: 'Ej: San Joaquín' },
  { name: 'ubicacion', label: 'Ubicación', placeholder: 'Ej: Carretera principal km 3' },
]

// ─── Componente principal ─────────────────────────────────────────────────────
export default function InventarioPage() {
  const { usuario } = useAuth()
  const esJefe = usuario?.rol === 'jefe'

  const TABS = esJefe
    ? ['Tipos de Café', 'Bodegas', 'Stock']
    : ['Stock']

  const [tabActiva, setTabActiva] = useState(TABS[0])

  // Tipos de café
  const [tiposCafe, setTiposCafe] = useState([])
  const [loadingTipos, setLoadingTipos] = useState(true)

  // Bodegas
  const [bodegas, setBodegas] = useState([])
  const [loadingBodegas, setLoadingBodegas] = useState(true)

  // Stock
  // FIX: el campo correcto en la respuesta de /me/ es 'bodega_id', no
  // 'bodega'. Con 'bodega' el valor era undefined, String(undefined ?? '')
  // daba '' y el admin no filtraba por su propia bodega al consultar stock.
  const [stockFilas, setStockFilas] = useState([])
  const [stockTotales, setStockTotales] = useState(null)
  const [filtroBodega, setFiltroBodega] = useState(
    esJefe ? '' : String(usuario?.bodega_id ?? '')
  )
  const [filtroTipo, setFiltroTipo] = useState('')
  const [loadingStock, setLoadingStock] = useState(false)
  const [errorStock, setErrorStock] = useState(null)

  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [itemEditando, setItemEditando] = useState(null)

  // ── Cargas ──
  const cargarTipos = () => {
    setLoadingTipos(true)
    getTiposCafe()
      .then(res => setTiposCafe(Array.isArray(res.data) ? res.data : res.data?.results ?? []))
      .catch(() => setTiposCafe([]))
      .finally(() => setLoadingTipos(false))
  }

  const cargarBodegas = () => {
    setLoadingBodegas(true)
    getBodegas()
      .then(res => setBodegas(Array.isArray(res.data) ? res.data : res.data?.results ?? []))
      .catch(() => setBodegas([]))
      .finally(() => setLoadingBodegas(false))
  }

  const consultarStock = () => {
    setLoadingStock(true)
    setErrorStock(null)
    const params = {}
    if (filtroBodega) params.bodega = filtroBodega
    if (filtroTipo) params.tipo_cafe = filtroTipo
    getStockDetallado(params)
      .then(res => {
        setStockFilas(Array.isArray(res.data.filas) ? res.data.filas : [])
        setStockTotales(res.data.totales ?? null)
      })
      .catch(() => setErrorStock('No se pudo cargar el stock. Intenta de nuevo.'))
      .finally(() => setLoadingStock(false))
  }

  // FIX: el administrador nunca usa las pestañas de Tipos de Café ni
  // Bodegas, así que no tiene sentido cargar esos datos para su sesión.
  // Esto también elimina el riesgo de race condition donde la redirección
  // automática a Precios (activada en AuthContext para el admin) pudiera
  // interrumpir el render mientras esas cargas estaban en curso, dejando
  // tiposCafe o bodegas en estado no-array y rompiendo cualquier .map()
  // posterior.
  useEffect(() => {
    if (esJefe) {
      cargarTipos()
      cargarBodegas()
    }
  }, [])

  useEffect(() => {
    if (tabActiva === 'Stock') consultarStock()
  }, [tabActiva, filtroBodega, filtroTipo])

  // ── Acciones Tipos de Café ──
  const handleSubmitTipo = async (form) => {
    if (itemEditando) await updateTipoCafe(itemEditando.id, form)
    else await createTipoCafe(form)
    cargarTipos()
  }

  const handleEliminarTipo = async (id) => {
    if (!confirm('¿Eliminar este tipo de café?')) return
    try {
      await deleteTipoCafe(id)
      cargarTipos()
    } catch {
      alert('No se puede eliminar. Tiene registros asociados.')
    }
  }

  // ── Acciones Bodegas ──
  const handleSubmitBodega = async (form) => {
    if (itemEditando) await updateBodega(itemEditando.id, form)
    else await createBodega(form)
    cargarBodegas()
  }

  const handleEliminarBodega = async (id) => {
    if (!confirm('¿Eliminar esta bodega?')) return
    try {
      await deleteBodega(id)
      cargarBodegas()
    } catch {
      alert('No se puede eliminar. Tiene registros asociados.')
    }
  }

  const handleEditar = (item) => { setItemEditando(item); setModalOpen(true) }
  const handleNuevo  = ()     => { setItemEditando(null);  setModalOpen(true) }

  const mostrarColumnaBodega = esJefe && !filtroBodega

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── Encabezado ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
            Inventario
          </h1>
          <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>
            {esJefe
              ? 'Gestión de tipos de café, bodegas y consulta de stock'
              : 'Consulta de stock de tu bodega'}
          </p>
        </div>
        {esJefe && tabActiva !== 'Stock' && (
          <button
            onClick={handleNuevo}
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
            <IconPlus />
            {tabActiva === 'Tipos de Café' ? 'Nuevo tipo' : 'Nueva bodega'}
          </button>
        )}
      </div>

      {/* ── Tabs ── */}
      {TABS.length > 1 && (
        <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid #e2e8f0' }}>
          {TABS.map(tab => {
            const activa = tabActiva === tab
            return (
              <button
                key={tab}
                onClick={() => setTabActiva(tab)}
                style={{
                  padding: '9px 18px',
                  fontSize: '13px',
                  fontWeight: activa ? 600 : 400,
                  color: activa ? '#16a34a' : '#64748b',
                  background: 'none',
                  border: 'none',
                  borderBottom: activa ? '2px solid #16a34a' : '2px solid transparent',
                  marginBottom: '-1px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (!activa) e.currentTarget.style.color = '#0f172a' }}
                onMouseLeave={e => { if (!activa) e.currentTarget.style.color = '#64748b' }}
              >
                {tab}
              </button>
            )
          })}
        </div>
      )}

      {/* ── Tab: Tipos de Café ── */}
      {tabActiva === 'Tipos de Café' && (
        loadingTipos ? (
          <div style={{ color: '#94a3b8', fontSize: '13px', padding: '20px 0' }}>
            Cargando tipos de café...
          </div>
        ) : (
          <div style={{
            background: 'white', border: '1px solid #e2e8f0',
            borderRadius: '10px', overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#0f172a' }}>
                  {['#', 'Nombre', 'Descripción', 'Estado', 'Acciones'].map(col => (
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
                {tiposCafe.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{
                      padding: '40px', textAlign: 'center',
                      color: '#94a3b8', fontSize: '13px',
                    }}>
                      No hay tipos de café registrados aún.
                    </td>
                  </tr>
                ) : (
                  tiposCafe.map(t => (
                    <tr
                      key={t.id}
                      style={{ borderTop: '1px solid #f1f5f9', transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'white'}
                    >
                      <td style={{ padding: '11px 16px', color: '#94a3b8' }}>{t.id}</td>
                      <td style={{ padding: '11px 16px', fontWeight: 500, color: '#0f172a' }}>{t.nombre}</td>
                      <td style={{ padding: '11px 16px', color: '#475569' }}>{t.descripcion || '—'}</td>
                      <td style={{ padding: '11px 16px' }}><BadgeEstado activo={t.activo} /></td>
                      <td style={{ padding: '11px 16px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => handleEditar(t)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '4px',
                              padding: '5px 10px', borderRadius: '5px', border: 'none',
                              background: '#eff6ff', color: '#2563eb',
                              fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#dbeafe'}
                            onMouseLeave={e => e.currentTarget.style.background = '#eff6ff'}
                          >
                            <IconEdit /> Editar
                          </button>
                          <button
                            onClick={() => handleEliminarTipo(t.id)}
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
            {tiposCafe.length > 0 && (
              <div style={{
                padding: '10px 16px', borderTop: '1px solid #f1f5f9',
                color: '#94a3b8', fontSize: '12px',
              }}>
                {tiposCafe.length} tipo(s) registrado(s)
              </div>
            )}
          </div>
        )
      )}

      {/* ── Tab: Bodegas ── */}
      {tabActiva === 'Bodegas' && (
        loadingBodegas ? (
          <div style={{ color: '#94a3b8', fontSize: '13px', padding: '20px 0' }}>
            Cargando bodegas...
          </div>
        ) : (
          <div style={{
            background: 'white', border: '1px solid #e2e8f0',
            borderRadius: '10px', overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#0f172a' }}>
                  {['#', 'Nombre', 'Ubicación', 'Estado', 'Acciones'].map(col => (
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
                {bodegas.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{
                      padding: '40px', textAlign: 'center',
                      color: '#94a3b8', fontSize: '13px',
                    }}>
                      No hay bodegas registradas aún.
                    </td>
                  </tr>
                ) : (
                  bodegas.map(b => (
                    <tr
                      key={b.id}
                      style={{ borderTop: '1px solid #f1f5f9', transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'white'}
                    >
                      <td style={{ padding: '11px 16px', color: '#94a3b8' }}>{b.id}</td>
                      <td style={{ padding: '11px 16px', fontWeight: 500, color: '#0f172a' }}>{b.nombre}</td>
                      <td style={{ padding: '11px 16px', color: '#475569' }}>{b.ubicacion || '—'}</td>
                      <td style={{ padding: '11px 16px' }}><BadgeEstado activo={b.activo} /></td>
                      <td style={{ padding: '11px 16px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => handleEditar(b)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '4px',
                              padding: '5px 10px', borderRadius: '5px', border: 'none',
                              background: '#eff6ff', color: '#2563eb',
                              fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#dbeafe'}
                            onMouseLeave={e => e.currentTarget.style.background = '#eff6ff'}
                          >
                            <IconEdit /> Editar
                          </button>
                          <button
                            onClick={() => handleEliminarBodega(b.id)}
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
            {bodegas.length > 0 && (
              <div style={{
                padding: '10px 16px', borderTop: '1px solid #f1f5f9',
                color: '#94a3b8', fontSize: '12px',
              }}>
                {bodegas.length} bodega(s) registrada(s)
              </div>
            )}
          </div>
        )
      )}

      {/* ── Tab: Stock ── */}
      {tabActiva === 'Stock' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Filtros */}
          <div style={{
            background: 'white', border: '1px solid #e2e8f0',
            borderRadius: '10px', padding: '20px',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              marginBottom: '16px',
            }}>
              <span style={{ color: '#64748b' }}><IconFilter /></span>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                Filtros de consulta
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>

              <div style={{ flex: '1', minWidth: '160px' }}>
                <label style={{
                  display: 'block', fontSize: '12px', fontWeight: 500,
                  color: '#475569', marginBottom: '5px',
                }}>
                  Bodega
                </label>
                {esJefe ? (
                  <select
                    value={filtroBodega}
                    onChange={e => setFiltroBodega(e.target.value)}
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      border: '1px solid #e2e8f0', borderRadius: '6px',
                      padding: '8px 12px', fontSize: '13px', color: '#0f172a',
                      background: 'white', outline: 'none',
                    }}
                    onFocus={e => e.target.style.borderColor = '#16a34a'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  >
                    <option value="">Todas las bodegas</option>
                    {bodegas.map(b => (
                      <option key={b.id} value={b.id}>{b.nombre}</option>
                    ))}
                  </select>
                ) : (
                  // FIX: usar bodega_id (nombre correcto del campo en /me/)
                  // en vez de bodega, que era undefined y mostraba 'Tu bodega'
                  // siempre, aunque la bodega sí estuviera asignada.
                  <div style={{
                    width: '100%', boxSizing: 'border-box',
                    border: '1px solid #e2e8f0', borderRadius: '6px',
                    padding: '8px 12px', fontSize: '13px', color: '#475569',
                    background: '#f8fafc',
                  }}>
                    {usuario?.bodega_nombre ?? 'Tu bodega'}
                  </div>
                )}
              </div>

              <div style={{ flex: '1', minWidth: '160px' }}>
                <label style={{
                  display: 'block', fontSize: '12px', fontWeight: 500,
                  color: '#475569', marginBottom: '5px',
                }}>
                  Tipo de Café
                </label>
                <select
                  value={filtroTipo}
                  onChange={e => setFiltroTipo(e.target.value)}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    border: '1px solid #e2e8f0', borderRadius: '6px',
                    padding: '8px 12px', fontSize: '13px', color: '#0f172a',
                    background: 'white', outline: 'none',
                  }}
                  onFocus={e => e.target.style.borderColor = '#16a34a'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                >
                  <option value="">Todos los tipos</option>
                  {tiposCafe.map(t => (
                    <option key={t.id} value={t.id}>{t.nombre}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Error */}
          {errorStock && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px',
              padding: '12px 16px', color: '#dc2626', fontSize: '13px',
            }}>
              {errorStock}
            </div>
          )}

          {/* Totales */}
          {stockTotales && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              {[
                { label: 'Total Entradas', value: stockTotales.entradas,     color: '#2563eb', bg: '#eff6ff' },
                { label: 'Total Salidas',  value: stockTotales.salidas,      color: '#dc2626', bg: '#fef2f2' },
                { label: 'Stock Actual',   value: stockTotales.stock_actual, color: '#16a34a', bg: '#f0fdf4' },
              ].map(card => (
                <div key={card.label} style={{
                  background: 'white', border: '1px solid #e2e8f0',
                  borderRadius: '10px', padding: '20px',
                  borderLeft: `3px solid ${card.color}`,
                }}>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 8px 0', fontWeight: 500 }}>
                    {card.label}
                  </p>
                  <p style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    {card.value}
                    <span style={{ fontSize: '14px', fontWeight: 400, color: '#94a3b8', marginLeft: '4px' }}>kg</span>
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Desglose */}
          <div style={{
            background: 'white', border: '1px solid #e2e8f0',
            borderRadius: '10px', overflow: 'hidden',
          }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9' }}>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                Desglose por {mostrarColumnaBodega ? 'bodega y ' : ''}tipo de café
              </p>
            </div>

            {loadingStock ? (
              <div style={{ color: '#94a3b8', fontSize: '13px', padding: '32px', textAlign: 'center' }}>
                Cargando stock...
              </div>
            ) : stockFilas.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                No hay datos de stock para los filtros seleccionados.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#0f172a' }}>
                    {[
                      ...(mostrarColumnaBodega ? ['Bodega'] : []),
                      'Tipo de Café', 'Entradas (kg)', 'Salidas (kg)', 'Stock actual (kg)',
                    ].map(col => (
                      <th key={col} style={{
                        padding: '11px 16px', textAlign: col === 'Tipo de Café' || col === 'Bodega' ? 'left' : 'right',
                        color: '#e2e8f0', fontWeight: 500, fontSize: '12px',
                        whiteSpace: 'nowrap',
                      }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stockFilas.map(fila => (
                    <tr
                      key={`${fila.bodega_id}-${fila.tipo_cafe_id}`}
                      style={{ borderTop: '1px solid #f1f5f9', transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'white'}
                    >
                      {mostrarColumnaBodega && (
                        <td style={{ padding: '11px 16px', color: '#475569' }}>{fila.bodega_nombre}</td>
                      )}
                      <td style={{ padding: '11px 16px', fontWeight: 500, color: '#0f172a' }}>
                        {fila.tipo_cafe_nombre}
                      </td>
                      <td style={{ padding: '11px 16px', textAlign: 'right', color: '#2563eb' }}>
                        {fila.entradas}
                      </td>
                      <td style={{ padding: '11px 16px', textAlign: 'right', color: '#dc2626' }}>
                        {fila.salidas}
                      </td>
                      <td style={{ padding: '11px 16px', textAlign: 'right', fontWeight: 600, color: '#16a34a' }}>
                        {fila.stock_actual}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── Modal — solo jefe ── */}
      {modalOpen && esJefe && (
        <ItemModal
          titulo={tabActiva === 'Tipos de Café' ? 'Tipo de Café' : 'Bodega'}
          item={itemEditando}
          campos={tabActiva === 'Tipos de Café' ? camposTipoCafe : camposBodega}
          onClose={() => setModalOpen(false)}
          onSubmit={tabActiva === 'Tipos de Café' ? handleSubmitTipo : handleSubmitBodega}
        />
      )}
    </div>
  )
}