export default function VentaDetalle({ venta, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-screen overflow-y-auto p-6">

        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Venta #{venta.id}</h3>
            <p className="text-gray-500 text-sm">{venta.fecha} — {venta.cliente_nombre}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>

        <div className="space-y-3">
          {venta.detalles.map(d => (
            <div key={d.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-800">{d.tipo_cafe_nombre}</p>
                  <p className="text-sm text-gray-500">{d.bodega_nombre}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {d.kilos} kg × ${Number(d.precio_kilo).toLocaleString('es-CO')}/kg
                  </p>
                </div>
                <span className="font-bold text-gray-800">
                  ${(Number(d.kilos) * Number(d.precio_kilo)).toLocaleString('es-CO')}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="mt-6 bg-green-50 rounded-lg p-4 flex justify-between items-center">
          <span className="font-semibold text-gray-700">Total:</span>
          <span className="text-2xl font-bold text-green-700">
            ${Number(venta.total).toLocaleString('es-CO')}
          </span>
        </div>

        {venta.nota && (
          <p className="mt-4 text-sm text-gray-500">Nota: {venta.nota}</p>
        )}

        <button
          onClick={onClose}
          className="mt-4 w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Cerrar
        </button>
      </div>
    </div>
  )
}