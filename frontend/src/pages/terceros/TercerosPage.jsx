import { useEffect, useState } from 'react'
import { getTerceros, deleteTercero } from '../../api/terceros'
import TerceroModal from '../../components/terceros/TerceroModal'
import TerceroPerfil from '../../components/terceros/TerceroPerfil'
import EstadoError from '../../components/common/EstadoError' // NUEVO

const IconPlus = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)
const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
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
const IconEye = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
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

const TIPO_STYLE = {
  empresa:    { bg: '#eff6ff', color: '#2563eb', label: 'Empresa'    },
  caficultor: { bg: '#fefce8', color: '#ca8a04', label: 'Caficultor' },
  ambos:      { bg: '#f5f3ff', color: '#7c3aed', label: 'Ambos'      },
}

function BadgeTipo({ tipo }) {
  const s = TIPO_STYLE[tipo] || { bg: '#f1f5f9', color: '#475569', label: tipo }
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontSize: '11px', fontWeight: 600,
      padding: '2px 8px', borderRadius: '99px',
    }}>
      {s.label}
    </span>
  )
}

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

const CAMPO_ORDEN_BACKEND = {
  id:     'id',
  nombre: 'nombre',
  cedula: 'cedula',
}

export default function TercerosPage() {
  const [terceros, setTerceros]           = useState([])
  const [totalTerceros, setTotalTerceros] = useState(0)
  const [loading, setLoading]             = useState(true)
  const [errorCarga, setErrorCarga]       = useState(false) // NUEVO
  const [modalOpen, setModalOpen]         = useState(false)
  const [terceroEditando, setTerceroEdit] = useState(null)
  const [perfilId, setPerfilId]           = useState(null)

  const [busqueda, setBusqueda]               = useState('')
  const [busquedaDebounced, setBusquedaDebounced] = useState('')
  const [ordenCampo, setOrdenCampo]           = useState('id')
  const [ordenDir, setOrdenDir]               = useState('desc')
  const [filtroTipo, setFiltroTipo]           = useState('')

  const [pagina, setPagina] = useState(1)
  const PAGE_SIZE    = 10
  const totalPaginas = Math.max(1, Math.ceil(totalTerceros / PAGE_SIZE))

  useEffect(() => {
    const timer = setTimeout(() => {
      setBusquedaDebounced(busqueda)
      setPagina(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [busqueda])

  const cargarTerceros = () => {
    setLoading(true)
    const params = {
      page: pagina,
      ordering: ordenDir === 'desc'
        ? `-${CAMPO_ORDEN_BACKEND[ordenCampo]}`
        : CAMPO_ORDEN_BACKEND[ordenCampo],
    }
    if (busquedaDebounced.trim()) params.buscar = busquedaDebounced.trim()
    if (filtroTipo) params.tipo = filtroTipo
    // Sin busqueda ni filtroTipo ni todos → el backend devuelve none()
    // así que mandamos page para activar la lista paginada normal
    if (!busquedaDebounced.trim() && !filtroTipo) params.todos = true

    getTerceros(params)
      .then(res => {
        // Cuando viene paginado → res.data.results/count
        // Cuando viene sin paginar (buscar) → res.data es array plano
        if (Array.isArray(res.data)) {
          setTerceros(res.data)
          setTotalTerceros(res.data.length)
        } else {
          setTerceros(res.data.results)
          setTotalTerceros(res.data.count)
        }
        setErrorCarga(false) // NUEVO
      })
      .catch(() => setErrorCarga(true)) // NUEVO
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    cargarTerceros()
  }, [pagina, busquedaDebounced, ordenCampo, ordenDir, filtroTipo])

  const handleNuevo  = () => { setTerceroEdit(null); setModalOpen(true) }
  const handleEditar = (t) => { setTerceroEdit(t); setModalOpen(true) }

  const handleEliminar = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este tercero?')) return
    try {
      await deleteTercero(id)
      if (terceros.length === 1 && pagina > 1) {
        setPagina(p => p - 1)
      } else {
        cargarTerceros()
      }
    } catch {
      alert('No se pudo eliminar. Puede tener registros asociados.')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
            Terceros
          </h1>
          <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>
            Gestión de caficultores y empresas
          </p>
        </div>
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
          <IconPlus /> Nuevo tercero
        </button>
      </div>

      {/* Búsqueda, filtros y ordenamiento */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>

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
            placeholder="Buscar por nombre o cédula..."
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

        {/* Filtro por tipo */}
        <select
          value={filtroTipo}
          onChange={e => { setFiltroTipo(e.target.value); setPagina(1) }}
          style={{
            border: '1px solid #e2e8f0', borderRadius: '6px',
            padding: '6px 10px', fontSize: '12px', color: '#0f172a',
            background: 'white', outline: 'none', cursor: 'pointer',
          }}
          onFocus={e => e.target.style.borderColor = '#16a34a'}
          onBlur={e => e.target.style.borderColor = '#e2e8f0'}
        >
          <option value="">Todos los tipos</option>
          <option value="caficultor">Caficultores</option>
          <option value="empresa">Empresas</option>
          <option value="ambos">Ambos</option>
        </select>

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
            <option value="nombre">Nombre</option>
            <option value="cedula">Cédula</option>
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

        {(busqueda || filtroTipo) && (
          <button
            onClick={() => { setBusqueda(''); setFiltroTipo(''); setPagina(1) }}
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
          mensaje="No se pudieron cargar los terceros. Verifica tu conexión e intenta de nuevo."
          onReintentar={cargarTerceros}
        />
      )}

      {/* Tabla */}
      {loading ? (
        <div style={{ color: '#94a3b8', fontSize: '13px', padding: '20px 0' }}>
          Cargando terceros...
        </div>
      ) : errorCarga ? null : (
        <div style={{
          background: 'white', border: '1px solid #e2e8f0',
          borderRadius: '10px', overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#0f172a' }}>
                {['#', 'Nombre', 'Tipo', 'Cédula', 'Teléfono', 'Estado', 'Acciones'].map(col => (
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
              {terceros.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{
                    padding: '40px', textAlign: 'center',
                    color: '#94a3b8', fontSize: '13px',
                  }}>
                    {busqueda ? 'No se encontraron resultados.' : 'No hay terceros registrados aún.'}
                  </td>
                </tr>
              ) : (
                terceros.map(t => (
                  <tr
                    key={t.id}
                    style={{ borderTop: '1px solid #f1f5f9', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'white'}
                  >
                    <td style={{ padding: '11px 16px', color: '#94a3b8' }}>{t.id}</td>
                    <td style={{ padding: '11px 16px', fontWeight: 500, color: '#0f172a' }}>{t.nombre}</td>
                    <td style={{ padding: '11px 16px' }}><BadgeTipo tipo={t.tipo} /></td>
                    <td style={{ padding: '11px 16px', color: '#475569' }}>{t.cedula || '—'}</td>
                    <td style={{ padding: '11px 16px', color: '#475569' }}>{t.telefono || '—'}</td>
                    <td style={{ padding: '11px 16px' }}><BadgeEstado activo={t.activo} /></td>
                    <td style={{ padding: '11px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => setPerfilId(t.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '4px',
                            padding: '5px 10px', borderRadius: '5px', border: 'none',
                            background: '#f0fdf4', color: '#16a34a',
                            fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#dcfce7'}
                          onMouseLeave={e => e.currentTarget.style.background = '#f0fdf4'}
                        >
                          <IconEye /> Perfil
                        </button>
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
                          onClick={() => handleEliminar(t.id)}
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

          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 16px', borderTop: '1px solid #f1f5f9',
            flexWrap: 'wrap', gap: '10px',
          }}>
            <span style={{ color: '#94a3b8', fontSize: '12px' }}>
              {busqueda
                ? `${totalTerceros} resultado(s) para "${busqueda}"`
                : `${totalTerceros} tercero(s) registrado(s)`
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

      {/* Modales */}
      {modalOpen && (
        <TerceroModal
          tercero={terceroEditando}
          onClose={() => setModalOpen(false)}
          onSaved={cargarTerceros}
        />
      )}
      {perfilId && (
        <TerceroPerfil
          terceroId={perfilId}
          onClose={() => setPerfilId(null)}
        />
      )}
    </div>
  )
}