import { NavLink } from 'react-router-dom'

const Icon = ({ d, d2 }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    <path d={d} />
    {d2 && <path d={d2} />}
  </svg>
)

const SECTIONS = [
  {
    label: 'Principal',
    links: [
      {
        to: '/',
        label: 'Dashboard',
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
      },
      {
        to: '/terceros',
        label: 'Terceros',
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      },
    ]
  },
  {
    label: 'Operaciones',
    links: [
      {
        to: '/compras',
        label: 'Compras',
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
      },
      {
        to: '/ventas',
        label: 'Ventas',
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
      },
      {
        to: '/inventario',
        label: 'Inventario',
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
      },
      {
        to: '/traslados',
        label: 'Traslados',
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
      },
      {
        to: '/precios',
        label: 'Precios diarios',
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
      },
    ]
  },
]

export default function Sidebar() {
  return (
    <aside style={{
      width: '220px',
      minHeight: '100vh',
      background: '#0f172a',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
    }}>

      {/* Logo */}
      <div style={{
        padding: '20px 16px 16px',
        borderBottom: '1px solid #1e293b',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px',
            background: '#16a34a',
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M2 21h20M6 21V8l6-5 6 5v13M10 21v-5h4v5"/>
            </svg>
          </div>
          <div>
            <div style={{ color: '#f8fafc', fontSize: '15px', fontWeight: 600, letterSpacing: '-0.3px' }}>
              Café System
            </div>
            <div style={{ color: '#64748b', fontSize: '11px', marginTop: '1px' }}>
              Jimmi Martínez
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '12px 8px', flex: 1 }}>
        {SECTIONS.map(section => (
          <div key={section.label} style={{ marginBottom: '20px' }}>
            <div style={{
              color: '#475569',
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
              padding: '0 8px',
              marginBottom: '4px',
            }}>
              {section.label}
            </div>
            {section.links.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  marginBottom: '1px',
                  fontSize: '13px',
                  textDecoration: 'none',
                  transition: 'all 0.15s',
                  background: isActive ? '#16a34a' : 'transparent',
                  color: isActive ? 'white' : '#94a3b8',
                })}
                onMouseEnter={e => {
                  if (!e.currentTarget.classList.contains('active')) {
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
        ))}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid #1e293b',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <div style={{
          width: '28px', height: '28px',
          background: '#1e40af',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#93c5fd',
          fontSize: '11px',
          fontWeight: 600,
          flexShrink: 0,
        }}>
          JM
        </div>
        <div>
          <div style={{ color: '#e2e8f0', fontSize: '12px', fontWeight: 500 }}>Jimmi Martínez</div>
          <div style={{ color: '#64748b', fontSize: '10px' }}>Administrador</div>
        </div>
      </div>
    </aside>
  )
}