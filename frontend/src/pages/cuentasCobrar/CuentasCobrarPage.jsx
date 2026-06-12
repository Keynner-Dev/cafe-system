import { useState, useEffect } from 'react';
import { getCuentasCobrar, deleteCuentaCobrar } from '../../api/cuentasCobrar';
import { useAuth } from '../../context/AuthContext';
import CuentaCobrarModal from '../../components/cuentasCobrar/CuentaCobrarModal';
import AbonoCobroModal from '../../components/cuentasCobrar/AbonoCobroModal';

const fmt = (n) =>
  Number(n).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

const BADGE = {
  pendiente: { bg: '#fef2f2', color: '#dc2626' },
  parcial:   { bg: '#fefce8', color: '#ca8a04' },
  pagado:    { bg: '#f0fdf4', color: '#16a34a' },
};

export default function CuentasCobrarPage() {
  const { user } = useAuth();
  const esJefe   = user?.rol === 'jefe';

  const [cuentas,      setCuentas]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [modalCrear,   setModalCrear]   = useState(false);
  const [cuentaAbono,  setCuentaAbono]  = useState(null);

  const cargar = () => {
    setLoading(true);
    const params = {};
    if (filtroEstado) params.estado = filtroEstado;
    getCuentasCobrar(params)
      .then(setCuentas)
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, [filtroEstado]);

  const totales = cuentas.reduce(
    (acc, c) => ({
      total:   acc.total   + Number(c.valor_total),
      cobrado: acc.cobrado + Number(c.valor_cobrado),
      saldo:   acc.saldo   + Number(c.saldo),
    }),
    { total: 0, cobrado: 0, saldo: 0 }
  );

  return (
    <div style={{ padding: '28px 32px', background: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 24,
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0f172a' }}>
            Cuentas por cobrar
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
            Seguimiento de deudas de empresas
          </p>
        </div>
        <button
          onClick={() => setModalCrear(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 18px', background: '#16a34a',
            color: 'white', border: 'none', borderRadius: 6,
            fontWeight: 600, fontSize: 14, cursor: 'pointer',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#15803d'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#16a34a'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nueva cuenta
        </button>
      </div>

      {/* Tarjetas resumen */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 16, marginBottom: 24,
      }}>
        {[
          { label: 'Total por cobrar', value: fmt(totales.total),   color: '#2563eb', bg: '#eff6ff' },
          { label: 'Ya cobrado',       value: fmt(totales.cobrado), color: '#16a34a', bg: '#f0fdf4' },
          { label: 'Saldo pendiente',  value: fmt(totales.saldo),   color: '#dc2626', bg: '#fef2f2' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} style={{
            background: 'white', border: '1px solid #e2e8f0',
            borderRadius: 10, padding: '18px 22px',
          }}>
            <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase',
              letterSpacing: '0.05em', marginBottom: 6 }}>
              {label}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a' }}>{value}</div>
            <div style={{
              marginTop: 8, display: 'inline-block',
              padding: '3px 8px', borderRadius: 4, fontSize: 11,
              background: bg, color,
            }}>
              {cuentas.length} cuenta{cuentas.length !== 1 ? 's' : ''}
            </div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{
        background: 'white', border: '1px solid #e2e8f0',
        borderRadius: 10, padding: '14px 20px',
        display: 'flex', gap: 10, alignItems: 'center',
        marginBottom: 20, flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Estado:</span>
        {['', 'pendiente', 'parcial', 'pagado'].map((e) => (
          <button
            key={e || 'todos'}
            onClick={() => setFiltroEstado(e)}
            style={{
              padding: '5px 14px', borderRadius: 6, fontSize: 12,
              fontWeight: 500, cursor: 'pointer',
              background: filtroEstado === e ? '#0f172a' : '#f8fafc',
              color:      filtroEstado === e ? 'white'   : '#475569',
              border: `1px solid ${filtroEstado === e ? '#0f172a' : '#e2e8f0'}`,
            }}
          >
            {e === '' ? 'Todos' : e.charAt(0).toUpperCase() + e.slice(1)}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div style={{
        background: 'white', border: '1px solid #e2e8f0',
        borderRadius: 10, overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#0f172a' }}>
              {['Empresa', 'Bodega', 'Total', 'Cobrado', 'Saldo', 'Estado', 'Fecha', ''].map((h) => (
                <th key={h} style={{
                  padding: '12px 16px', textAlign: 'left',
                  fontSize: 12, fontWeight: 600, color: '#e2e8f0',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 40 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    border: '3px solid #e2e8f0', borderTopColor: '#16a34a',
                    animation: 'spin 0.7s linear infinite', margin: '0 auto',
                  }}/>
                  <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                </td>
              </tr>
            ) : cuentas.length === 0 ? (
              <tr>
                <td colSpan={8} style={{
                  textAlign: 'center', padding: '40px 0',
                  color: '#94a3b8', fontSize: 14,
                }}>
                  No hay cuentas registradas
                </td>
              </tr>
            ) : (
              cuentas.map((c, idx) => {
                const saldo = Number(c.valor_total) - Number(c.valor_cobrado);
                const b     = BADGE[c.estado] || BADGE.pendiente;
                return (
                  <tr
                    key={c.id}
                    style={{ borderTop: '1px solid #f1f5f9' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                  >
                    <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 500, color: '#0f172a' }}>
                      {c.empresa_nombre}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#64748b' }}>
                      {c.bodega_nombre}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: '#0f172a' }}>
                      {fmt(c.valor_total)}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: '#16a34a' }}>
                      {fmt(c.valor_cobrado)}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: '#dc2626' }}>
                      {fmt(saldo)}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        background: b.bg, color: b.color,
                        padding: '4px 10px', borderRadius: 6,
                        fontSize: 12, fontWeight: 600,
                      }}>
                        {c.estado.charAt(0).toUpperCase() + c.estado.slice(1)}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 12, color: '#94a3b8' }}>
                      {new Date(c.fecha_creacion).toLocaleDateString('es-CO')}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {c.estado !== 'pagado' && (
                        <button
                          onClick={() => setCuentaAbono(c)}
                          style={{
                            padding: '6px 14px', borderRadius: 6,
                            background: '#eff6ff', color: '#2563eb',
                            border: '1px solid #bfdbfe',
                            fontSize: 12, cursor: 'pointer', fontWeight: 500,
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#dbeafe'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#eff6ff'}
                        >
                          Ver cobros
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modales */}
      {modalCrear && (
        <CuentaCobrarModal
          onClose={() => setModalCrear(false)}
          onCreated={cargar}
        />
      )}
      {cuentaAbono && (
        <AbonoCobroModal
          cuenta={cuentaAbono}
          onClose={() => setCuentaAbono(null)}
          onUpdated={cargar}
        />
      )}
    </div>
  );
}