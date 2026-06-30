import { useEffect, useState } from 'react'
import { getPrecios, getPreciosHoy, deletePrecio, createPrecio, updatePrecio } from '../../api/precios'
import { getTiposCafe } from '../../api/inventario'
import { useAuth } from '../../context/AuthContext'
import PrecioModal from '../../components/precios/PrecioModal'

// ─── Iconos SVG inline ────────────────────────────────────────────────────────
const IconPlus = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
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
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" /><path d="M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
)
const IconFilter = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
)
const IconX = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

// ─── Badge tipo de café ───────────────────────────────────────────────────────
function BadgeTipoCafe({ nombre }) {
  return (
    <span style={{
      background: '#f0fdf4', color: '#16a34a',
      fontSize: '11px', fontWeight: 600,
      padding: '2px 8px', borderRadius: '99px',
    }}>
      {nombre}
    </span>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function PreciosPage() {
  const { marcarPreciosRegistrados } = useAuth()

  const [precios, setPrecios]           = useState([])
  const [tiposCafe, setTiposCafe]       = useState([])
  const [loading, setLoading]           = useState(true)
  const [modalOpen, setModalOpen]       = useState(false)
  const [precioEditando, setPrecioEdit] = useState(null)
  const [filtroFecha, setFiltroFecha]   = useState('')

  const hoy = new Date().toISOString().split('T')[0]

  const cargarPreciosHoy = () => {
  setLoading(true)
  getPreciosHoy()
    .then(res => setPrecios(Array.isArray(res.data) ? res.data : []))
    .catch(() => setPrecios([]))
    .finally(() => setLoading(false))
}

  const cargarTodosPrecios = () => {
    setLoading(true)
    getPrecios()
      .then(res => setPrecios(Array.isArray(res.data) ? res.data : []))
      .catch(() => setPrecios([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    setFiltroFecha(hoy)
    getTiposCafe().then(res => setTiposCafe(res.data))
  }, [])

  useEffect(() => {
    if (filtroFecha === hoy) {
      cargarPreciosHoy()
    } else {
      cargarTodosPrecios()
    }
  }, [filtroFecha])
  const handleNuevo = () => { setPrecioEdit(null); setModalOpen(true) }
  const handleEditar = (p) => { setPrecioEdit(p); setModalOpen(true) }

  const handleEliminar = async (id) => {
    if (!confirm('¿Eliminar este precio?')) return
    try {
      await deletePrecio(id)
      filtroFecha === hoy ? cargarPreciosHoy() : cargarTodosPrecios()
    } catch {
      alert('No se pudo eliminar.')
    }
  }

  const handleSubmit = async (form) => {
    if (precioEditando) {
      await updatePrecio(precioEditando.id, form)
    } else {
      await createPrecio(form)
      marcarPreciosRegistrados()
    }
    filtroFecha === hoy ? cargarPreciosHoy() : cargarTodosPrecios()
  }

  const preciosFiltrados = precios.filter(p =>
    filtroFecha ? p.fecha === filtroFecha : true
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── Encabezado ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
            Precios diarios
          </h1>
          <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>
            Precio del café por tipo y fecha
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
          <IconPlus /> Nuevo precio
        </button>
      </div>

      {/* ── Barra de filtros ── */}
      <div style={{
        background: 'white', border: '1px solid #e2e8f0',
        borderRadius: '10px', padding: '14px 16px',
        display: 'flex', alignItems: 'flex-end', gap: '12px', flexWrap: 'wrap',
      }}>
        <div>
          <label style={{
            display: 'block', fontSize: '12px', fontWeight: 500,
            color: '#475569', marginBottom: '5px',
          }}>
            Filtrar por fecha
          </label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span style={{
              position: 'absolute', left: '10px',
              color: '#94a3b8', pointerEvents: 'none',
              display: 'flex', alignItems: 'center',
            }}>
              <IconFilter />
            </span>
            <input
              type="date"
              value={filtroFecha}
              onChange={e => setFiltroFecha(e.target.value)}
              style={{
                paddingLeft: '30px', paddingRight: '12px',
                paddingTop: '7px', paddingBottom: '7px',
                border: '1px solid #e2e8f0', borderRadius: '6px',
                fontSize: '13px', color: '#0f172a', outline: 'none',
                background: 'white',
              }}
              onFocus={e => e.target.style.borderColor = '#16a34a'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>
        </div>

        <button
          onClick={() => setFiltroFecha(hoy)}
          style={{
            padding: '7px 12px', borderRadius: '6px',
            border: '1px solid #bbf7d0', background: filtroFecha === hoy ? '#16a34a' : '#f0fdf4',
            color: filtroFecha === hoy ? 'white' : '#16a34a',
            fontSize: '12px', fontWeight: 500, cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { if (filtroFecha !== hoy) e.currentTarget.style.background = '#dcfce7' }}
          onMouseLeave={e => { if (filtroFecha !== hoy) e.currentTarget.style.background = '#f0fdf4' }}
        >
          Ver hoy
        </button>

        {filtroFecha && (
          <button
            onClick={() => setFiltroFecha('')}
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              padding: '7px 12px', borderRadius: '6px',
              border: '1px solid #e2e8f0', background: 'white',
              color: '#64748b', fontSize: '12px', cursor: 'pointer',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
            onMouseLeave={e => e.currentTarget.style.background = 'white'}
          >
            <IconX /> Limpiar
          </button>
        )}

        {filtroFecha && (
          <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: 'auto' }}>
            {preciosFiltrados.length} precio(s) para{' '}
            <strong style={{ color: '#475569' }}>
              {filtroFecha === hoy ? 'hoy' : filtroFecha}
            </strong>
          </span>
        )}
      </div>

      {/* ── Tabla ── */}
      {loading ? (
        <div style={{ color: '#94a3b8', fontSize: '13px', padding: '20px 0' }}>
          Cargando precios...
        </div>
      ) : (
        <div style={{
          background: 'white', border: '1px solid #e2e8f0',
          borderRadius: '10px', overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#0f172a' }}>
                {['#', 'Fecha', 'Tipo de café', 'Precio / kg', 'Nota', 'Acciones'].map(col => (
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
              {preciosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{
                    padding: '40px', textAlign: 'center',
                    color: '#94a3b8', fontSize: '13px',
                  }}>
                    {filtroFecha
                      ? `No hay precios registrados para ${filtroFecha === hoy ? 'hoy' : filtroFecha}.`
                      : 'No hay precios registrados aún.'
                    }
                  </td>
                </tr>
              ) : (
                preciosFiltrados.map(p => (
                  <tr
                    key={p.id}
                    style={{ borderTop: '1px solid #f1f5f9', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'white'}
                  >
                    <td style={{ padding: '11px 16px', color: '#94a3b8' }}>{p.id}</td>
                    <td style={{ padding: '11px 16px', fontWeight: 500, color: '#0f172a' }}>{p.fecha}</td>
                    <td style={{ padding: '11px 16px' }}>
                      <BadgeTipoCafe nombre={p.tipo_cafe_nombre} />
                    </td>
                    <td style={{ padding: '11px 16px', fontWeight: 700, color: '#0f172a' }}>
                      ${Number(p.precio).toLocaleString('es-CO')}
                    </td>
                    <td style={{ padding: '11px 16px', color: '#94a3b8' }}>{p.nota || '—'}</td>
                    <td style={{ padding: '11px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => handleEditar(p)}
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
                          onClick={() => handleEliminar(p.id)}
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

          {preciosFiltrados.length > 0 && (
            <div style={{
              padding: '10px 16px',
              borderTop: '1px solid #f1f5f9',
              color: '#94a3b8', fontSize: '12px',
            }}>
              {filtroFecha
                ? `${preciosFiltrados.length} precio(s) para ${filtroFecha === hoy ? 'hoy' : filtroFecha}`
                : `${precios.length} precio(s) registrado(s) en total`
              }
            </div>
          )}
        </div>
      )}

      {/* ── Modal ── */}
      {modalOpen && (
        <PrecioModal
          precio={precioEditando}
          tiposCafe={tiposCafe}
          onClose={() => setModalOpen(false)}
          onSaved={() => (filtroFecha === hoy ? cargarPreciosHoy() : cargarTodosPrecios())}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}