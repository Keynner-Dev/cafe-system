import { useState, useEffect, useCallback } from 'react'
import { createVenta } from '../../api/ventas'
import { getTerceros } from '../../api/terceros'
import { getTiposCafe, getBodegas } from '../../api/inventario'

const hoy = new Date().toISOString().split('T')[0]
const detalleVacio = { tipo_cafe: '', bodega: '', bultos: '', kilos: '' }
const initialForm = {
  fecha: hoy, cliente: '', cuenta: '',
  conductor_nombre: '', conductor_cedula: '',
  conductor_direccion: '', conductor_telefono: '',
  vehiculo_clase: '', vehiculo_placas: '',
  vehiculo_marca: '', vehiculo_color: '', vehiculo_modelo: '',
  flete_valor: '', flete_pagadero_por: '', nota: '',
}

function Seccion({ titulo }) {
  return <h4 className="font-semibold text-gray-700 border-b border-gray-200 pb-2 mb-3">{titulo}</h4>
}

export default function VentaModal({ onClose, onSaved }) {
  const [form, setForm] = useState(initialForm)
  const [detalles, setDetalles] = useState([{ ...detalleVacio }])
  const [clientes, setClientes] = useState([])
  const [tiposCafe, setTiposCafe] = useState([])
  const [bodegas, setBodegas] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [submitted, setSubmitted] = useState(false) // ← control anti-duplicado

  useEffect(() => {
    getTerceros().then(res =>
      setClientes(res.data.filter(t => t.tipo === 'cliente' || t.tipo === 'ambos'))
    )
    getTiposCafe().then(res => setTiposCafe(res.data))
    getBodegas().then(res => setBodegas(res.data))
  }, [])

  const handleChange = useCallback((e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }, [])

  const handleDetalleChange = useCallback((index, e) => {
    const { name, value } = e.target
    setDetalles(prev => {
      const nuevos = [...prev]
      nuevos[index] = { ...nuevos[index], [name]: value }
      return nuevos
    })
  }, [])

  const agregarDetalle = useCallback(() => {
    setDetalles(prev => [...prev, { ...detalleVacio }])
  }, [])

  const eliminarDetalle = useCallback((i) => {
    setDetalles(prev => prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i))
  }, [])

  const totalKilos = detalles.reduce((acc, d) => acc + (Number(d.kilos) || 0), 0)
  const totalBultos = detalles.reduce((acc, d) => acc + (Number(d.bultos) || 0), 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    // Anti-duplicado: si ya se envió o está cargando, no hacer nada
    if (loading || submitted) return
    setSubmitted(true)
    setLoading(true)
    setError(null)

    try {
      await createVenta({ ...form, detalles })
      onSaved()
      onClose()
    } catch (err) {
      setSubmitted(false) // permite reintentar si hay error
      const data = err.response?.data
      if (data?.stock) setError(data.stock.join(' | '))
      else setError('Error al guardar. Verifica los datos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">

        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Nueva Remisión</h3>
            <p className="text-xs text-gray-400">El número se genera automáticamente</p>
          </div>
          <button type="button" onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl">&times;
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          <Seccion titulo="📋 Datos generales" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Fecha *</label>
              <input type="date" name="fecha" value={form.fecha}
                onChange={handleChange} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Cliente *</label>
              <select name="cliente" value={form.cliente}
                onChange={handleChange} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Selecciona cliente</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-600 mb-1">Cuenta</label>
              <input type="text" name="cuenta" value={form.cuenta}
                onChange={handleChange} placeholder="Ej: SMS, CP, Practices..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <Seccion titulo="☕ Mercancía" />
          <div className="space-y-3">
            {detalles.map((d, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Tipo de café *</label>
                    <select name="tipo_cafe" value={d.tipo_cafe}
                      onChange={e => handleDetalleChange(i, e)} required
                      className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Selecciona</option>
                      {tiposCafe.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Bodega *</label>
                    <select name="bodega" value={d.bodega}
                      onChange={e => handleDetalleChange(i, e)} required
                      className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Selecciona</option>
                      {bodegas.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Bultos *</label>
                    <input type="number" name="bultos" value={d.bultos}
                      onChange={e => handleDetalleChange(i, e)} required min="1"
                      className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Kilos *</label>
                    <input type="number" name="kilos" value={d.kilos}
                      onChange={e => handleDetalleChange(i, e)} required min="0.01" step="0.01"
                      className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                {detalles.length > 1 && (
                  <div className="flex justify-end mt-2">
                    <button type="button" onClick={() => eliminarDetalle(i)}
                      className="text-xs text-red-400 hover:text-red-600">
                      Eliminar línea
                    </button>
                  </div>
                )}
              </div>
            ))}
            <button type="button" onClick={agregarDetalle}
              className="px-3 py-1 text-sm bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100">
              + Agregar tipo de café
            </button>
          </div>

          {(totalKilos > 0 || totalBultos > 0) && (
            <div className="bg-gray-50 rounded-lg p-3 flex gap-6 text-sm">
              <span className="text-gray-600">Total bultos: <strong>{totalBultos}</strong></span>
              <span className="text-gray-600">Total kilos: <strong>{totalKilos.toLocaleString('es-CO')} kg</strong></span>
            </div>
          )}

          <Seccion titulo="🧑 Datos del conductor" />
          <div className="grid grid-cols-2 gap-4">
            {[
              { name: 'conductor_nombre', label: 'Nombre *', placeholder: 'Nombre completo', required: true },
              { name: 'conductor_cedula', label: 'Cédula *', placeholder: 'Número de cédula', required: true },
              { name: 'conductor_direccion', label: 'Dirección', placeholder: 'Dirección' },
              { name: 'conductor_telefono', label: 'Teléfono', placeholder: 'Teléfono' },
            ].map(field => (
              <div key={field.name}>
                <label className="block text-xs text-gray-600 mb-1">{field.label}</label>
                <input type="text" name={field.name} value={form[field.name]}
                  onChange={handleChange} required={field.required}
                  placeholder={field.placeholder}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            ))}
          </div>

          <Seccion titulo="🚛 Datos del vehículo" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { name: 'vehiculo_clase', label: 'Clase', placeholder: 'Ej: Camión' },
              { name: 'vehiculo_placas', label: 'Placas *', placeholder: 'Ej: AJH 274', required: true },
              { name: 'vehiculo_marca', label: 'Marca', placeholder: 'Ej: Dodge' },
              { name: 'vehiculo_color', label: 'Color', placeholder: 'Ej: Vinotinto' },
              { name: 'vehiculo_modelo', label: 'Modelo', placeholder: 'Año modelo' },
            ].map(field => (
              <div key={field.name}>
                <label className="block text-xs text-gray-600 mb-1">{field.label}</label>
                <input type="text" name={field.name} value={form[field.name]}
                  onChange={handleChange} required={field.required}
                  placeholder={field.placeholder}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            ))}
          </div>

          <Seccion titulo="💵 Flete" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Valor del flete</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
                <input type="number" name="flete_valor" value={form.flete_valor}
                  onChange={handleChange} min="0" step="0.01"
                  className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Pagadero por</label>
              <input type="text" name="flete_pagadero_por" value={form.flete_pagadero_por}
                onChange={handleChange} placeholder="Quien paga el flete"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Nota</label>
            <textarea name="nota" value={form.nota} onChange={handleChange} rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Observación opcional"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={loading || submitted}
              className="flex-1 px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-50">
              {loading ? 'Guardando...' : 'Registrar Remisión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}