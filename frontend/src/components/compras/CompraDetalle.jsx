import { formatCOP } from "../../utils/format";

export default function CompraDetalle({ compra, onClose, onLiquidar }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-screen overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-800">
              Compra #{compra.id}
            </h3>
            <p className="text-gray-500 text-sm">
              {compra.fecha} — {compra.proveedor_nombre}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            &times;
          </button>
        </div>

        <div className="space-y-3">
          {compra.detalles.map((d) => (
            <div
              key={d.id}
              className={`border rounded-lg p-4 ${d.es_deposito ? "border-yellow-200 bg-yellow-50" : "border-gray-200 bg-gray-50"}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-800">
                    {d.tipo_cafe_nombre}
                  </p>
                  <p className="text-sm text-gray-500">{d.bodega_nombre}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {d.kilos} kg
                    {d.precio_kilo &&
                      ` × $${Number(d.precio_kilo).toLocaleString("es-CO")}/kg`}
                  </p>
                </div>

                <div className="text-right">
                  {d.es_deposito ? (
                    <div>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold block mb-2">
                        Depósito
                      </span>
                      <p className="text-xs text-gray-500">
                        Pendiente: {d.kilos_pendientes_liquidar} kg
                      </p>
                      {Number(d.kilos_pendientes_liquidar) > 0 && (
                        <button
                          onClick={() => onLiquidar(d)}
                          className="mt-2 px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600"
                        >
                          Liquidar
                        </button>
                      )}
                      {Number(d.kilos_pendientes_liquidar) <= 0 && (
                        <span className="mt-2 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold block">
                          Liquidado ✓
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="font-bold text-gray-800">
                      $
                      {(Number(d.kilos) * Number(d.precio_kilo)).toLocaleString(
                        "es-CO",
                      )}
                    </span>
                  )}
                </div>
              </div>

              {/* Liquidaciones previas */}
              {d.es_deposito && d.liquidaciones?.length > 0 && (
                <div className="mt-3 border-t border-yellow-200 pt-3">
                  <p className="text-xs font-semibold text-gray-500 mb-2">
                    Liquidaciones:
                  </p>
                  {d.liquidaciones.map((l) => (
                    <div
                      key={l.id}
                      className="flex justify-between text-xs text-gray-600"
                    >
                      <span>
                        {l.fecha} — {l.kilos} kg × $
                        {Number(l.precio_kilo).toLocaleString("es-CO")}/kg
                      </span>
                      <span className="font-semibold">
                        ${Number(l.subtotal).toLocaleString("es-CO")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Totales */}
        <div className="mt-6 bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Total pagado (normal + liquidaciones):</span>
            <span className="font-bold text-gray-800">
              ${Number(compra.total).toLocaleString("es-CO")}
            </span>
          </div>
          {compra.tiene_deposito_pendiente && (
            <div className="flex justify-between text-sm text-yellow-600">
              <span>Kilos en depósito pendientes:</span>
              <span className="font-semibold">
                {Number(compra.kilos_deposito_pendiente).toLocaleString(
                  "es-CO",
                )}{" "}
                kg
              </span>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
