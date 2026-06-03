// ─── Iconos SVG inline ────────────────────────────────────────────────────────
const IconAlerta = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)

// ─── Componente ───────────────────────────────────────────────────────────────
// Props:
//   titulo    → texto del título (default: "¿Estás seguro?")
//   mensaje   → descripción de lo que se va a hacer
//   txtConfirm → texto del botón de confirmar (default: "Eliminar")
//   variante  → "danger" (rojo) | "warning" (amarillo) | "primary" (verde)
//   onConfirm → función que se ejecuta al confirmar
//   onClose   → función que cierra el modal

export default function ConfirmModal({
  titulo     = '¿Estás seguro?',
  mensaje    = 'Esta acción no se puede deshacer.',
  txtConfirm = 'Eliminar',
  variante   = 'danger',
  onConfirm,
  onClose,
}) {

  // Colores según variante
  const colores = {
    danger: {
      iconBg:   '#fef2f2',
      iconColor:'#dc2626',
      btnBg:    '#dc2626',
      btnHover: '#b91c1c',
    },
    warning: {
      iconBg:   '#fffbeb',
      iconColor:'#ca8a04',
      btnBg:    '#ca8a04',
      btnHover: '#a16207',
    },
    primary: {
      iconBg:   '#f0fdf4',
      iconColor:'#16a34a',
      btnBg:    '#16a34a',
      btnHover: '#15803d',
    },
  }

  const c = colores[variante] || colores.danger

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15, 23, 42, 0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 60, padding: '16px',
      }}
    >
      <div style={{
        background: 'white', borderRadius: '12px',
        width: '100%', maxWidth: '380px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        overflow: 'hidden',
        // Animación de entrada suave
        animation: 'confirmEntrada 0.15s ease-out',
      }}>

        {/* ── Cuerpo ── */}
        <div style={{ padding: '28px 24px 20px', textAlign: 'center' }}>

          {/* Ícono central */}
          <div style={{
            width: '52px', height: '52px', borderRadius: '50%',
            background: c.iconBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            color: c.iconColor,
          }}>
            <IconAlerta />
          </div>

          {/* Título */}
          <h3 style={{
            fontSize: '16px', fontWeight: 600, color: '#0f172a',
            margin: '0 0 8px',
          }}>
            {titulo}
          </h3>

          {/* Mensaje */}
          <p style={{
            fontSize: '13px', color: '#64748b',
            margin: 0, lineHeight: '1.5',
          }}>
            {mensaje}
          </p>
        </div>

        {/* ── Pie con botones ── */}
        <div style={{
          display: 'flex', gap: '10px',
          padding: '16px 24px',
          borderTop: '1px solid #f1f5f9',
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '9px',
              border: '1px solid #e2e8f0', borderRadius: '6px',
              background: 'white', color: '#475569',
              fontSize: '13px', fontWeight: 500, cursor: 'pointer',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
            onMouseLeave={e => e.currentTarget.style.background = 'white'}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            style={{
              flex: 1, padding: '9px',
              border: 'none', borderRadius: '6px',
              background: c.btnBg, color: 'white',
              fontSize: '13px', fontWeight: 500, cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = c.btnHover}
            onMouseLeave={e => e.currentTarget.style.background = c.btnBg}
          >
            {txtConfirm}
          </button>
        </div>

      </div>

      {/* Animación CSS inline */}
      <style>{`
        @keyframes confirmEntrada {
          from { opacity: 0; transform: scale(0.95) translateY(-8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}