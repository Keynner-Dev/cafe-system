import { useState } from 'react'
import { solicitarEliminacionCompra } from '../../api/compras'

const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  border: '1px solid #e2e8f0', borderRadius: '6px',
  padding: '8px 12px', fontSize: '13px', color: '#0f172a',
  outline: 'none', background: 'white', resize: 'vertical', minHeight: '90px',
}
const labelStyle = {
  display: 'block', fontSize: '12px', fontWeight: 500,
  color: '#475569', marginBottom: '5px',
}

// ── ÍTEM 24: modal para que el administrador solicite la eliminación
// de una compra, explicando el motivo. Jimmi la aprueba o la rechaza
// desde SolicitudesEliminacionModal.jsx. Sin cierre por click en el
// fondo (ítem 13), solo por el botón X o "Cancelar". ──
export default function SolicitarEliminacionModal({ compra, onClose, onSaved }) {
  const [motivo, setMotivo]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [enviado, setEnviado] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!motivo.trim()) { setError('El motivo es obligatorio.'); return }
    setLoading(true)
    setError('')
    try {
      await solicitarEliminacionCompra(compra.id, motivo.trim())
      setEnviado(true)
      onSaved?.()
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo enviar la solicitud.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 60, padding: '16px',
    }}>
      <div style={{
        background: 'white', borderRadius: '12px',
        width: '100%', maxWidth: '440px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          padding: '18px 20px', borderBottom: '1px solid #f1f5f9',
        }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
              Solicitar eliminación
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>
              Compra #{compra.id} — {compra.caficultor_nombre}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '30px', height: '30px', borderRadius: '6px',
              border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8' }}
          >
            <IconX />
          </button>
        </div>

        {enviado ? (
          <div style={{ padding: '24px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: '#16a34a', fontWeight: 600, marginBottom: '6px' }}>
              Solicitud enviada
            </p>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '20px' }}>
              Jimmi la va a revisar. Mientras tanto, esta compra queda marcada
              como "Solicitud pendiente".
            </p>
            <button onClick={onClose} style={{
              width: '100%', padding: '9px', border: 'none', borderRadius: '6px',
              background: '#16a34a', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            }}>
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                background: '#fffbeb', border: '1px solid #fde68a',
                borderRadius: '6px', padding: '10px 12px',
                fontSize: '12px', color: '#92400e',
              }}>
                Solo Jimmi puede eliminar una compra. Esta solicitud queda pendiente
                hasta que él la apruebe o la rechace.
              </div>

              {error && (
                <div style={{
                  background: '#fef2f2', border: '1px solid #fecaca',
                  borderRadius: '6px', padding: '10px 12px',
                  color: '#dc2626', fontSize: '12px',
                }}>
                  {error}
                </div>
              )}

              <div>
                <label style={labelStyle}>Motivo de la eliminación *</label>
                <textarea
                  value={motivo}
                  onChange={e => setMotivo(e.target.value)}
                  placeholder="Explica por qué se debe eliminar esta compra..."
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#16a34a'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  autoFocus
                />
              </div>
            </div>

            <div style={{
              display: 'flex', gap: '10px',
              padding: '16px 20px', borderTop: '1px solid #f1f5f9',
            }}>
              <button type="button" onClick={onClose}
                style={{
                  flex: 1, padding: '9px', border: '1px solid #e2e8f0', borderRadius: '6px',
                  background: 'white', color: '#475569', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button type="submit" disabled={loading}
                style={{
                  flex: 1, padding: '9px', border: 'none', borderRadius: '6px',
                  background: loading ? '#fca5a5' : '#dc2626',
                  color: 'white', fontSize: '13px', fontWeight: 500,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Enviando...' : 'Enviar solicitud'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}