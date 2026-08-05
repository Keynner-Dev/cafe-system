import { Component } from 'react'

// ─── Iconos SVG inline (mismo estilo que el resto del sistema) ───────────────
const IconAlertTriangle = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
    stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)

const IconRefresh = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
)

// ─── ErrorBoundary ────────────────────────────────────────────────────────────
// Envuelve toda la app (ver main.jsx). Si CUALQUIER componente lanza un error
// al renderizar (por ejemplo, una respuesta del backend con una forma que el
// frontend no esperaba y provoca un .map() sobre undefined), React deja de
// pintar todo el árbol y, sin este componente, la pantalla queda en blanco
// sin ningún mensaje. Este componente atrapa ese error y muestra una pantalla
// de recuperación en vez del blanco.
//
// IMPORTANTE: esto NO reemplaza los .catch() en las llamadas a la API (eso
// atrapa errores de RED/HTTP). Este componente atrapa errores de RENDERIZADO
// de React. Son dos capas distintas y ambas hacen falta.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { tieneError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { tieneError: true, error }
  }

  componentDidCatch(error, info) {
    // Aquí es el lugar para mandar el error a un servicio de logging
    // (Sentry, LogRocket, etc.) si en algún momento se agrega uno.
    console.error('Error atrapado por ErrorBoundary:', error, info)
  }

  handleRecargar = () => {
    // Recarga completa de la app — limpia cualquier estado corrupto
    // que haya causado el error.
    window.location.href = '/'
  }

  render() {
    if (this.state.tieneError) {
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
              background: '#fef2f2', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 20px',
            }}>
              <IconAlertTriangle />
            </div>

            <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>
              Algo salió mal
            </h1>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 24px', lineHeight: 1.5 }}>
              Ocurrió un error inesperado y no se pudo mostrar esta pantalla.
              Tus datos están a salvo — esto es solo un problema al mostrar
              la información. Intenta recargar la página.
            </p>

            <button
              onClick={this.handleRecargar}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: '#16a34a', color: 'white', border: 'none',
                borderRadius: '6px', padding: '10px 20px',
                fontSize: '13px', fontWeight: 500, cursor: 'pointer',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#15803d'}
              onMouseLeave={e => e.currentTarget.style.background = '#16a34a'}
            >
              <IconRefresh /> Recargar página
            </button>

            {/* Detalle técnico solo visible si hace falta reportar el bug —
                no se muestra por defecto para no confundir a Jimmi. */}
            {this.state.error && (
              <details style={{ marginTop: '20px', textAlign: 'left' }}>
                <summary style={{ fontSize: '11px', color: '#94a3b8', cursor: 'pointer' }}>
                  Detalle técnico (para soporte)
                </summary>
                <pre style={{
                  fontSize: '11px', color: '#64748b', background: '#f8fafc',
                  padding: '10px', borderRadius: '6px', marginTop: '8px',
                  overflow: 'auto', maxHeight: '160px',
                }}>
                  {String(this.state.error?.message || this.state.error)}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}