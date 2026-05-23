import { useEffect, useState } from 'react'
import { getTiposCafe, getBodegas, trasladar } from '../../api/inventario'

const hoy = new Date().toISOString().split('T')[0]

const initialForm = {
  tipo_cafe: '',
  bodega_origen: '',
  bodega_destino: '',
  kilos: '',
  nota: '',
}

export default function TrasladosPage() {
  const [form, setForm] = useState(initialForm)
  const [tiposCafe, setTiposCafe] = useState([])
  const [bodegas, setBodegas] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [exito, setExito] = useState(null)

  useEffect(() => {
    getTiposCafe().then(res => setTiposCafe(res.data))
    getBodegas().then(res => setBodegas(res.data))
  }, [])

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError(null)
    setExito(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setExito(null)

    try {
      const res = await trasladar(form)
      setExito(res.data.mensaje)
      setForm(initialForm)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al procesar el traslado.')
    } finally {
      setLoading(false)
    }
  }

  const bodegasDestino = bodegas.filter(b => String(b.id) !== String(form.bodega_origen))

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Traslados</h2>
        <p className="text-gray-500 text-sm mt-1">Mover café entre bodegas</p>
      </div>

      <div className="max-w-lg">
        {exito && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            ✅ {exito}
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
            ❌ {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de café *</label>
              <select
                name="tipo_cafe"
                value={form.tipo_cafe}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Selecciona tipo de café</option>
                {tiposCafe.map(t => (
                  <option key={t.id} value={t.id}>{t.nombre}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bodega origen *</label>
                <select
                  name="bodega_origen"
                  value={form.bodega_origen}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Selecciona</option>
                  {bodegas.map(b => (
                    <option key={b.id} value={b.id}>{b.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bodega destino *</label>
                <select
                  name="bodega_destino"
                  value={form.bodega_destino}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Selecciona</option>
                  {bodegasDestino.map(b => (
                    <option key={b.id} value={b.id}>{b.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Flecha visual */}
            {form.bodega_origen && form.bodega_destino && (
              <div className="flex items-center justify-center gap-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-600">
                <span className="font-medium">
                  {bodegas.find(b => String(b.id) === String(form.bodega_origen))?.nombre}
                </span>
                <span className="text-2xl">→</span>
                <span className="font-medium">
                  {bodegas.find(b => String(b.id) === String(form.bodega_destino))?.nombre}
                </span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kilos a trasladar *</label>
              <input
                type="number"
                name="kilos"
                value={form.kilos}
                onChange={handleChange}
                required
                min="0.01"
                step="0.01"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="0.00"
              />
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

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-50 font-medium"
            >
              {loading ? 'Procesando...' : '🚛 Confirmar Traslado'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}