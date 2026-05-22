import { useEffect, useState } from 'react'
import { getCompras, deleteCompra } from '../../api/compras'
import CompraModal from '../../components/compras/CompraModal'
import LiquidacionModal from '../../components/compras/LiquidacionModal'
import CompraDetalle from '../../components/compras/CompraDetalle'

export default function ComprasPage() {
  const [compras, setCompras] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [liquidacionOpen, setLiquidacionOpen] = useState(false)
  const [detalleOpen, setDetalleOpen] = useState(false)
  const [compraSeleccionada, setCompraSeleccionada] = useState(null)
  const [detalleSeleccionado, setDetalleSeleccionado] = useState(null)

  const cargarCompras = () => {
    setLoading(true)
    getCompras()
      .then(res => setCompras(res.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargarCompras() }, [])

  const handleNuevo = () => {
    setCompraSeleccionada(null)
    setModalOpen(true)
  }

  const handleVerDetalle = (compra) => {
    setCompraSeleccionada(compra)
    setDetalleOpen(true)
  }

  const handleLiquidar = (detalle) => {
    setDetalleSeleccionado(detalle)
    setLiquidacionOpen(true)
  }

  const handleEliminar = async (id) => {
    if (!confirm('¿Eliminar esta compra? También se eliminarán sus movimientos.')) return
    try {
      await deleteCompra(id)
      cargarCompras()
    } catch {
      alert('No se pudo eliminar.')
    }
  }

  const formatCOP = (val) => `$${Number(val || 0).toLocaleString('es-CO')}`

  return (
    <div>
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Compras</h2>
          <p className="text-gray-500 text-sm mt-1">Registro de compras de café</p>
        </div>
        <button
          onClick={handleNuevo}
          className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 font-medium"
        >
          + Nueva Compra
        </button>
      </div>

      {/* Tabla */}
      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-green-900 text-white">
              <tr>
                <th className="px-6 py-3 text-left">#</th>
                <th className="px-6 py-3 text-left">Fecha</th>
                <th className="px-6 py-3 text-left">Proveedor</th>
                <th className="px-6 py-3 text-left">Total</th>
                <th className="px-6 py-3 text-left">Depósito pendiente</th>
                <th className="px-6 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {compras.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    No hay compras registradas
                  </td>
                </tr>
              ) : (
                compras.map(c => (
                  <tr key={c.id} className="border-t hover:bg-gray-50">
                    <td className="px-6 py-3 text-gray-400">{c.id}</td>
                    <td className="px-6 py-3 font-medium">{c.fecha}</td>
                    <td className="px-6 py-3">{c.proveedor_nombre}</td>
                    <td className="px-6 py-3 font-bold text-gray-800">
                      {formatCOP(c.total)}
                    </td>
                    <td className="px-6 py-3">
                      {Number(c.total_deposito_pendiente) > 0 ? (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                          {formatCOP(c.total_deposito_pendiente)} pendiente
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                          Al día
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleVerDetalle(c)}
                          className="px-3 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100"
                        >
                          Ver
                        </button>
                        <button
                          onClick={() => handleEliminar(c.id)}
                          className="px-3 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal nueva compra */}
      {modalOpen && (
        <CompraModal
          onClose={() => setModalOpen(false)}
          onSaved={cargarCompras}
        />
      )}

      {/* Modal detalle compra */}
      {detalleOpen && compraSeleccionada && (
        <CompraDetalle
          compra={compraSeleccionada}
          onClose={() => setDetalleOpen(false)}
          onLiquidar={handleLiquidar}
          onSaved={cargarCompras}
        />
      )}

      {/* Modal liquidación */}
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