export default function VentaDetalle({ venta, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">

        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-xs text-gray-400">Remisión</p>
            <h3 className="text-2xl font-bold text-gray-800">{venta.numero_remision}</h3>
            <p className="text-gray-500 text-sm">{venta.fecha} — {venta.cliente_nombre}</p>
            {venta.cuenta && <p className="text-xs text-gray-400">Cuenta: {venta.cuenta}</p>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>

        {/* Mercancía */}
        <div className="mb-4">
          <h4 className="font-semibold text-gray-700 mb-2">☕ Mercancía</h4>
          <div className="bg-gray-50 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-green-900 text-white">
                <tr>
                  <th className="px-4 py-2 text-left">Tipo</th>
                  <th className="px-4 py-2 text-left">Bodega</th>
                  <th className="px-4 py-2 text-right">Bultos</th>
                  <th className="px-4 py-2 text-right">Kilos</th>
                </tr>
              </thead>
              <tbody>
                {venta.detalles.map(d => (
                  <tr key={d.id} className="border-t">
                    <td className="px-4 py-2">{d.tipo_cafe_nombre}</td>
                    <td className="px-4 py-2">{d.bodega_nombre}</td>
                    <td className="px-4 py-2 text-right">{d.bultos}</td>
                    <td className="px-4 py-2 text-right">{Number(d.kilos).toLocaleString('es-CO')} kg</td>
                  </tr>
                ))}
                <tr className="border-t bg-gray-100 font-semibold">
                  <td colSpan={2} className="px-4 py-2">Total</td>
                  <td className="px-4 py-2 text-right">{venta.total_bultos} bultos</td>
                  <td className="px-4 py-2 text-right">{Number(venta.total_kilos).toLocaleString('es-CO')} kg</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Conductor y vehículo */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-700 mb-2">🧑 Conductor</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p><span className="text-gray-400">Nombre:</span> {venta.conductor_nombre}</p>
              <p><span className="text-gray-400">Cédula:</span> {venta.conductor_cedula}</p>
              {venta.conductor_direccion && <p><span className="text-gray-400">Dirección:</span> {venta.conductor_direccion}</p>}
              {venta.conductor_telefono && <p><span className="text-gray-400">Teléfono:</span> {venta.conductor_telefono}</p>}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-700 mb-2">🚛 Vehículo</h4>
            <div className="space-y-1 text-sm text-gray-600">
              {venta.vehiculo_clase && <p><span className="text-gray-400">Clase:</span> {venta.vehiculo_clase}</p>}
              <p><span className="text-gray-400">Placas:</span> {venta.vehiculo_placas}</p>
              {venta.vehiculo_marca && <p><span className="text-gray-400">Marca:</span> {venta.vehiculo_marca}</p>}
              {venta.vehiculo_color && <p><span className="text-gray-400">Color:</span> {venta.vehiculo_color}</p>}
              {venta.vehiculo_modelo && <p><span className="text-gray-400">Modelo:</span> {venta.vehiculo_modelo}</p>}
            </div>
          </div>
        </div>

        {/* Flete */}
        {Number(venta.flete_valor) > 0 && (
          <div className="bg-green-50 rounded-lg p-4 mb-4 flex justify-between items-center">
            <div>
              <p className="font-semibold text-gray-700">💵 Flete</p>
              {venta.flete_pagadero_por && (
                <p className="text-xs text-gray-500">Pagadero por: {venta.flete_pagadero_por}</p>
              )}
            </div>
            <span className="text-xl font-bold text-green-700">
              ${Number(venta.flete_valor).toLocaleString('es-CO')}
            </span>
          </div>
        )}

        {venta.nota && (
          <p className="text-sm text-gray-500 mb-4">Nota: {venta.nota}</p>
        )}

        <button onClick={onClose}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
          Cerrar
        </button>
      </div>
    </div>
  )
}