import { useState, useEffect } from 'react'
import { createCompra } from '../../api/compras'
import { getTerceros } from '../../api/terceros'
import { getTiposCafe, getBodegas } from '../../api/inventario'
import { getPreciosHoy } from '../../api/precios'

const hoy = new Date().toISOString().split('T')[0]

const detalleVacio = {
  tipo_cafe: '',
  bodega: '',
  kilos: '',
  precio_kilo: '',
  es_deposito: false,
}

export default function CompraModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ proveedor: '', fecha: hoy, nota: '' })
  const [detalles, setDetalles] = useState([{ ...detalleVacio }])
  const [proveedores, setProveedores] = useState([])
  const [tiposCafe, setTiposCafe] = useState([])
  const [bodegas, setBodegas] = useState([])
  const [preciosHoy, setPreciosHoy] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    getTerceros().then(res =>
      setProveedores(res.data.filter(t => t.tipo === 'proveedor' || t.tipo === 'ambos'))
    )
    getTiposCafe().then(res => setTiposCafe(res.data))
    getBodegas().then(res => setBodegas(res.data))
    getPreciosHoy().then(res => setPreciosHoy(res.data))
  }, [])

  // Cuando se selecciona un tipo de café, autocompleta el precio del día
  const handleDetalleChange = (index, e) => {
    const { name, value, type, checked } = e.target
    const nuevos = [...detalles]
    nuevos[index] = {
      ...nuevos[index],
      [name]: type === 'checkbox' ? checked : value,
    }

    // Autocompletar precio si selecciona tipo de café
    if (name === 'tipo_cafe') {
      const precioHoy = preciosHoy.find(p => String(p.tipo_cafe) === String(value))
      if (precioHoy) {
        nuevos[index].precio_kilo = precioHoy.precio
      }
    }

    // Si marca depósito, limpia el precio
    if (name === 'es_deposito' && checked) {
      nuevos[index].precio_kilo = ''
    }

    setDetalles(nuevos)
  }

  const agregarDetalle = () => setDetalles([...detalles, { ...detalleVacio }])

  const eliminarDetalle = (index) => {
    if (detalles.length === 1) return
    setDetalles(detalles.filter((_, i) => i !== index))
  }

  const totalCompra = detalles.reduce((acc, d) => {
    if (d.es_deposito) return acc
    return acc + (Number(d.kilos) * Number(d.precio_kilo) || 0)
  }, 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validar que los depósitos no tengan precio obligatorio
    for (const d of detalles) {
      if (!d.es_deposito && !d.precio_kilo) {
        setError('Las compras normales requieren precio por kilo.')
        setLoading(false)
        return
      }
    }

    try {
      await createCompra({ ...form, detalles })
      onSaved()
      onClose()
    } catch (err) {
      setError('Error al guardar la compra. Verifica los datos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-screen overflow-y-auto p-6">

        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">Nueva Compra</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Datos generales */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor *</label>
              <select
                value={form.proveedor}
                onChange={e => setForm({ ...form, proveedor: e.target.value })}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Selecciona proveedor</option>
                {proveedores.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
              <input
                type="date"
                value={form.fecha}
                onChange={e => setForm({ ...form, fecha: e.target.value })}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nota</label>
            <textarea
              value={form.nota}
              onChange={e => setForm({ ...form, nota: e.target.value })}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Observación opcional"
            />
          </div>

          {/* Detalles */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-semibold text-gray-700">Detalles de la compra</h4>
              <button
                type="button"
                onClick={agregarDetalle}
                className="px-3 py-1 text-sm bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100"
              >
                + Agregar línea
              </button>
            </div>

            <div className="space-y-3">
              {detalles.map((detalle, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Tipo de café *</label>
                      <select
                        name="tipo_cafe"
                        value={detalle.tipo_cafe}
                        onChange={e => handleDetalleChange(index, e)}
                        required
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">Selecciona</option>
                        {tiposCafe.map(t => (
                          <option key={t.id} value={t.id}>{t.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Bodega *</label>
                      <select
                        name="bodega"
                        value={detalle.bodega}
                        onChange={e => handleDetalleChange(index, e)}
                        required
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">Selecciona</option>
                        {bodegas.map(b => (
                          <option key={b.id} value={b.id}>{b.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Kilos *</label>
                      <input
                        type="number"
                        name="kilos"
                        value={detalle.kilos}
                        onChange={e => handleDetalleChange(index, e)}
                        required
                        min="0"
                        step="0.01"
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Precio/kg {detalle.es_deposito ? '(depósito)' : '*'}
                      </label>
                      <input
                        type="number"
                        name="precio_kilo"
                        value={detalle.precio_kilo}
                        onChange={e => handleDetalleChange(index, e)}
                        disabled={detalle.es_deposito}
                        min="0"
                        step="0.01"
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:text-gray-400"
                        placeholder={detalle.es_deposito ? 'Se fija al liquidar' : '0.00'}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="es_deposito"
                        checked={detalle.es_deposito}
                        onChange={e => handleDetalleChange(index, e)}
                        className="w-4 h-4 accent-yellow-500"
                      />
                      <span className="text-sm text-gray-700">
                        Es depósito
                        <span className="ml-1 text-xs text-gray-400">(liquidar después)</span>
                      </span>
                    </label>

                    <div className="flex items-center gap-3">
                      {!detalle.es_deposito && detalle.kilos && detalle.precio_kilo && (
                        <span className="text-sm font-semibold text-gray-700">
                          Subtotal: ${(Number(detalle.kilos) * Number(detalle.precio_kilo)).toLocaleString('es-CO')}
                        </span>
                      )}
                      {detalle.es_deposito && detalle.kilos && (
                        <span className="text-xs text-yellow-600 font-medium">
                          {detalle.kilos} kg en depósito
                        </span>
                      )}
                      {detalles.length > 1 && (
                        <button
                          type="button"
                          onClick={() => eliminarDetalle(index)}
                          className="text-red-400 hover:text-red-600 text-xs"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="bg-green-50 rounded-lg p-4 flex justify-between items-center">
            <span className="font-semibold text-gray-700">Total a pagar hoy:</span>
            <span className="text-2xl font-bold text-green-700">
              ${totalCompra.toLocaleString('es-CO')}
            </span>
          </div>

          <div className="flex gap-3">
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
              className="flex-1 px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Registrar Compra'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}