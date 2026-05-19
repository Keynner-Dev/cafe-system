import { useEffect, useState } from 'react'
import api from '../../api/axios'

export default function TercerosPage() {
  const [terceros, setTerceros] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/terceros/terceros/')
      .then(res => setTerceros(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Terceros</h2>

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-green-900 text-white">
              <tr>
                <th className="px-6 py-3 text-left">Nombre</th>
                <th className="px-6 py-3 text-left">Tipo</th>
                <th className="px-6 py-3 text-left">Teléfono</th>
                <th className="px-6 py-3 text-left">Estado</th>
              </tr>
            </thead>
            <tbody>
              {terceros.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                    No hay terceros registrados
                  </td>
                </tr>
              ) : (
                terceros.map(t => (
                  <tr key={t.id} className="border-t hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium">{t.nombre}</td>
                    <td className="px-6 py-3 capitalize">{t.tipo}</td>
                    <td className="px-6 py-3">{t.telefono || '—'}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${t.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {t.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}