import { useState, useEffect } from 'react';
import { getCajas, getMovimientos } from '../../api/caja';
import { useAuth } from '../../context/AuthContext';
import MovimientoModal from '../../components/caja/MovimientoModal';

const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconCaja = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    <line x1="12" y1="12" x2="12" y2="16" />
    <line x1="10" y1="14" x2="14" y2="14" />
  </svg>
);

function formatCOP(valor) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(valor);
}

function formatFecha(fecha) {
  return new Date(fecha).toLocaleString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function CajaPage() {
  const { usuario } = useAuth();
  const [cajas, setCajas] = useState([]);
  const [cajaSeleccionada, setCajaSeleccionada] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [cargandoCajas, setCargandoCajas] = useState(true);
  const [cargandoMovimientos, setCargandoMovimientos] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);

  // Cargar cajas al montar
  useEffect(() => {
    getCajas()
      .then(res => {
        setCajas(res.data);
        if (res.data.length > 0) setCajaSeleccionada(res.data[0]);
      })
      .finally(() => setCargandoCajas(false));
  }, []);

  // Cargar movimientos cuando cambia la caja seleccionada
  useEffect(() => {
    if (!cajaSeleccionada) return;
    setCargandoMovimientos(true);
    getMovimientos(cajaSeleccionada.id)
      .then(res => setMovimientos(res.data))
      .finally(() => setCargandoMovimientos(false));
  }, [cajaSeleccionada]);

  const handleMovimientoCreado = () => {
    // Refresca tanto la caja (saldo) como los movimientos
    getCajas().then(res => {
      setCajas(res.data);
      const actualizada = res.data.find(c => c.id === cajaSeleccionada.id);
      if (actualizada) setCajaSeleccionada(actualizada);
    });
    getMovimientos(cajaSeleccionada.id).then(res => setMovimientos(res.data));
  };

  if (cargandoCajas) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          border: '3px solid #e2e8f0', borderTopColor: '#16a34a',
          animation: 'spin 0.8s linear infinite'
        }} />
      </div>
    );
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100, margin: '0 auto' }}>

      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>Caja</h1>
          <p style={{ color: '#64748b', fontSize: 14, margin: '4px 0 0' }}>
            Movimientos de dinero por bodega
          </p>
        </div>
        <button
          onClick={() => setModalAbierto(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#16a34a', color: 'white', border: 'none',
            borderRadius: 6, padding: '9px 18px', fontSize: 14,
            fontWeight: 600, cursor: 'pointer'
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#15803d'}
          onMouseLeave={e => e.currentTarget.style.background = '#16a34a'}
        >
          <IconPlus /> Registrar movimiento
        </button>
      </div>

      {/* Selector de caja (solo jefe si tiene varias) */}
      {usuario?.rol === 'jefe' && cajas.length > 1 && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          {cajas.map(caja => (
            <button
              key={caja.id}
              onClick={() => setCajaSeleccionada(caja)}
              style={{
                padding: '8px 18px', borderRadius: 6, fontSize: 14, fontWeight: 600,
                cursor: 'pointer', border: '1px solid',
                background: cajaSeleccionada?.id === caja.id ? '#0f172a' : 'white',
                color: cajaSeleccionada?.id === caja.id ? 'white' : '#0f172a',
                borderColor: cajaSeleccionada?.id === caja.id ? '#0f172a' : '#e2e8f0',
              }}
            >
              {caja.bodega_nombre}
            </button>
          ))}
        </div>
      )}

      {/* Tarjeta saldo */}
      {cajaSeleccionada && (
        <div style={{
          background: '#0f172a', borderRadius: 12, padding: '28px 32px',
          marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.08)', borderRadius: 10,
            padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <IconCaja />
          </div>
          <div style={{ color: 'white' }}>
            <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>
              Saldo actual — {cajaSeleccionada.bodega_nombre}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 32, fontWeight: 700, letterSpacing: '-0.5px' }}>
              {formatCOP(cajaSeleccionada.saldo_actual)}
            </p>
          </div>
        </div>
      )}

      {/* Tabla movimientos */}
      <div style={{
        background: 'white', borderRadius: 10,
        border: '1px solid #e2e8f0', overflow: 'hidden'
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#0f172a' }}>
            Historial de movimientos
          </h2>
        </div>

        {cargandoMovimientos ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              border: '3px solid #e2e8f0', borderTopColor: '#16a34a',
              animation: 'spin 0.8s linear infinite'
            }} />
          </div>
        ) : movimientos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8', fontSize: 14 }}>
            No hay movimientos registrados aún
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0f172a' }}>
                {['Fecha', 'Descripción', 'Tipo', 'Valor', 'Registrado por'].map(col => (
                  <th key={col} style={{
                    padding: '11px 16px', textAlign: 'left',
                    fontSize: 12, fontWeight: 600, color: '#e2e8f0',
                    textTransform: 'uppercase', letterSpacing: '0.05em'
                  }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {movimientos.map((mov, i) => (
                <tr
                  key={mov.id}
                  style={{ background: i % 2 === 0 ? 'white' : '#f8fafc', borderBottom: '1px solid #f1f5f9' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f0fdf4'}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'white' : '#f8fafc'}
                >
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#64748b' }}>
                    {formatFecha(mov.fecha)}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: '#0f172a' }}>
                    {mov.descripcion}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                      fontSize: 12, fontWeight: 600,
                      background: mov.tipo === 'ingreso' ? '#f0fdf4' : '#fef2f2',
                      color: mov.tipo === 'ingreso' ? '#16a34a' : '#dc2626',
                    }}>
                      {mov.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
                    </span>
                  </td>
                  <td style={{
                    padding: '12px 16px', fontSize: 14, fontWeight: 600,
                    color: mov.tipo === 'ingreso' ? '#16a34a' : '#dc2626'
                  }}>
                    {mov.tipo === 'egreso' ? '− ' : '+ '}{formatCOP(mov.valor)}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#64748b' }}>
                    {mov.creado_por_nombre || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modalAbierto && cajaSeleccionada && (
        <MovimientoModal
          caja={cajaSeleccionada}
          cajas={cajas}
          onCerrar={() => setModalAbierto(false)}
          onGuardado={() => {
            setModalAbierto(false);
            handleMovimientoCreado();
          }}
        />
      )}
    </div>
  );
}