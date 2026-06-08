import { useEffect, useState } from 'react'
import { getCompras, deleteCompra } from '../../api/compras'
import CompraModal from '../../components/compras/CompraModal'
import LiquidacionModal from '../../components/compras/LiquidacionModal'
import CompraDetalle from '../../components/compras/CompraDetalle'

const IconPlus = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)
const IconEye = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)
const IconTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" /><path d="M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
)

function BadgeDeposito({ tiene, kilos }) {
  if (tiene) {
    return (
      <span style={{
        background: '#fefce8', color: '#ca8a04',
        fontSize: '11px', fontWeight: 600,
        padding: '2px 8px', borderRadius: '99px',
        whiteSpace: 'nowrap',
      }}>
        {Number(kilos).toLocaleString('es-CO')} kg pendientes
      </span>
    )
  }
  return (
    <span style={{
      background: '#f0fdf4', color: '#16a34a',
      fontSize: '11px', fontWeight: 600,
      padding: '2px 8px', borderRadius: '99px',
    }}>
      Al día
    </span>
  )
}

export default function ComprasPage() {
  const [compras, setCompras]                         = useState([])
  const [loading, setLoading]                         = useState(true)
  const [modalOpen, setModalOpen]                     = useState(false)
  const [liquidacionOpen, setLiquidacionOpen]         = useState(false)
  const [detalleOpen, setDetalleOpen]                 = useState(false)
  const [compraSeleccionada, setCompraSeleccionada]   = useState(null)
  const [detalleSeleccionado, setDetalleSeleccionado] = useState(null)

  const cargarCompras = () => {
    setLoading(true)
    getCompras()
      .then(res => setCompras(res.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargarCompras() }, [])

  const handleVerDetalle = (compra) => {
    setCompraSeleccionada(compra)
    setDetalleOpen(true)
  }

  const handleLiquidar = (detalle) => {
    setDetalleSeleccionado(detalle)
    setLiquidacionOpen(true)
  }

  const handleEliminar = async (id) => {
    if (!confirm('¿Eliminar esta compra? También se eliminarán sus movimientos de inventario.')) return
    try {
      await deleteCompra(id)
      cargarCompras()
    } catch {
      alert('No se pudo eliminar.')
    }
  }

  const formatCOP = (val) => `$${Number(val || 0).toLocaleString('es-CO')}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── Encabezado ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
            Compras
          </h1>
          <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>
            Registro de compras de café y gestión de depósitos
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
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
          <IconPlus /> Nueva compra
        </button>
      </div>

      {/* ── Tabla ── */}
      {loading ? (
        <div style={{ color: '#94a3b8', fontSize: '13px', padding: '20px 0' }}>
          Cargando compras...
        </div>
      ) : (
        <div style={{
          background: 'white', border: '1px solid #e2e8f0',
          borderRadius: '10px', overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#0f172a' }}>
                {/* ← 'Caficultor' en vez de 'Proveedor' */}
                {['#', 'Fecha', 'Caficultor', 'Total', 'Depósito', 'Acciones'].map(col => (
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
              {compras.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{
                    padding: '40px', textAlign: 'center',
                    color: '#94a3b8', fontSize: '13px',
                  }}>
                    No hay compras registradas aún.
                  </td>
                </tr>
              ) : (
                compras.map(c => (
                  <tr
                    key={c.id}
                    style={{ borderTop: '1px solid #f1f5f9', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'white'}
                  >
                    <td style={{ padding: '11px 16px', color: '#94a3b8' }}>{c.id}</td>
                    <td style={{ padding: '11px 16px', fontWeight: 500, color: '#0f172a' }}>{c.fecha}</td>
                    {/* ← caficultor_nombre en vez de proveedor_nombre */}
                    <td style={{ padding: '11px 16px', color: '#475569' }}>{c.caficultor_nombre}</td>
                    <td style={{ padding: '11px 16px', fontWeight: 600, color: '#0f172a' }}>
                      {formatCOP(c.total)}
                    </td>
                    <td style={{ padding: '11px 16px' }}>
                      <BadgeDeposito
                        tiene={c.tiene_deposito_pendiente}
                        kilos={c.kilos_deposito_pendiente}
                      />
                    </td>
                    <td style={{ padding: '11px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => handleVerDetalle(c)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '4px',
                            padding: '5px 10px', borderRadius: '5px', border: 'none',
                            background: '#eff6ff', color: '#2563eb',
                            fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#dbeafe'}
                          onMouseLeave={e => e.currentTarget.style.background = '#eff6ff'}
                        >
                          <IconEye /> Ver
                        </button>
                        <button
                          onClick={() => handleEliminar(c.id)}
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

          {compras.length > 0 && (
            <div style={{
              padding: '10px 16px', borderTop: '1px solid #f1f5f9',
              color: '#94a3b8', fontSize: '12px',
            }}>
              {compras.length} compra(s) registrada(s)
            </div>
          )}
        </div>
      )}

      {/* ── Modales ── */}
      {modalOpen && (
        <CompraModal onClose={() => setModalOpen(false)} onSaved={cargarCompras} />
      )}
      {detalleOpen && compraSeleccionada && (
        <CompraDetalle
          compra={compraSeleccionada}
          onClose={() => setDetalleOpen(false)}
          onLiquidar={handleLiquidar}
        />
      )}
      {liquidacionOpen && detalleSeleccionado && (
        <LiquidacionModal
          detalle={detalleSeleccionado}
          onClose={() => {
            setLiquidacionOpen(false)
            setDetalleOpen(false)
          }}
          onSaved={cargarCompras}
        />
      )}
    </div>
  )
}