import { useEffect, useState } from "react";
import { getVentas, deleteVenta } from "../../api/ventas";
import VentaModal from "../../components/ventas/VentaModal";
import VentaDetalle from "../../components/ventas/VentaDetalle";

export default function VentasPage() {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);

  const cargarVentas = () => {
    setLoading(true);
    getVentas()
      .then((res) => setVentas(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargarVentas() }, []);

  const handleVerDetalle = (venta) => {
    setVentaSeleccionada(venta);
    setDetalleOpen(true);
  };

  const handleEliminar = async (id) => {
    if (!confirm("¿Eliminar esta venta? También se eliminarán sus movimientos.")) return;
    try {
      await deleteVenta(id);
      cargarVentas();
    } catch {
      alert("No se pudo eliminar.");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Ventas</h2>
          <p className="text-gray-500 text-sm mt-1">Registro de ventas de café</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 font-medium"
        >
          + Nueva Venta
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-green-900 text-white">
              <tr>
                <th className="px-6 py-3 text-left">Remisión</th>
                <th className="px-6 py-3 text-left">Fecha</th>
                <th className="px-6 py-3 text-left">Cliente</th>
                <th className="px-6 py-3 text-left">Kilos</th>
                <th className="px-6 py-3 text-left">Bultos</th>
                <th className="px-6 py-3 text-left">Flete</th>
                <th className="px-6 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ventas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                    No hay ventas registradas
                  </td>
                </tr>
              ) : (
                ventas.map((v) => (
                  <tr key={v.id} className="border-t hover:bg-gray-50">
                    <td className="px-6 py-3 font-mono font-semibold text-green-700">
                      {v.numero_remision}
                    </td>
                    <td className="px-6 py-3">{v.fecha}</td>
                    <td className="px-6 py-3">{v.cliente_nombre}</td>
                    <td className="px-6 py-3">
                      {Number(v.total_kilos).toLocaleString("es-CO")} kg
                    </td>
                    <td className="px-6 py-3">{v.total_bultos}</td>
                    <td className="px-6 py-3">
                      ${Number(v.flete_valor || 0).toLocaleString("es-CO")}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleVerDetalle(v)}
                          className="px-3 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100"
                        >
                          Ver
                        </button>
                        <button
                          onClick={() => handleEliminar(v.id)}
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

      {modalOpen && (
        <VentaModal
          onClose={() => setModalOpen(false)}
          onSaved={cargarVentas}
        />
      )}

      {detalleOpen && ventaSeleccionada && (
        <VentaDetalle
          venta={ventaSeleccionada}
          onClose={() => setDetalleOpen(false)}
        />
      )}
    </div>
  );
}