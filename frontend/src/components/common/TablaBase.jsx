export default function TablaBase({ columnas, datos, onEditar, onEliminar, loading }) {
  if (loading) return <p className="text-gray-500">Cargando...</p>

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-green-900 text-white">
          <tr>
            {columnas.map(col => (
              <th key={col.key} className="px-6 py-3 text-left">{col.label}</th>
            ))}
            <th className="px-6 py-3 text-left">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {datos.length === 0 ? (
            <tr>
              <td colSpan={columnas.length + 1} className="px-6 py-8 text-center text-gray-400">
                No hay registros
              </td>
            </tr>
          ) : (
            datos.map(fila => (
              <tr key={fila.id} className="border-t hover:bg-gray-50">
                {columnas.map(col => (
                  <td key={col.key} className="px-6 py-3">
                    {col.render ? col.render(fila) : fila[col.key] || '—'}
                  </td>
                ))}
                <td className="px-6 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEditar(fila)}
                      className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => onEliminar(fila.id)}
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
  )
}