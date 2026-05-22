import { useState } from 'react'
import { createLiquidacion } from '../../api/compras'

const hoy = new Date().toISOString().split('T')[0]

export default function LiquidacionModal({ detalle, onClose, onSaved }) {
  const [form, setForm] = useState({
    detalle_compra: detalle.id,
    kilos: '',
    precio_kilo: '',
    fecha: hoy,
    nota: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (Number(form.kilos) > Number(detalle.kilos_pendientes_liquidar)) {
      setError(`No puedes liquidar más de ${detalle.kilos_pendientes_liquidar} kg disponibles.`)
      setLoading(false)
      return
    }

    try {
      await createLiquidacion(form)
      onSaved()
      onClose()
    } catch {
      setError('Error al registrar la liquidación.')
    } finally {
      setLoading(false)
    }
  }

  const subtotal = Number(form.kilos) * Number(form.precio_kilo) || 0

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">Liquidar Depósito</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>

        {/* Info del depósito */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <p className="text-sm font-semibold text-yellow-800">{detalle.tipo_cafe_nombre}</p>
          <p className="text-xs text-yellow-600">{detalle.bodega_nombre}</p>
          <p className="text-sm text-yellow-700 mt-1">
            Disponible para liquidar: <strong>{detalle.kilos_pendientes_liquidar} kg</strong>
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
            <input
              type="date"
              name="fecha"
              value={form.fecha}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kilos a liquidar * (máx: {detalle.kilos_pendientes_liquidar} kg)
            </label>
            <input
              type="number"
              name="kilos"
              value={form.kilos}
              onChange={handleChange}
              required
              min="0.01"
              max={detalle.kilos_pendientes_liquidar}
              step="0.01"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Precio por kilo *</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-400 font-medium">$</span>
              <input
                type="number"
                name="precio_kilo"
                value={form.precio_kilo}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nota</label>
            <textarea
              name="nota"
              value={form.nota}
              onChange={handleChange}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Observación opcional"
            />
          </div>

          {subtotal > 0 && (
            <div className="bg-green-50 rounded-lg p-3 flex justify-between">
              <span className="text-sm font-medium text-gray-700">Total a pagar:</span>
              <span className="font-bold text-green-700">${subtotal.toLocaleString('es-CO')}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Liquidar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}