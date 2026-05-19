import { useEffect, useState } from 'react'
import { getTerceros, deleteTercero } from '../../api/terceros'
import TerceroModal from '../../components/terceros/TerceroModal'

export default function TercerosPage() {
  const [terceros, setTerceros] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [terceroEditando, setTerceroEditando] = useState(null)
  const [filtro, setFiltro] = useState('')

  const cargarTerceros = () => {
    setLoading(true)
    getTerceros()
      .then(res => setTerceros(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargarTerceros() }, [])

  const handleNuevo = () => {
    setTerceroEditando(null)
    setModalOpen(true)
  }

  const handleEditar = (tercero) => {
    setTerceroEditando(tercero)
    setModalOpen(true)
  }

  const handleEliminar = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este tercero?')) return
    try {
      await deleteTercero(id)
      cargarTerceros()
    } catch {
      alert('No se pudo eliminar. Puede tener registros asociados.')
    }
  }

  const tercerosFiltrados = terceros.filter(t =>
    t.nombre.toLowerCase().includes(filtro.toLowerCase())
  )

  return (
    <div>
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Terceros</h2>
          <p className="text-gray-500 text-sm mt-1">Clientes y proveedores</p>
        </div>
        <button
          onClick={handleNuevo}
          className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 font-medium"
        >
          + Nuevo Tercero
        </button>
      </div>

      {/* Buscador */}
      <div className="mb-4">
        <input
          value={filtro}
          onChange={e => setFiltro(e.target.value)}
          placeholder="Buscar por nombre..."
          className="w-full max-w-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
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
                <th className="px-6 py-3 text-left">Nombre</th>
                <th className="px-6 py-3 text-left">Tipo</th>
                <th className="px-6 py-3 text-left">Teléfono</th>
                <th className="px-6 py-3 text-left">Estado</th>
                <th className="px-6 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tercerosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    No hay terceros registrados
                  </td>
                </tr>
              ) : (
                tercerosFiltrados.map(t => (
                  <tr key={t.id} className="border-t hover:bg-gray-50">
                    <td className="px-6 py-3 text-gray-400">{t.id}</td>
                    <td className="px-6 py-3 font-medium">{t.nombre}</td>
                    <td className="px-6 py-3 capitalize">{t.tipo}</td>
                    <td className="px-6 py-3">{t.telefono || '—'}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${t.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {t.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditar(t)}
                          className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleEliminar(t.id)}
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
        <TerceroModal
          tercero={terceroEditando}
          onClose={() => setModalOpen(false)}
          onSaved={cargarTerceros}
        />
      )}
    </div>
  )
}