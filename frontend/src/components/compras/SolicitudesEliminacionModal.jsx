import { useEffect, useState } from 'react'
import { getSolicitudesEliminacion, aprobarSolicitudEliminacion, rechazarSolicitudEliminacion } from '../../api/compras'

const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const formatCOP = (val) => `$${Number(val || 0).toLocaleString('es-CO')}`

// ── ÍTEM 24: modal donde Jimmi ve todas las solicitudes de eliminación
// (pendientes por defecto) y las aprueba o rechaza. Al aprobar, el
// backend anula la compra de forma segura (revierte inventario, caja
// y WAC) o devuelve un motivo claro por el que no se pudo (depósitos
// ya liquidados, abonos a letra, o stock insuficiente) -- ese mensaje
// se muestra tal cual, no se reemplaza por uno genérico. Sin cierre por
// click en el fondo (ítem 13), solo por el botón X o "Cerrar". ──
export default function SolicitudesEliminacionModal({ onClose, onResuelto }) {
  const [solicitudes, setSolicitudes] = useState([])
  const [loading, setLoading]         = useState(true)
  const [errorCarga, setErrorCarga]   = useState(false)
  const [filtroEstado, setFiltroEstado] = useState('pendiente')
  const [procesandoId, setProcesandoId] = useState(null)
  const [errorPorId, setErrorPorId]     = useState({})
  const [rechazandoId, setRechazandoId] = useState(null)
  const [motivoRechazo, setMotivoRechazo] = useState('')

  const cargar = () => {
    setLoading(true)
    getSolicitudesEliminacion(filtroEstado ? { estado: filtroEstado } : {})
      .then(res => {
        setSolicitudes(res.data.results ?? res.data)
        setErrorCarga(false)
      })
      .catch(() => setErrorCarga(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    cargar()
  }, [filtroEstado])

  const handleAprobar = async (id) => {
    setProcesandoId(id)
    setErrorPorId(prev => ({ ...prev, [id]: null }))
    try {
      await aprobarSolicitudEliminacion(id)
      cargar()
      onResuelto?.()
    } catch (err) {
      setErrorPorId(prev => ({ ...prev, [id]: err.response?.data?.detail || 'No se pudo aprobar.' }))
    } finally {
      setProcesandoId(null)
    }
  }

  const handleAbrirRechazar = (id) => {
    setRechazandoId(id)
    setMotivoRechazo('')
  }

  const handleConfirmarRechazo = async (id) => {
    setProcesandoId(id)
    try {
      await rechazarSolicitudEliminacion(id, motivoRechazo.trim())
      setRechazandoId(null)
      cargar()
      onResuelto?.()
    } catch {
      setErrorPorId(prev => ({ ...prev, [id]: 'No se pudo rechazar.' }))
    } finally {
      setProcesandoId(null)
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
        width: '100%', maxWidth: '640px',
        maxHeight: '85vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '18px 20px', borderBottom: '1px solid #f1f5f9',
          position: 'sticky', top: 0, background: 'white', zIndex: 1,
        }}>
          <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
            Solicitudes de eliminación
          </h2>
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

        <div style={{ padding: '14px 20px 0', display: 'flex', gap: '6px' }}>
          {[
            { valor: 'pendiente', label: 'Pendientes' },
            { valor: 'aprobada',  label: 'Aprobadas' },
            { valor: 'rechazada', label: 'Rechazadas' },
            { valor: '',          label: 'Todas' },
          ].map(op => (
            <button
              key={op.valor || 'todas'}
              onClick={() => setFiltroEstado(op.valor)}
              style={{
                padding: '5px 12px', borderRadius: '6px', fontSize: '12px',
                fontWeight: 600, cursor: 'pointer', border: '1px solid',
                background: filtroEstado === op.valor ? '#0f172a' : 'white',
                color: filtroEstado === op.valor ? 'white' : '#475569',
                borderColor: filtroEstado === op.valor ? '#0f172a' : '#e2e8f0',
              }}
            >
              {op.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '16px 20px', flex: 1 }}>
          {loading ? (
            <p style={{ color: '#94a3b8', fontSize: '13px' }}>Cargando...</p>
          ) : errorCarga ? (
            <p style={{ color: '#dc2626', fontSize: '13px' }}>
              No se pudieron cargar las solicitudes.
            </p>
          ) : solicitudes.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '13px' }}>
              No hay solicitudes {filtroEstado ? `en estado "${filtroEstado}"` : ''}.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {solicitudes.map(s => (
                <div key={s.id} style={{
                  border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px',
                  background: s.estado === 'pendiente' ? '#fffbeb' : '#f8fafc',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                        Compra #{s.compra_info.id} — {s.compra_info.caficultor}
                      </p>
                      <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0' }}>
                        {s.compra_info.fecha} · {formatCOP(s.compra_info.total)} · Solicitado por {s.solicitado_por_nombre}
                      </p>
                    </div>
                    <span style={{
                      fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                      padding: '2px 8px', borderRadius: '99px', whiteSpace: 'nowrap',
                      background: s.estado === 'pendiente' ? '#fef9c3' : s.estado === 'aprobada' ? '#dcfce7' : '#fee2e2',
                      color: s.estado === 'pendiente' ? '#92400e' : s.estado === 'aprobada' ? '#15803d' : '#991b1b',
                    }}>
                      {s.estado}
                    </span>
                  </div>

                  <p style={{ fontSize: '12px', color: '#475569', margin: '10px 0 0' }}>
                    <strong>Motivo:</strong> {s.motivo}
                  </p>

                  {s.motivo_rechazo && (
                    <p style={{ fontSize: '12px', color: '#991b1b', margin: '6px 0 0' }}>
                      <strong>Motivo de rechazo:</strong> {s.motivo_rechazo}
                    </p>
                  )}

                  {errorPorId[s.id] && (
                    <div style={{
                      marginTop: '10px', background: '#fef2f2', border: '1px solid #fecaca',
                      borderRadius: '6px', padding: '8px 10px', color: '#dc2626', fontSize: '12px',
                    }}>
                      {errorPorId[s.id]}
                    </div>
                  )}

                  {s.estado === 'pendiente' && (
                    rechazandoId === s.id ? (
                      <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <input
                          value={motivoRechazo}
                          onChange={e => setMotivoRechazo(e.target.value)}
                          placeholder="Motivo del rechazo (opcional)"
                          style={{
                            border: '1px solid #e2e8f0', borderRadius: '6px',
                            padding: '7px 10px', fontSize: '12px', outline: 'none',
                          }}
                          autoFocus
                        />
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => setRechazandoId(null)}
                            style={{
                              flex: 1, padding: '7px', borderRadius: '6px', border: '1px solid #e2e8f0',
                              background: 'white', color: '#475569', fontSize: '12px', cursor: 'pointer',
                            }}
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => handleConfirmarRechazo(s.id)}
                            disabled={procesandoId === s.id}
                            style={{
                              flex: 1, padding: '7px', borderRadius: '6px', border: 'none',
                              background: '#991b1b', color: 'white', fontSize: '12px',
                              fontWeight: 600, cursor: procesandoId === s.id ? 'not-allowed' : 'pointer',
                            }}
                          >
                            Confirmar rechazo
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleAbrirRechazar(s.id)}
                          disabled={procesandoId === s.id}
                          style={{
                            flex: 1, padding: '7px', borderRadius: '6px', border: '1px solid #e2e8f0',
                            background: 'white', color: '#475569', fontSize: '12px', fontWeight: 500,
                            cursor: procesandoId === s.id ? 'not-allowed' : 'pointer',
                          }}
                        >
                          Rechazar
                        </button>
                        <button
                          onClick={() => handleAprobar(s.id)}
                          disabled={procesandoId === s.id}
                          style={{
                            flex: 1, padding: '7px', borderRadius: '6px', border: 'none',
                            background: procesandoId === s.id ? '#86efac' : '#16a34a',
                            color: 'white', fontSize: '12px', fontWeight: 600,
                            cursor: procesandoId === s.id ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {procesandoId === s.id ? 'Procesando...' : 'Aprobar y anular'}
                        </button>
                      </div>
                    )
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: '14px 20px', borderTop: '1px solid #f1f5f9' }}>
          <button onClick={onClose} style={{
            width: '100%', padding: '9px', borderRadius: '6px',
            border: '1px solid #e2e8f0', background: 'white',
            color: '#475569', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
          }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}