import { useEffect, useState } from 'react'
import {
  getTiposCafe, createTipoCafe, updateTipoCafe, deleteTipoCafe,
  getBodegas, createBodega, updateBodega, deleteBodega,
  getStock
} from '../../api/inventario'
import ItemModal from '../../components/inventario/ItemModal'
import TablaBase from '../../components/common/TablaBase'

const TABS = ['Tipos de Café', 'Bodegas', 'Stock']

const camposTipoCafe = [
  { name: 'nombre', label: 'Nombre', required: true, placeholder: 'Ej: Café seco' },
  { name: 'descripcion', label: 'Descripción', type: 'textarea', placeholder: 'Descripción opcional' },
]

const camposBodega = [
  { name: 'nombre', label: 'Nombre', required: true, placeholder: 'Ej: San Joaquín' },
  { name: 'ubicacion', label: 'Ubicación', placeholder: 'Ej: Carretera principal km 3' },
]

export default function InventarioPage() {
  const [tabActiva, setTabActiva] = useState('Tipos de Café')

  // Tipos de café
  const [tiposCafe, setTiposCafe] = useState([])
  const [loadingTipos, setLoadingTipos] = useState(true)

  // Bodegas
  const [bodegas, setBodegas] = useState([])
  const [loadingBodegas, setLoadingBodegas] = useState(true)

  // Stock
  const [stock, setStock] = useState(null)
  const [filtroBodega, setFiltroBodega] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [loadingStock, setLoadingStock] = useState(false)

  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [itemEditando, setItemEditando] = useState(null)

  // ── Cargas ──
  const cargarTipos = () => {
    setLoadingTipos(true)
    getTiposCafe()
      .then(res => setTiposCafe(res.data))
      .finally(() => setLoadingTipos(false))
  }

  const cargarBodegas = () => {
    setLoadingBodegas(true)
    getBodegas()
      .then(res => setBodegas(res.data))
      .finally(() => setLoadingBodegas(false))
  }

  const consultarStock = () => {
    setLoadingStock(true)
    const params = {}
    if (filtroBodega) params.bodega = filtroBodega
    if (filtroTipo) params.tipo_cafe = filtroTipo
    getStock(params)
      .then(res => setStock(res.data))
      .finally(() => setLoadingStock(false))
  }

  useEffect(() => {
    cargarTipos()
    cargarBodegas()
  }, [])

  // ── Acciones Tipos de Café ──
  const handleSubmitTipo = async (form) => {
    if (itemEditando) await updateTipoCafe(itemEditando.id, form)
    else await createTipoCafe(form)
    cargarTipos()
  }

  const handleEliminarTipo = async (id) => {
    if (!confirm('¿Eliminar este tipo de café?')) return
    try {
      await deleteTipoCafe(id)
      cargarTipos()
    } catch {
      alert('No se puede eliminar. Tiene registros asociados.')
    }
  }

  // ── Acciones Bodegas ──
  const handleSubmitBodega = async (form) => {
    if (itemEditando) await updateBodega(itemEditando.id, form)
    else await createBodega(form)
    cargarBodegas()
  }

  const handleEliminarBodega = async (id) => {
    if (!confirm('¿Eliminar esta bodega?')) return
    try {
      await deleteBodega(id)
      cargarBodegas()
    } catch {
      alert('No se puede eliminar. Tiene registros asociados.')
    }
  }

  const handleEditar = (item) => {
    setItemEditando(item)
    setModalOpen(true)
  }

  const handleNuevo = () => {
    setItemEditando(null)
    setModalOpen(true)
  }

  // ── Columnas ──
  const columnasTipos = [
    { key: 'id', label: '#' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'descripcion', label: 'Descripción' },
    {
      key: 'activo', label: 'Estado',
      render: (fila) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${fila.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {fila.activo ? 'Activo' : 'Inactivo'}
        </span>
      )
    },
  ]

  const columnasBodegas = [
    { key: 'id', label: '#' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'ubicacion', label: 'Ubicación' },
    {
      key: 'activo', label: 'Estado',
      render: (fila) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${fila.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {fila.activo ? 'Activo' : 'Inactivo'}
        </span>
      )
    },
  ]

  return (
    <div>
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Inventario</h2>
          <p className="text-gray-500 text-sm mt-1">Tipos de café, bodegas y stock</p>
        </div>
        {tabActiva !== 'Stock' && (
          <button
            onClick={handleNuevo}
            className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 font-medium"
          >
            + {tabActiva === 'Tipos de Café' ? 'Nuevo Tipo' : 'Nueva Bodega'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setTabActiva(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tabActiva === tab
                ? 'border-green-700 text-green-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Contenido por tab */}
      {tabActiva === 'Tipos de Café' && (
        <TablaBase
          columnas={columnasTipos}
          datos={tiposCafe}
          loading={loadingTipos}
          onEditar={handleEditar}
          onEliminar={handleEliminarTipo}
        />
      )}

      {tabActiva === 'Bodegas' && (
        <TablaBase
          columnas={columnasBodegas}
          datos={bodegas}
          loading={loadingBodegas}
          onEditar={handleEditar}
          onEliminar={handleEliminarBodega}
        />
      )}

      {tabActiva === 'Stock' && (
        <div>
          {/* Filtros */}
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <h3 className="font-semibold text-gray-700 mb-4">Consultar Stock</h3>
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-48">
                <label className="block text-sm text-gray-600 mb-1">Bodega</label>
                <select
                  value={filtroBodega}
                  onChange={e => setFiltroBodega(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Todas las bodegas</option>
                  {bodegas.map(b => (
                    <option key={b.id} value={b.id}>{b.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-48">
                <label className="block text-sm text-gray-600 mb-1">Tipo de Café</label>
                <select
                  value={filtroTipo}
                  onChange={e => setFiltroTipo(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Todos los tipos</option>
                  {tiposCafe.map(t => (
                    <option key={t.id} value={t.id}>{t.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={consultarStock}
                  disabled={loadingStock}
                  className="px-6 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-50"
                >
                  {loadingStock ? 'Consultando...' : 'Consultar'}
                </button>
              </div>
            </div>
          </div>

          {/* Resultado */}
          {stock && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Total Entradas', value: `${stock.entradas} kg`, color: 'bg-blue-500' },
                { label: 'Total Salidas', value: `${stock.salidas} kg`, color: 'bg-red-500' },
                { label: 'Stock Actual', value: `${stock.stock_actual} kg`, color: 'bg-green-500' },
              ].map(card => (
                <div key={card.label} className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
                  <div className={`${card.color} w-12 h-12 rounded-full flex items-center justify-center text-white text-xl`}>
                    📦
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">{card.label}</p>
                    <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <ItemModal
          titulo={tabActiva === 'Tipos de Café' ? 'Tipo de Café' : 'Bodega'}
          item={itemEditando}
          campos={tabActiva === 'Tipos de Café' ? camposTipoCafe : camposBodega}
          onClose={() => setModalOpen(false)}
          onSubmit={tabActiva === 'Tipos de Café' ? handleSubmitTipo : handleSubmitBodega}
        />
      )}
    </div>
  )
}