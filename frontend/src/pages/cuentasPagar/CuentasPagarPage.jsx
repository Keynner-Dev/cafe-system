import { useState, useEffect } from 'react';
import { getCuentasPagar } from '../../api/cuentasPagar';
import { getBodegas } from '../../api/inventario';
import { useAuth } from '../../context/AuthContext';
import CuentaPagarModal from '../../components/cuentasPagar/CuentasPagarModal';
import AbonoModal from '../../components/cuentasPagar/AbonoModal';

const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IconAbono = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);
const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

function formatCOP(valor) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0,
  }).format(valor);
}

const BADGE_ESTADO = {
  pendiente: { bg: '#fef2f2', color: '#dc2626', label: 'Pendiente' },
  parcial:   { bg: '#fefce8', color: '#ca8a04', label: 'Parcial' },
  pagado:    { bg: '#f0fdf4', color: '#16a34a', label: 'Pagado' },
};

export default function CuentasPagarPage() {
  const { usuario } = useAuth();
  const esJefe = usuario?.rol === 'jefe';

  const [cuentas, setCuentas] = useState([]);
  const [bodegas, setBodegas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroBodega, setFiltroBodega] = useState('');
  const [modalCuenta, setModalCuenta] = useState(false);
  const [cuentaEditando, setCuentaEditando] = useState(null);
  const [modalAbono, setModalAbono] = useState(false);
  const [cuentaAbonando, setCuentaAbonando] = useState(null);

  const cargarCuentas = () => {
    setCargando(true);
    const params = {};
    if (filtroEstado) params.estado = filtroEstado;
    if (filtroBodega) params.bodega = filtroBodega;
    getCuentasPagar(params)
      .then(res => setCuentas(res.data))
      .finally(() => setCargando(false));
  };

  useEffect(() => { cargarCuentas(); }, [filtroEstado, filtroBodega]);

  useEffect(() => {
    if (esJefe) getBodegas().then(res => setBodegas(res.data));
  }, []);

  const totalPendiente = cuentas
    .filter(c => c.estado !== 'pagado')
    .reduce((acc, c) => acc + parseFloat(c.saldo), 0);

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100, margin: '0 auto' }}>

      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>Cuentas por pagar</h1>
          <p style={{ color: '#64748b', fontSize: 14, margin: '4px 0 0' }}>
            Deudas pendientes con caficultores
          </p>
        </div>
        <button
          onClick={() => { setCuentaEditando(null); setModalCuenta(true); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#16a34a', color: 'white', border: 'none',
            borderRadius: 6, padding: '9px 18px', fontSize: 14,
            fontWeight: 600, cursor: 'pointer'
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#15803d'}
          onMouseLeave={e => e.currentTarget.style.background = '#16a34a'}
        >
          <IconPlus /> Nueva cuenta
        </button>
      </div>

      {/* Tarjeta resumen */}
      <div style={{
        background: '#0f172a', borderRadius: 12, padding: '20px 28px',
        marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ color: 'white' }}>
          <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>
            Total pendiente por pagar
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 32, fontWeight: 700, letterSpacing: '-0.5px' }}>
            {formatCOP(totalPendiente)}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 16, color: '#94a3b8', fontSize: 13 }}>
          <span>{cuentas.filter(c => c.estado === 'pendiente').length} pendientes</span>
          <span>{cuentas.filter(c => c.estado === 'parcial').length} parciales</span>
          <span>{cuentas.filter(c => c.estado === 'pagado').length} pagadas</span>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <select
          value={filtroEstado}
          onChange={e => setFiltroEstado(e.target.value)}
          style={{
            padding: '8px 12px', fontSize: 14, borderRadius: 6,
            border: '1px solid #e2e8f0', color: '#0f172a', outline: 'none', background: 'white'
          }}
          onFocus={e => e.target.style.borderColor = '#16a34a'}
          onBlur={e => e.target.style.borderColor = '#e2e8f0'}
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="parcial">Parcial</option>
          <option value="pagado">Pagado</option>
        </select>

        {esJefe && bodegas.length > 0 && (
          <select
            value={filtroBodega}
            onChange={e => setFiltroBodega(e.target.value)}
            style={{
              padding: '8px 12px', fontSize: 14, borderRadius: 6,
              border: '1px solid #e2e8f0', color: '#0f172a', outline: 'none', background: 'white'
            }}
            onFocus={e => e.target.style.borderColor = '#16a34a'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          >
            <option value="">Todas las bodegas</option>
            {bodegas.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
          </select>
        )}

        {(filtroEstado || filtroBodega) && (
          <button
            onClick={() => { setFiltroEstado(''); setFiltroBodega(''); }}
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
        ) : cuentas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8', fontSize: 14 }}>
            No hay cuentas por pagar registradas
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0f172a' }}>
                {['Caficultor', 'Descripción', 'Fecha', 'Total', 'Pagado', 'Saldo', 'Estado', 'Acciones']
                  .map(col => (
                  <th key={col} style={{
                    padding: '11px 16px', textAlign: 'left', fontSize: 12,
                    fontWeight: 600, color: '#e2e8f0',
                    textTransform: 'uppercase', letterSpacing: '0.05em'
                  }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cuentas.map((c, i) => {
                const badge = BADGE_ESTADO[c.estado];
                return (
                  <tr
                    key={c.id}
                    style={{ background: i % 2 === 0 ? 'white' : '#f8fafc', borderBottom: '1px solid #f1f5f9' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f0fdf4'}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'white' : '#f8fafc'}
                  >
                    <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                      {c.caficultor_nombre}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#64748b' }}>
                      {c.descripcion}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#64748b' }}>
                      {new Date(c.fecha + 'T00:00:00').toLocaleDateString('es-CO')}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 14, color: '#0f172a' }}>
                      {formatCOP(c.valor_total)}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 14, color: '#16a34a', fontWeight: 600 }}>
                      {formatCOP(c.valor_pagado)}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700, color: parseFloat(c.saldo) > 0 ? '#dc2626' : '#16a34a' }}>
                      {formatCOP(c.saldo)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                        fontSize: 12, fontWeight: 600,
                        background: badge.bg, color: badge.color
                      }}>
                        {badge.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {c.estado !== 'pagado' && (
                          <button
                            onClick={() => { setCuentaAbonando(c); setModalAbono(true); }}
                            style={{
                              padding: '5px 10px', borderRadius: 5, fontSize: 12,
                              border: 'none', background: '#16a34a',
                              color: 'white', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: 4
                            }}
                          >
                            <IconAbono /> Abonar
                          </button>
                        )}
                        <button
                          onClick={() => { setCuentaEditando(c); setModalCuenta(true); }}
                          style={{
                            padding: '5px 10px', borderRadius: 5, fontSize: 12,
                            border: '1px solid #e2e8f0', background: 'white',
                            color: '#374151', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 4
                          }}
                        >
                          <IconEdit /> Editar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modalCuenta && (
        <CuentaPagarModal
          cuenta={cuentaEditando}
          bodegas={bodegas}
          onCerrar={() => { setModalCuenta(false); setCuentaEditando(null); }}
          onGuardado={() => { setModalCuenta(false); setCuentaEditando(null); cargarCuentas(); }}
        />
      )}

      {modalAbono && cuentaAbonando && (
        <AbonoModal
          cuenta={cuentaAbonando}
          onCerrar={() => { setModalAbono(false); setCuentaAbonando(null); }}
          onGuardado={() => { setModalAbono(false); setCuentaAbonando(null); cargarCuentas(); }}
        />
      )}
    </div>
  );
}