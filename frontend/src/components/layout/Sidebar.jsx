import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

// ─── Secciones de navegación ──────────────────────────────────────────────────
// Cada sección tiene un label y sus links
// La propiedad "soloJefe: true" hace que ese link solo aparezca para el jefe
const SECTIONS = [
  {
    label: 'Principal',
    links: [
      {
        to: '/',
        label: 'Dashboard',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ flexShrink: 0 }}>
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
          </svg>
        ),
      },
      {
        to: '/terceros',
        label: 'Terceros',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ flexShrink: 0 }}>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        ),
      },
      {
        to: '/usuarios',
        label: 'Usuarios',
        soloJefe: true,   // ← solo visible para el jefe
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ flexShrink: 0 }}>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        ),
      },
    ],
  },
  {
    label: 'Operaciones',
    links: [
      {
        to: '/compras',
        label: 'Compras',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ flexShrink: 0 }}>
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
        ),
      },
      {
        to: '/ventas',
        label: 'Ventas',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ flexShrink: 0 }}>
            <circle cx="9" cy="21" r="1"/>
            <circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
        ),
      },
      {
        to: '/inventario',
        label: 'Inventario',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ flexShrink: 0 }}>
            <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
          </svg>
        ),
      },
      {
        to: '/traslados',
        label: 'Traslados',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ flexShrink: 0 }}>
            <rect x="1" y="3" width="15" height="13"/>
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
            <circle cx="5.5" cy="18.5" r="2.5"/>
            <circle cx="18.5" cy="18.5" r="2.5"/>
          </svg>
        ),
      },
      {
        to: '/caja',
        label: 'Caja',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ flexShrink: 0 }}>
            <rect x="2" y="7" width="20" height="14" rx="2"/>
            <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
            <line x1="12" y1="12" x2="12" y2="16"/>
            <line x1="10" y1="14" x2="14" y2="14"/>
            </svg>
        ),
      },
      {
        to: '/gastos',
        label: 'Gastos',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ flexShrink: 0 }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
            </svg>
        ),
      },
      {
        to: '/cuentas-pagar',
        label: 'Cuentas por pagar',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ flexShrink: 0 }}>
            <rect x="2" y="5" width="20" height="14" rx="2"/>
            <line x1="2" y1="10" x2="22" y2="10"/>
            </svg>
        ),
      },
      {
        to: '/cuentas-cobrar',
        label: 'Cuentas por cobrar',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <rect x="2" y="5" width="20" height="14" rx="2"/>
            <path d="M16 10h.01M12 10h.01M8 10h.01M16 14h.01M12 14h.01"/>
            </svg>
        ),
      },
      {
        to: '/precios',
        label: 'Precios diarios',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ flexShrink: 0 }}>
            <line x1="12" y1="1" x2="12" y2="23"/>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        ),
      },
    ],
  },
]

// ─── Icono de logout ──────────────────────────────────────────────────────────
const IconLogout = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Sidebar() {
  const { usuario, cerrarSesion } = useAuth()
  const navigate = useNavigate()

  const esJefe = usuario?.rol === 'jefe'

  const handleLogout = async () => {
    await cerrarSesion()
    navigate('/login')
  }

  // Inicial del nombre para el avatar
  const inicial = (usuario?.nombre || usuario?.username || 'U')
    .charAt(0).toUpperCase()

  return (
    <aside style={{
      width: '220px',
      minHeight: '100vh',
      background: '#0f172a',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
    }}>

      {/* ── Logo ── */}
        <div style={{
            padding: '16px 16px 14px',
            borderBottom: '1px solid #1e293b',
        }}>
            <img
                src="/logo.png"
                alt="Café San"
                style={{
                width: '100%',
                maxHeight: '72px',
                objectFit: 'contain',
                objectPosition: 'left center',
                mixBlendMode: 'luminosity',
                }}
            />
        </div>


      {/* ── Nav ── */}
      <nav style={{ padding: '12px 8px', flex: 1 }}>
        {SECTIONS.map(section => {
          // Filtra los links: si el link es soloJefe y el usuario NO es jefe, lo oculta
          const linksFiltrados = section.links.filter(link =>
            !link.soloJefe || esJefe
          )
          if (linksFiltrados.length === 0) return null

          return (
            <div key={section.label} style={{ marginBottom: '20px' }}>
              <div style={{
                color: '#475569', fontSize: '10px', fontWeight: 600,
                letterSpacing: '0.8px', textTransform: 'uppercase',
                padding: '0 8px', marginBottom: '4px',
              }}>
                {section.label}
              </div>

              {linksFiltrados.map(link => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '8px 10px', borderRadius: '6px',
                    marginBottom: '1px', fontSize: '13px',
                    textDecoration: 'none', transition: 'all 0.15s',
                    background: isActive ? '#16a34a' : 'transparent',
                    color: isActive ? 'white' : '#94a3b8',
                  })}
                  onMouseEnter={e => {
                    if (e.currentTarget.getAttribute('aria-current') !== 'page') {
                      e.currentTarget.style.background = '#1e293b'
                      e.currentTarget.style.color = '#e2e8f0'
                    }
                  }}
                  onMouseLeave={e => {
                    if (e.currentTarget.getAttribute('aria-current') !== 'page') {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = '#94a3b8'
                    }
                  }}
                >
                  {link.icon}
                  {link.label}
                </NavLink>
              ))}
            </div>
          )
        })}
      </nav>

      {/* ── Footer: usuario + logout ── */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid #1e293b',
      }}>
        {/* Info del usuario */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          marginBottom: '8px',
        }}>
          <div style={{
            width: '28px', height: '28px',
            background: esJefe ? '#16a34a' : '#1e40af',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: esJefe ? '#dcfce7' : '#93c5fd',
            fontSize: '11px', fontWeight: 600, flexShrink: 0,
          }}>
            {inicial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              color: '#e2e8f0', fontSize: '12px', fontWeight: 500,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {usuario?.nombre || usuario?.username || 'Usuario'}
            </div>
            <div style={{ color: '#64748b', fontSize: '10px', textTransform: 'capitalize' }}>
              {usuario?.rol || '—'}
              {usuario?.bodega_nombre && (
                <span style={{ color: '#475569' }}> · {usuario.bodega_nombre}</span>
              )}
            </div>
          </div>
        </div>

        {/* Botón cerrar sesión */}
        <button
          onClick={handleLogout}
          style={{
            width: '100%', padding: '6px 10px',
            border: '1px solid #1e293b', borderRadius: '6px',
            background: 'transparent', color: '#64748b',
            fontSize: '11px', fontWeight: 500, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '6px', transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#1e293b'
            e.currentTarget.style.color = '#e2e8f0'
            e.currentTarget.style.borderColor = '#334155'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = '#64748b'
            e.currentTarget.style.borderColor = '#1e293b'
          }}
        >
          <IconLogout />
          Cerrar sesión
        </button>
      </div>

    </aside>
  )
}