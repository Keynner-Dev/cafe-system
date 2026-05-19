import { useState, useEffect } from 'react'
import { createTercero, updateTercero } from '../../api/terceros'

const initialForm = {
  nombre: '',
  tipo: 'cliente',
  telefono: '',
  direccion: '',
  activo: true,
}

export default function TerceroModal({ tercero, onClose, onSaved }) {
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Si viene un tercero, es edición — cargamos sus datos
  useEffect(() => {
    if (tercero) setForm(tercero)
    else setForm(initialForm)
  }, [tercero])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (tercero) {
        await updateTercero(tercero.id, form)
      } else {
        await createTercero(form)
      }
      onSaved() // Recarga la lista
      onClose() // Cierra el modal
    } catch (err) {
      setError('Error al guardar. Verifica los datos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">

        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">
            {tercero ? 'Editar Tercero' : 'Nuevo Tercero'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Nombre completo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
            <select
              name="tipo"
              value={form.tipo}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="cliente">Cliente</option>
              <option value="proveedor">Proveedor</option>
              <option value="ambos">Ambos</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input
              name="telefono"
              value={form.telefono || ''}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Ej: 3001234567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
            <textarea
              name="direccion"
              value={form.direccion || ''}
              onChange={handleChange}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Dirección"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="activo"
              id="activo"
              checked={form.activo}
              onChange={handleChange}
              className="w-4 h-4 accent-green-600"
            />
            <label htmlFor="activo" className="text-sm font-medium text-gray-700">Activo</label>
          </div>

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
              className="flex-1 px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}