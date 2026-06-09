import { useEffect, useState } from 'react'
import { getUsuarios, deleteUsuario } from '../../api/usuarios'
import UsuarioModal from '../../components/usuarios/UsuarioModal'

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

// ─── Badges ───────────────────────────────────────────────────────────────────
function BadgeRol({ rol }) {
  const esJefe = rol === 'jefe'
  return (
    <span style={{
      background: esJefe ? '#fefce8' : '#f0fdf4',
      color:      esJefe ? '#ca8a04' : '#16a34a',
      fontSize: '11px', fontWeight: 600,
      padding: '2px 8px', borderRadius: '99px',
      textTransform: 'capitalize',
    }}>
      {esJefe ? 'Jefe' : 'Administrador'}
    </span>
  )
}

function BadgeEstado({ activo }) {
  return (
    <span style={{
      background: activo ? '#f0fdf4' : '#fef2f2',
      color:      activo ? '#16a34a' : '#dc2626',
      fontSize: '11px', fontWeight: 600,
      padding: '2px 8px', borderRadius: '99px',
    }}>
      {activo ? 'Activo' : 'Inactivo'}
    </span>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function UsuariosPage() {
  const [usuarios, setUsuarios]           = useState([])
  const [loading, setLoading]             = useState(true)
  const [modalOpen, setModalOpen]         = useState(false)
  const [usuarioEditando, setUsuarioEdit] = useState(null)

  const cargarUsuarios = () => {
    setLoading(true)
    getUsuarios()
      .then(res => setUsuarios(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargarUsuarios() }, [])

  const handleNuevo  = () => { setUsuarioEdit(null); setModalOpen(true) }
  const handleEditar = (u) => { setUsuarioEdit(u);   setModalOpen(true) }

  const handleEliminar = async (id) => {
    if (!confirm('¿Eliminar este usuario? Esta acción no se puede deshacer.')) return
    try {
      await deleteUsuario(id)
      cargarUsuarios()
    } catch {
      alert('No se pudo eliminar el usuario.')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── Encabezado ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
            Usuarios
          </h1>
          <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>
            Gestión de acceso al sistema
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
          <IconPlus /> Nuevo usuario
        </button>
      </div>

      {/* ── Tabla ── */}
      {loading ? (
        <div style={{ color: '#94a3b8', fontSize: '13px', padding: '20px 0' }}>
          Cargando usuarios...
        </div>
      ) : (
        <div style={{
          background: 'white', border: '1px solid #e2e8f0',
          borderRadius: '10px', overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#0f172a' }}>
                {['#', 'Nombre', 'Usuario', 'Rol', 'Bodega', 'Estado', 'Acciones'].map(col => (
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
              {usuarios.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{
                    padding: '40px', textAlign: 'center',
                    color: '#94a3b8', fontSize: '13px',
                  }}>
                    No hay usuarios registrados aún.
                  </td>
                </tr>
              ) : (
                usuarios.map(u => (
                  <tr
                    key={u.id}
                    style={{ borderTop: '1px solid #f1f5f9', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'white'}
                  >
                    <td style={{ padding: '11px 16px', color: '#94a3b8' }}>
                      {u.id}
                    </td>
                    <td style={{ padding: '11px 16px', fontWeight: 500, color: '#0f172a' }}>
                      {/* Nombre completo, si no tiene mostramos el username */}
                      {(u.first_name || u.last_name)
                        ? `${u.first_name} ${u.last_name}`.trim()
                        : u.username}
                    </td>
                    <td style={{ padding: '11px 16px', color: '#475569', fontFamily: 'monospace' }}>
                      {u.username}
                    </td>
                    <td style={{ padding: '11px 16px' }}>
                      <BadgeRol rol={u.rol} />
                    </td>
                    <td style={{ padding: '11px 16px', color: '#475569' }}>
                      {/* El jefe no tiene bodega */}
                      {u.bodega_nombre || (
                        <span style={{ color: '#cbd5e1', fontSize: '12px' }}>Sin bodega</span>
                      )}
                    </td>
                    <td style={{ padding: '11px 16px' }}>
                      <BadgeEstado activo={u.is_active} />
                    </td>
                    <td style={{ padding: '11px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => handleEditar(u)}
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
                          onClick={() => handleEliminar(u.id)}
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

          {usuarios.length > 0 && (
            <div style={{
              padding: '10px 16px', borderTop: '1px solid #f1f5f9',
              color: '#94a3b8', fontSize: '12px',
            }}>
              {usuarios.length} usuario(s) registrado(s)
            </div>
          )}
        </div>
      )}

      {/* ── Modal ── */}
      {modalOpen && (
        <UsuarioModal
          usuario={usuarioEditando}
          onClose={() => setModalOpen(false)}
          onSaved={cargarUsuarios}
        />
      )}
    </div>
  )
}