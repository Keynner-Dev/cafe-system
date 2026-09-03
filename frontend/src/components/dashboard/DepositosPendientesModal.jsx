import { useEffect, useState } from 'react'
import { getDepositosPendientesDetalle } from '../../api/dashboard'

const formatKg = (val) => `${Number(val || 0).toLocaleString('es-CO')} kg`

const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

// ── ÍTEM 38: modal de detalle para la tarjeta "Depósitos pendientes"
// del Dashboard. Antes de este ítem el dashboard solo exponía el total
// agregado (kilos_pendientes, cantidad) -- este modal consume el
// endpoint nuevo que lista cada depósito individual pendiente de
// liquidar. Como todo modal del sistema: sin cierre por click en el
// fondo (ítem 13), solo por el botón X o "Cerrar". ──
export default function DepositosPendientesModal({ onClose }) {
  const [depositos, setDepositos] = useState([])
  const [loading, setLoading]     = useState(true)
  const [errorCarga, setErrorCarga] = useState(false)

  useEffect(() => {
    getDepositosPendientesDetalle()
      .then(res => {
        setDepositos(res.data)
        setErrorCarga(false)
      })
      .catch(() => setErrorCarga(true))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{
        background: 'white', borderRadius: '12px', width: '520px',
        maxWidth: '92vw', maxHeight: '80vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Cabecera */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid #f1f5f9',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
              Depósitos pendientes de liquidar
            </h2>
            {!loading && !errorCarga && (
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0' }}>
                {depositos.length} depósito(s) pendiente(s)
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#94a3b8', display: 'flex', padding: '4px',
            }}
          >
            <IconX />
          </button>
        </div>

        {/* Cuerpo */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <p style={{ color: '#94a3b8', fontSize: '13px' }}>Cargando...</p>
          ) : errorCarga ? (
            <p style={{ color: '#dc2626', fontSize: '13px' }}>
              No se pudo cargar el detalle. Intenta de nuevo.
            </p>
          ) : depositos.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '13px' }}>
              No hay depósitos pendientes de liquidar.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {depositos.map(d => (
                <div
                  key={d.compra_id}
                  style={{
                    border: '1px solid #e2e8f0', borderRadius: '8px',
                    padding: '12px 14px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                      {d.caficultor}
                    </p>
                    <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0' }}>
                      Compra #{d.compra_id} · {d.bodega} · {d.fecha}
                    </p>
                  </div>
                  <span style={{
                    fontSize: '13px', fontWeight: 700, color: '#ea580c',
                    whiteSpace: 'nowrap', marginLeft: '12px',
                  }}>
                    {formatKg(d.kilos_pendientes)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pie */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid #f1f5f9' }}>
          <button
            onClick={onClose}
            style={{
              width: '100%', padding: '9px', borderRadius: '6px',
              border: '1px solid #e2e8f0', background: 'white',
              color: '#475569', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}