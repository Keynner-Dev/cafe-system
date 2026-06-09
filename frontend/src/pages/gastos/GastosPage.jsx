import { useState, useEffect } from 'react';
import { getGastos, deleteGasto } from '../../api/gastos';
import { getBodegas } from '../../api/inventario';
import { useAuth } from '../../context/AuthContext';
import GastoModal from '../../components/gastos/GastosModal';

const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);

function formatCOP(valor) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0,
  }).format(valor);
}

function getMesActual() {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
}

export default function GastosPage() {
  const { usuario } = useAuth();
  const esJefe = usuario?.rol === 'jefe';

  const [gastos, setGastos] = useState([]);
  const [bodegas, setBodegas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [gastoEditando, setGastoEditando] = useState(null);
  const [filtroMes, setFiltroMes] = useState(getMesActual());
  const [filtroBodega, setFiltroBodega] = useState('');
  const [confirmandoId, setConfirmandoId] = useState(null);

  const cargarGastos = () => {
    setCargando(true);
    const params = {};
    if (filtroMes) params.mes = filtroMes;
    if (filtroBodega) params.bodega = filtroBodega;
    getGastos(params)
      .then(res => setGastos(res.data))
      .finally(() => setCargando(false));
  };

  useEffect(() => { cargarGastos(); }, [filtroMes, filtroBodega]);

  useEffect(() => {
    if (esJefe) getBodegas().then(res => setBodegas(res.data));
  }, []);

  const handleEliminar = async (id) => {
    await deleteGasto(id);
    setConfirmandoId(null);
    cargarGastos();
  };

  const totalMes = gastos.reduce((acc, g) => acc + parseFloat(g.valor), 0);

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100, margin: '0 auto' }}>

      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>Gastos</h1>
          <p style={{ color: '#64748b', fontSize: 14, margin: '4px 0 0' }}>
            Registro de egresos operativos por bodega
          </p>
        </div>
        <button
          onClick={() => { setGastoEditando(null); setModalAbierto(true); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#16a34a', color: 'white', border: 'none',
            borderRadius: 6, padding: '9px 18px', fontSize: 14,
            fontWeight: 600, cursor: 'pointer'
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#15803d'}
          onMouseLeave={e => e.currentTarget.style.background = '#16a34a'}
        >
          <IconPlus /> Registrar gasto
        </button>
      </div>

      {/* Tarjeta total del mes */}
      <div style={{
        background: '#0f172a', borderRadius: 12, padding: '20px 28px',
        marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ color: 'white' }}>
          <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>
            Total gastos — {filtroMes || 'todos los meses'}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 32, fontWeight: 700, letterSpacing: '-0.5px' }}>
            {formatCOP(totalMes)}
          </p>
        </div>
        <div style={{ color: '#475569', fontSize: 13 }}>
          {gastos.length} registro{gastos.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          type="month"
          value={filtroMes}
          onChange={e => setFiltroMes(e.target.value)}
          style={{
            padding: '8px 12px', fontSize: 14, borderRadius: 6,
            border: '1px solid #e2e8f0', color: '#0f172a', outline: 'none'
          }}
          onFocus={e => e.target.style.borderColor = '#16a34a'}
          onBlur={e => e.target.style.borderColor = '#e2e8f0'}
        />
        {esJefe && bodegas.length > 0 && (
          <select
            value={filtroBodega}
            onChange={e => setFiltroBodega(e.target.value)}
            style={{
              padding: '8px 12px', fontSize: 14, borderRadius: 6,
              border: '1px solid #e2e8f0', color: '#0f172a', outline: 'none'
            }}
            onFocus={e => e.target.style.borderColor = '#16a34a'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          >
            <option value="">Todas las bodegas</option>
            {bodegas.map(b => (
              <option key={b.id} value={b.id}>{b.nombre}</option>
            ))}
          </select>
        )}
        {filtroMes && (
          <button
            onClick={() => { setFiltroMes(''); setFiltroBodega(''); }}
            style={{
              padding: '8px 14px', fontSize: 13, borderRadius: 6,
              border: '1px solid #e2e8f0', background: 'white',
              color: '#64748b', cursor: 'pointer'
            }}
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Tabla */}
      <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {cargando ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              border: '3px solid #e2e8f0', borderTopColor: '#16a34a',
              animation: 'spin 0.8s linear infinite'
            }} />
          </div>
        ) : gastos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8', fontSize: 14 }}>
            No hay gastos registrados para este período
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0f172a' }}>
                {['Fecha', 'Categoría', 'Descripción', 'Medio de pago', esJefe && 'Bodega', 'Valor', 'Acciones']
                  .filter(Boolean).map(col => (
                  <th key={col} style={{
                    padding: '11px 16px', textAlign: 'left', fontSize: 12,
                    fontWeight: 600, color: '#e2e8f0',
                    textTransform: 'uppercase', letterSpacing: '0.05em'
                  }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gastos.map((g, i) => (
                <tr
                  key={g.id}
                  style={{ background: i % 2 === 0 ? 'white' : '#f8fafc', borderBottom: '1px solid #f1f5f9' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f0fdf4'}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'white' : '#f8fafc'}
                >
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#64748b' }}>
                    {new Date(g.fecha + 'T00:00:00').toLocaleDateString('es-CO')}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                      fontSize: 12, fontWeight: 600,
                      background: '#eff6ff', color: '#2563eb'
                    }}>
                      {g.categoria}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: '#0f172a' }}>
                    {g.descripcion}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                      fontSize: 12, fontWeight: 600,
                      background: g.medio_pago === 'efectivo' ? '#fefce8' : '#f0fdf4',
                      color: g.medio_pago === 'efectivo' ? '#ca8a04' : '#16a34a',
                    }}>
                      {g.medio_pago === 'efectivo' ? 'Efectivo' : 'Transferencia'}
                    </span>
                  </td>
                  {esJefe && (
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#64748b' }}>
                      {g.bodega_nombre}
                    </td>
                  )}
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600, color: '#dc2626' }}>
                    {formatCOP(g.valor)}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {/* Editar */}
                      <button
                        onClick={() => { setGastoEditando(g); setModalAbierto(true); }}
                        style={{
                          padding: '5px 10px', borderRadius: 5, fontSize: 12,
                          border: '1px solid #e2e8f0', background: 'white',
                          color: '#374151', cursor: 'pointer', display: 'flex',
                          alignItems: 'center', gap: 4
                        }}
                      >
                        <IconEdit /> Editar
                      </button>

                      {/* Eliminar con confirmación inline */}
                      {confirmandoId === g.id ? (
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                          <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 500 }}>¿Eliminar?</span>
                          <button
                            onClick={() => handleEliminar(g.id)}
                            style={{
                              padding: '5px 10px', borderRadius: 5, fontSize: 12,
                              border: 'none', background: '#dc2626',
                              color: 'white', cursor: 'pointer'
                            }}
                          >
                            Sí
                          </button>
                          <button
                            onClick={() => setConfirmandoId(null)}
                            style={{
                              padding: '5px 10px', borderRadius: 5, fontSize: 12,
                              border: '1px solid #e2e8f0', background: 'white',
                              color: '#374151', cursor: 'pointer'
                            }}
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmandoId(g.id)}
                          style={{
                            padding: '5px 10px', borderRadius: 5, fontSize: 12,
                            border: '1px solid #fecaca', background: '#fef2f2',
                            color: '#dc2626', cursor: 'pointer', display: 'flex',
                            alignItems: 'center', gap: 4
                          }}
                        >
                          <IconTrash /> Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalAbierto && (
        <GastoModal
          gasto={gastoEditando}
          bodegas={bodegas}
          onCerrar={() => { setModalAbierto(false); setGastoEditando(null); }}
          onGuardado={() => { setModalAbierto(false); setGastoEditando(null); cargarGastos(); }}
        />
      )}
    </div>
  );
}