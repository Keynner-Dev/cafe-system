import { useState, useCallback } from 'react'

// ─── Íconos SVG inline ────────────────────────────────────────────────────────
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IconError = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const IconInfo = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)
const IconWarning = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)
const IconX = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

// ─── Config de variantes ──────────────────────────────────────────────────────
const VARIANTES = {
  success: {
    bg:       '#f0fdf4',
    border:   '#bbf7d0',
    color:    '#15803d',
    iconBg:   '#16a34a',
    Icono:    IconCheck,
  },
  error: {
    bg:       '#fef2f2',
    border:   '#fecaca',
    color:    '#dc2626',
    iconBg:   '#dc2626',
    Icono:    IconError,
  },
  warning: {
    bg:       '#fffbeb',
    border:   '#fde68a',
    color:    '#ca8a04',
    iconBg:   '#ca8a04',
    Icono:    IconWarning,
  },
  info: {
    bg:       '#eff6ff',
    border:   '#bfdbfe',
    color:    '#2563eb',
    iconBg:   '#2563eb',
    Icono:    IconInfo,
  },
}

// ─── Toast individual ─────────────────────────────────────────────────────────
function ToastItem({ id, tipo, mensaje, onClose }) {
  const v = VARIANTES[tipo] || VARIANTES.info
  const { Icono } = v

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '10px',
      padding: '12px 14px',
      background: v.bg,
      border: `1px solid ${v.border}`,
      borderRadius: '8px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
      minWidth: '280px', maxWidth: '360px',
      animation: 'toastEntrada 0.2s ease-out',
      position: 'relative',
    }}>

      {/* Ícono */}
      <div style={{
        width: '24px', height: '24px', borderRadius: '50%',
        background: v.iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'white', flexShrink: 0, marginTop: '1px',
      }}>
        <Icono />
      </div>

      {/* Mensaje */}
      <p style={{
        fontSize: '13px', color: v.color,
        fontWeight: 500, margin: 0,
        flex: 1, lineHeight: '1.4',
        paddingTop: '3px',
      }}>
        {mensaje}
      </p>

      {/* Botón cerrar */}
      <button
        onClick={() => onClose(id)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '20px', height: '20px', borderRadius: '4px',
          border: 'none', background: 'transparent',
          color: v.color, cursor: 'pointer', opacity: 0.6,
          flexShrink: 0, marginTop: '2px', padding: 0,
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
        onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}
      >
        <IconX />
      </button>
    </div>
  )
}

// ─── ToastContainer ───────────────────────────────────────────────────────────
// Renderiza todos los toasts activos en la esquina inferior derecha
function ToastContainer({ toasts, onClose }) {
  if (toasts.length === 0) return null

  return (
    <>
      <div style={{
        position: 'fixed',
        bottom: '24px', right: '24px',
        display: 'flex', flexDirection: 'column', gap: '8px',
        zIndex: 100,
      }}>
        {toasts.map(t => (
          <ToastItem key={t.id} {...t} onClose={onClose} />
        ))}
      </div>

      {/* Animación CSS */}
      <style>{`
        @keyframes toastEntrada {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </>
  )
}

// ─── Hook principal ───────────────────────────────────────────────────────────
// Uso:
//   const { toast, Toasts } = useToast()
//   toast.success('Guardado correctamente')
//   toast.error('Error al eliminar')
//   toast.warning('Stock bajo')
//   toast.info('Recuerda liquidar el depósito')
//
//   // En el JSX del componente:
//   <Toasts />

export function useToast(duracion = 3500) {
  const [toasts, setToasts] = useState([])

  const cerrar = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const agregar = useCallback((tipo, mensaje) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, tipo, mensaje }])
    // Se cierra solo después de `duracion` ms
    setTimeout(() => cerrar(id), duracion)
  }, [cerrar, duracion])

  // Atajos por tipo
  const toast = {
    success: (msg) => agregar('success', msg),
    error:   (msg) => agregar('error',   msg),
    warning: (msg) => agregar('warning', msg),
    info:    (msg) => agregar('info',    msg),
  }

  // Componente listo para poner en el JSX
  const Toasts = () => <ToastContainer toasts={toasts} onClose={cerrar} />

  return { toast, Toasts }
}