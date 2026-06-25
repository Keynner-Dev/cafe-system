import { useEffect, useState } from 'react'
import { getVentas, deleteVenta } from '../../api/ventas'
import { useAuth } from '../../context/AuthContext'
import VentaModal from '../../components/ventas/VentaModal'
import VentaDetalle from '../../components/ventas/VentaDetalle'

const IconPlus = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)
const IconEye = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)
const IconTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" /><path d="M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
)
const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)
const IconSortAsc = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
  </svg>
)
const IconSortDesc = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
  </svg>
)

const fmt = (n) =>
  Number(n).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

export default function VentasPage() {
  const { usuario } = useAuth()
  const esJefe = usuario?.rol === 'jefe'

  const [ventas, setVentas]                       = useState([])
  const [loading, setLoading]                     = useState(true)
  const [modalOpen, setModalOpen]                 = useState(false)
  const [detalleOpen, setDetalleOpen]             = useState(false)
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null)

  // ── Búsqueda y ordenamiento ──
  const [busqueda, setBusqueda]     = useState('')
  const [ordenCampo, setOrdenCampo] = useState('id')
  const [ordenDir, setOrdenDir]     = useState('desc')

  const cargarVentas = () => {
    setLoading(true)
    getVentas()
      .then(res => setVentas(res.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargarVentas() }, [])

  const handleVerDetalle = (venta) => {
    setVentaSeleccionada(venta)
    setDetalleOpen(true)
  }

  const handleEliminar = async (id) => {
    if (!confirm('¿Eliminar esta venta? También se eliminarán sus movimientos de inventario.')) return
    try {
      await deleteVenta(id)
      cargarVentas()
    } catch {
      alert('No se pudo eliminar.')
    }
  }

  // ── Filtrado y ordenamiento ──
  const ventasFiltradas = ventas
    .filter(v =>
      (v.empresa_nombre || '').toLowerCase().includes(busqueda.toLowerCase().trim()) ||
      (v.numero_remision || '').toLowerCase().includes(busqueda.toLowerCase().trim())
    )
    .sort((a, b) => {
      let va, vb
      if (ordenCampo === 'empresa') {
        va = (a.empresa_nombre || '').toLowerCase()
        vb = (b.empresa_nombre || '').toLowerCase()
        return ordenDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
      }
      if (ordenCampo === 'fecha') {
        va = a.fecha ?? ''; vb = b.fecha ?? ''
        return ordenDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
      }
      if (ordenCampo === 'kilos') {
        va = Number(a.total_kilos || 0); vb = Number(b.total_kilos || 0)
        return ordenDir === 'asc' ? va - vb : vb - va
      }
      // id — numérico
      va = Number(a.id); vb = Number(b.id)
      return ordenDir === 'asc' ? va - vb : vb - va
    })

  const columnas = [
    'Remisión', 'Fecha', 'Empresa', 'Kilos', 'Bultos', 'Flete',
    ...(esJefe ? ['Utilidad'] : []),
    'Acciones',
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
            Ventas
          </h1>
          <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>
            Registro de remisiones de venta de café
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: '#16a34a', color: 'white',
            border: 'none', borderRadius: '6px',
            padding: '8px 14px', fontSize: '13px', fontWeight: 500,
            cursor: 'pointer',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#15803d'}
          onMouseLeave={e => e.currentTarget.style.background = '#16a34a'}
        >
          <IconPlus /> Nueva remisión
        </button>
      </div>

      {/* ── Búsqueda y ordenamiento ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>

        <div style={{ position: 'relative', flex: '1', minWidth: '200px', maxWidth: '320px' }}>
          <span style={{
            position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
            color: '#94a3b8', pointerEvents: 'none', display: 'flex', alignItems: 'center',
          }}>
            <IconSearch />
          </span>
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por empresa o remisión..."
            style={{
              width: '100%', boxSizing: 'border-box',
              paddingLeft: '34px', paddingRight: '12px',
              paddingTop: '8px', paddingBottom: '8px',
              border: '1px solid #e2e8f0', borderRadius: '6px',
              fontSize: '13px', color: '#0f172a',
              outline: 'none', background: 'white',
            }}
            onFocus={e => e.target.style.borderColor = '#16a34a'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>Ordenar por</span>
          <select
            value={ordenCampo}
            onChange={e => setOrdenCampo(e.target.value)}
            style={{
              border: '1px solid #e2e8f0', borderRadius: '6px',
              padding: '6px 10px', fontSize: '12px', color: '#0f172a',
              background: 'white', outline: 'none', cursor: 'pointer',
            }}
            onFocus={e => e.target.style.borderColor = '#16a34a'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          >
            <option value="id">ID</option>
            <option value="fecha">Fecha</option>
            <option value="empresa">Empresa</option>
            <option value="kilos">Kilos</option>
          </select>
          <button
            onClick={() => setOrdenDir(d => d === 'asc' ? 'desc' : 'asc')}
            title={ordenDir === 'asc' ? 'Ascendente' : 'Descendente'}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '32px', height: '32px', borderRadius: '6px',
              border: '1px solid #e2e8f0', background: 'white',
              color: '#475569', cursor: 'pointer',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
            onMouseLeave={e => e.currentTarget.style.background = 'white'}
          >
            {ordenDir === 'asc' ? <IconSortAsc /> : <IconSortDesc />}
          </button>
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <div style={{ color: '#94a3b8', fontSize: '13px', padding: '20px 0' }}>
          Cargando ventas...
        </div>
      ) : (
        <div style={{
          background: 'white', border: '1px solid #e2e8f0',
          borderRadius: '10px', overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#0f172a' }}>
                {columnas.map(col => (
                  <th key={col} style={{
                    padding: '11px 16px', textAlign: 'left',
                    color: '#e2e8f0', fontWeight: 500, fontSize: '12px',
                    whiteSpace: 'nowrap',
                  }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ventasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={columnas.length} style={{
                    padding: '40px', textAlign: 'center',
                    color: '#94a3b8', fontSize: '13px',
                  }}>
                    {busqueda ? 'No se encontraron resultados.' : 'No hay ventas registradas aún.'}
                  </td>
                </tr>
              ) : (
                ventasFiltradas.map(v => (
                  <tr
                    key={v.id}
                    style={{ borderTop: '1px solid #f1f5f9', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'white'}
                  >
                    <td style={{ padding: '11px 16px' }}>
                      <span style={{
                        fontFamily: 'monospace', fontWeight: 700,
                        color: '#16a34a', fontSize: '13px',
                      }}>
                        {v.numero_remision}
                      </span>
                    </td>
                    <td style={{ padding: '11px 16px', fontWeight: 500, color: '#0f172a' }}>
                      {v.fecha}
                    </td>
                    <td style={{ padding: '11px 16px', color: '#475569' }}>
                      {v.empresa_nombre}
                    </td>
                    <td style={{ padding: '11px 16px', color: '#475569' }}>
                      {Number(v.total_kilos).toLocaleString('es-CO')} kg
                    </td>
                    <td style={{ padding: '11px 16px', color: '#475569' }}>
                      {v.total_bultos}
                    </td>
                    <td style={{ padding: '11px 16px', color: '#475569' }}>
                      {fmt(v.flete_valor || 0)}
                    </td>

                    {esJefe && (
                      <td style={{ padding: '11px 16px' }}>
                        {v.utilidad_total !== null && v.utilidad_total !== undefined ? (
                          <span style={{
                            fontWeight: 700,
                            color: v.utilidad_total >= 0 ? '#16a34a' : '#dc2626',
                          }}>
                            {fmt(v.utilidad_total)}
                          </span>
                        ) : (
                          <span style={{
                            fontSize: '11px', color: '#94a3b8',
                            background: '#fef9c3', padding: '2px 8px',
                            borderRadius: 99, fontWeight: 500,
                          }}>
                            Sin precio
                          </span>
                        )}
                      </td>
                    )}

                    <td style={{ padding: '11px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => handleVerDetalle(v)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '4px',
                            padding: '5px 10px', borderRadius: '5px', border: 'none',
                            background: '#eff6ff', color: '#2563eb',
                            fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#dbeafe'}
                          onMouseLeave={e => e.currentTarget.style.background = '#eff6ff'}
                        >
                          <IconEye /> Ver
                        </button>
                        <button
                          onClick={() => handleEliminar(v.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '4px',
                            padding: '5px 10px', borderRadius: '5px', border: 'none',
                            background: '#fef2f2', color: '#dc2626',
                            fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                          onMouseLeave={e => e.currentTarget.style.background = '#fef2f2'}
                        >
                          <IconTrash /> Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {ventasFiltradas.length > 0 && (
            <div style={{
              padding: '10px 16px', borderTop: '1px solid #f1f5f9',
              color: '#94a3b8', fontSize: '12px',
            }}>
              {busqueda
                ? `${ventasFiltradas.length} resultado(s) para "${busqueda}"`
                : `${ventas.length} remisión(es) registrada(s)`
              }
            </div>
          )}
        </div>
      )}

      {/* Modales */}
      {modalOpen && (
        <VentaModal onClose={() => setModalOpen(false)} onSaved={cargarVentas} />
      )}
      {detalleOpen && ventaSeleccionada && (
        <VentaDetalle
          venta={ventaSeleccionada}
          onClose={() => setDetalleOpen(false)}
          onUpdated={() => {
            cargarVentas()
            getVentas().then(res => {
              const actualizada = res.data.find(v => v.id === ventaSeleccionada.id)
              if (actualizada) setVentaSeleccionada(actualizada)
            })
          }}
        />
      )}
    </div>
  )
}