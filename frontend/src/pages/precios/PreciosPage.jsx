import { useEffect, useState } from 'react'
import { getPrecios, createPrecio, updatePrecio, deletePrecio } from '../../api/precios'
import { getTiposCafe } from '../../api/inventario'
import PrecioModal from '../../components/precios/PrecioModal'

export default function PreciosPage() {
  const [precios, setPrecios] = useState([])
  const [tiposCafe, setTiposCafe] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [precioEditando, setPrecioEditando] = useState(null)
  const [filtroFecha, setFiltroFecha] = useState('')

  const cargarPrecios = () => {
    setLoading(true)
    getPrecios()
      .then(res => setPrecios(res.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    cargarPrecios()
    getTiposCafe().then(res => setTiposCafe(res.data))
  }, [])

  const handleNuevo = () => {
    setPrecioEditando(null)
    setModalOpen(true)
  }

  const handleEditar = (precio) => {
    setPrecioEditando(precio)
    setModalOpen(true)
  }

  const handleEliminar = async (id) => {
    if (!confirm('¿Eliminar este precio?')) return
    try {
      await deletePrecio(id)
      cargarPrecios()
    } catch {
      alert('No se pudo eliminar.')
    }
  }

  const handleSubmit = async (form) => {
    if (precioEditando) await updatePrecio(precioEditando.id, form)
    else await createPrecio(form)
    cargarPrecios()
  }

  // Filtra por fecha si hay filtro activo
  const preciosFiltrados = precios.filter(p =>
    filtroFecha ? p.fecha === filtroFecha : true
  )

  // Fecha de hoy en formato YYYY-MM-DD para el filtro rápido
  const hoy = new Date().toISOString().split('T')[0]

  return (
    <div>
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Precios Diarios</h2>
          <p className="text-gray-500 text-sm mt-1">Precio del café por tipo y fecha</p>
        </div>
        <button
          onClick={handleNuevo}
          className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 font-medium"
        >
          + Nuevo Precio
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow p-4 mb-6 flex gap-4 items-end flex-wrap">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Filtrar por fecha</label>
          <input
            type="date"
            value={filtroFecha}
            onChange={e => setFiltroFecha(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <button
          onClick={() => setFiltroFecha(hoy)}
          className="px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 text-sm font-medium"
        >
          Ver precios de hoy
        </button>
        {filtroFecha && (
          <button
            onClick={() => setFiltroFecha('')}
            className="px-4 py-2 text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm"
          >
            Limpiar filtro
          </button>
        )}
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
                <th className="px-6 py-3 text-left">Tipo de Café</th>
                <th className="px-6 py-3 text-left">Precio / kg</th>
                <th className="px-6 py-3 text-left">Nota</th>
                <th className="px-6 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {preciosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    No hay precios registrados
                    {filtroFecha && ' para esta fecha'}
                  </td>
                </tr>
              ) : (
                preciosFiltrados.map(p => (
                  <tr key={p.id} className="border-t hover:bg-gray-50">
                    <td className="px-6 py-3 text-gray-400">{p.id}</td>
                    <td className="px-6 py-3 font-medium">{p.fecha}</td>
                    <td className="px-6 py-3">
                      <span className="px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold">
                        {p.tipo_cafe_nombre}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-bold text-gray-800">
                      ${Number(p.precio).toLocaleString('es-CO')}
                    </td>
                    <td className="px-6 py-3 text-gray-500">{p.nota || '—'}</td>
                    <td className="px-6 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditar(p)}
                          className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleEliminar(p.id)}
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

      {/* Modal */}
      {modalOpen && (
        <PrecioModal
          precio={precioEditando}
          tiposCafe={tiposCafe}
          onClose={() => setModalOpen(false)}
          onSaved={cargarPrecios}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}