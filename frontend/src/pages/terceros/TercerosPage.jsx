import { useEffect, useState } from 'react'
import { getTerceros, deleteTercero } from '../../api/terceros'
import TerceroModal from '../../components/terceros/TerceroModal'

// ─── Iconos SVG inline ────────────────────────────────────────────────────────
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

// ─── Badge de tipo ────────────────────────────────────────────────────────────
const TIPO_STYLE = {
  cliente:   { bg: '#eff6ff', color: '#2563eb', label: 'Cliente'   },
  proveedor: { bg: '#fefce8', color: '#ca8a04', label: 'Proveedor' },
  ambos:     { bg: '#f5f3ff', color: '#7c3aed', label: 'Ambos'     },
}

function BadgeTipo({ tipo }) {
  const s = TIPO_STYLE[tipo] || { bg: '#f1f5f9', color: '#475569', label: tipo }
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontSize: '11px', fontWeight: 600,
      padding: '2px 8px', borderRadius: '99px',
      textTransform: 'capitalize',
    }}>
      {s.label}
    </span>
  )
}

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

// ─── Componente principal ─────────────────────────────────────────────────────
export default function TercerosPage() {
  const [terceros, setTerceros]           = useState([])
  const [loading, setLoading]             = useState(true)
  const [modalOpen, setModalOpen]         = useState(false)
  const [terceroEditando, setTerceroEdit] = useState(null)
  const [filtro, setFiltro]               = useState('')

  const cargarTerceros = () => {
    setLoading(true)
    getTerceros()
      .then(res => setTerceros(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargarTerceros() }, [])

  const handleNuevo = () => { setTerceroEdit(null); setModalOpen(true) }
  const handleEditar = (t) => { setTerceroEdit(t); setModalOpen(true) }

  const handleEliminar = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este tercero?')) return
    try {
      await deleteTercero(id)
      cargarTerceros()
    } catch {
      alert('No se pudo eliminar. Puede tener registros asociados.')
    }
  }

  const tercerosFiltrados = terceros.filter(t =>
    t.nombre.toLowerCase().includes(filtro.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── Encabezado ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
            Terceros
          </h1>
          <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>
            Gestión de clientes y proveedores
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

      {/* ── Barra de búsqueda ── */}
      <div style={{ position: 'relative', maxWidth: '320px' }}>
        <span style={{
          position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
          color: '#94a3b8', pointerEvents: 'none',
          display: 'flex', alignItems: 'center',
        }}>
          <IconSearch />
        </span>
        <input
          value={filtro}
          onChange={e => setFiltro(e.target.value)}
          placeholder="Buscar por nombre..."
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

      {/* ── Tabla ── */}
      {loading ? (
        <div style={{ color: '#94a3b8', fontSize: '13px', padding: '20px 0' }}>
          Cargando terceros...
        </div>
      ) : (
        <div style={{
          background: 'white', border: '1px solid #e2e8f0',
          borderRadius: '10px', overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#0f172a' }}>
                {['#', 'Nombre', 'Tipo', 'Teléfono', 'Estado', 'Acciones'].map(col => (
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
              {tercerosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{
                    padding: '40px', textAlign: 'center',
                    color: '#94a3b8', fontSize: '13px',
                  }}>
                    {filtro ? 'No se encontraron resultados para tu búsqueda.' : 'No hay terceros registrados aún.'}
                  </td>
                </tr>
              ) : (
                tercerosFiltrados.map((t, idx) => (
                  <tr
                    key={t.id}
                    style={{ borderTop: '1px solid #f1f5f9', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'white'}
                  >
                    <td style={{ padding: '11px 16px', color: '#94a3b8' }}>{t.id}</td>
                    <td style={{ padding: '11px 16px', fontWeight: 500, color: '#0f172a' }}>{t.nombre}</td>
                    <td style={{ padding: '11px 16px' }}><BadgeTipo tipo={t.tipo} /></td>
                    <td style={{ padding: '11px 16px', color: '#475569' }}>{t.telefono || '—'}</td>
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

          {/* Pie de tabla con conteo */}
          {tercerosFiltrados.length > 0 && (
            <div style={{
              padding: '10px 16px',
              borderTop: '1px solid #f1f5f9',
              color: '#94a3b8', fontSize: '12px',
            }}>
              {filtro
                ? `${tercerosFiltrados.length} resultado(s) para "${filtro}"`
                : `${terceros.length} tercero(s) registrado(s)`
              }
            </div>
          )}
        </div>
      )}

      {/* ── Modal ── */}
      {modalOpen && (
        <TerceroModal
          tercero={terceroEditando}
          onClose={() => setModalOpen(false)}
          onSaved={cargarTerceros}
        />
      )}
    </div>
  )
}