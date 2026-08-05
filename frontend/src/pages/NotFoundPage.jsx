import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// ─── Icono SVG inline ─────────────────────────────────────────────────────────
const IconMapa = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
    stroke="#ca8a04" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
    <line x1="8" y1="2" x2="8" y2="18" />
    <line x1="16" y1="6" x2="16" y2="22" />
  </svg>
)

// ─── Página 404 ───────────────────────────────────────────────────────────────
// Se muestra cuando la URL no coincide con ninguna ruta conocida (ver el
// <Route path="*"> en App.jsx). Antes de esto, una URL inválida dejaba la
// pantalla completamente en blanco porque React Router no renderizaba nada.
export default function NotFoundPage() {
  const navigate = useNavigate()
  const { usuario } = useAuth()

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#f8fafc', padding: '24px', textAlign: 'center',
    }}>
      <div style={{
        background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px',
        padding: '40px 32px', maxWidth: '440px', width: '100%',
      }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          background: '#fefce8', display: 'flex', alignItems: 'center',
          justifyContent: 'center', margin: '0 auto 20px',
        }}>
          <IconMapa />
        </div>

        <p style={{
          fontSize: '13px', fontWeight: 700, color: '#ca8a04',
          letterSpacing: '0.05em', margin: '0 0 8px',
        }}>
          ERROR 404
        </p>
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>
          Esta página no existe
        </h1>
        <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 24px', lineHeight: 1.5 }}>
          La dirección a la que intentaste entrar no corresponde a ninguna
          sección del sistema. Puede que el enlace esté mal escrito o que
          la página se haya movido.
        </p>

        <button
          onClick={() => navigate(usuario ? '/' : '/login')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: '#16a34a', color: 'white', border: 'none',
            borderRadius: '6px', padding: '10px 20px',
            fontSize: '13px', fontWeight: 500, cursor: 'pointer',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#15803d'}
          onMouseLeave={e => e.currentTarget.style.background = '#16a34a'}
        >
          {usuario ? 'Volver al inicio' : 'Ir al login'}
        </button>
      </div>
    </div>
  )
}