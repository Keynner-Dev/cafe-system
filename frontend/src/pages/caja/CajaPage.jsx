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
    style: 'currency', currency: 'COP', minimumFractionDigits: 0,
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
  const esJefe = usuario?.rol === 'jefe';

  const [cajas,             setCajas]             = useState([]);
  const [cajaSeleccionada,  setCajaSeleccionada]  = useState(null);
  const [movimientos,       setMovimientos]       = useState([]);
  const [cargandoCajas,     setCargandoCajas]     = useState(true);
  const [cargandoMov,       setCargandoMov]       = useState(false);
  const [modalAbierto,      setModalAbierto]      = useState(false);

  // Cargar cajas al montar
  useEffect(() => {
    getCajas()
      .then(res => {
        const data = res.data;
        setCajas(data);
        // Administrador: selecciona su única caja
        // Jefe: empieza sin caja seleccionada (vista consolidada)
        if (!esJefe && data.length > 0) setCajaSeleccionada(data[0]);
      })
      .finally(() => setCargandoCajas(false));
  }, []);

  // Cargar movimientos cuando cambia la caja seleccionada
  useEffect(() => {
    if (!cajaSeleccionada) return;
    setCargandoMov(true);
    getMovimientos(cajaSeleccionada.id)
      .then(res => setMovimientos(res.data))
      .finally(() => setCargandoMov(false));
  }, [cajaSeleccionada]);

  const refrescar = () => {
    getCajas().then(res => {
      setCajas(res.data);
      if (cajaSeleccionada) {
        const actualizada = res.data.find(c => c.id === cajaSeleccionada.id);
        if (actualizada) setCajaSeleccionada(actualizada);
      }
    });
    if (cajaSeleccionada) {
      getMovimientos(cajaSeleccionada.id).then(res => setMovimientos(res.data));
    }
  };

  // Total consolidado para el jefe
  const totalConsolidado = cajas.reduce((acc, c) => acc + Number(c.saldo_actual), 0);

  if (cargandoCajas) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          border: '3px solid #e2e8f0', borderTopColor: '#16a34a',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100, margin: '0 auto' }}>

      {/* Encabezado */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 24,
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>Caja</h1>
          <p style={{ color: '#64748b', fontSize: 14, margin: '4px 0 0' }}>
            Movimientos de dinero por bodega
          </p>
        </div>
        {/* Jefe solo puede registrar si tiene una caja seleccionada */}
        {(!esJefe || cajaSeleccionada) && (
          <button
            onClick={() => setModalAbierto(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#16a34a', color: 'white', border: 'none',
              borderRadius: 6, padding: '9px 18px', fontSize: 14,
              fontWeight: 600, cursor: 'pointer',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#15803d'}
            onMouseLeave={e => e.currentTarget.style.background = '#16a34a'}
          >
            <IconPlus /> Registrar movimiento
          </button>
        )}
      </div>

      {/* ── VISTA JEFE ── */}
      {esJefe && (
        <>
          {/* Tarjeta consolidado total */}
          <div style={{
            background: '#0f172a', borderRadius: 12, padding: '28px 32px',
            marginBottom: 24, display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{
                background: 'rgba(255,255,255,0.08)', borderRadius: 10,
                padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <IconCaja />
              </div>
              <div style={{ color: 'white' }}>
                <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>
                  Total consolidado — todas las bodegas
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 32, fontWeight: 700, letterSpacing: '-0.5px' }}>
                  {formatCOP(totalConsolidado)}
                </p>
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#475569' }}>
              {cajas.length} bodega{cajas.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Tarjetas individuales por bodega */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 14, marginBottom: 24,
          }}>
            {cajas.map(caja => (
              <div
                key={caja.id}
                onClick={() => setCajaSeleccionada(
                  cajaSeleccionada?.id === caja.id ? null : caja
                )}
                style={{
                  background: 'white', borderRadius: 10, padding: '18px 20px',
                  border: `1px solid ${cajaSeleccionada?.id === caja.id ? '#16a34a' : '#e2e8f0'}`,
                  cursor: 'pointer', transition: 'all 0.15s',
                  boxShadow: cajaSeleccionada?.id === caja.id
                    ? '0 0 0 2px #bbf7d0' : 'none',
                }}
                onMouseEnter={e => {
                  if (cajaSeleccionada?.id !== caja.id)
                    e.currentTarget.style.borderColor = '#94a3b8';
                }}
                onMouseLeave={e => {
                  if (cajaSeleccionada?.id !== caja.id)
                    e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 6 }}>
                  {caja.bodega_nombre}
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>
                  {formatCOP(caja.saldo_actual)}
                </div>
                {cajaSeleccionada?.id === caja.id && (
                  <div style={{
                    marginTop: 8, fontSize: 11, color: '#16a34a', fontWeight: 600,
                  }}>
                    Viendo movimientos ↓
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── VISTA ADMINISTRADOR — tarjeta saldo su caja ── */}
      {!esJefe && cajaSeleccionada && (
        <div style={{
          background: '#0f172a', borderRadius: 12, padding: '28px 32px',
          marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20,
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.08)', borderRadius: 10,
            padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
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

      {/* ── TABLA MOVIMIENTOS ── */}
      {/* Jefe: solo muestra si seleccionó una bodega */}
      {/* Admin: siempre muestra */}
      {(!esJefe || cajaSeleccionada) && (
        <div style={{
          background: 'white', borderRadius: 10,
          border: '1px solid #e2e8f0', overflow: 'hidden',
        }}>
          <div style={{
            padding: '16px 20px', borderBottom: '1px solid #f1f5f9',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#0f172a' }}>
              Historial de movimientos
              {esJefe && cajaSeleccionada && (
                <span style={{ fontSize: 13, color: '#64748b', fontWeight: 400, marginLeft: 8 }}>
                  — {cajaSeleccionada.bodega_nombre}
                </span>
              )}
            </h2>
            {esJefe && cajaSeleccionada && (
              <button
                onClick={() => setCajaSeleccionada(null)}
                style={{
                  fontSize: 12, color: '#64748b', background: 'none',
                  border: 'none', cursor: 'pointer', textDecoration: 'underline',
                }}
              >
                Volver al consolidado
              </button>
            )}
          </div>

          {cargandoMov ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                border: '3px solid #e2e8f0', borderTopColor: '#16a34a',
                animation: 'spin 0.8s linear infinite',
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
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                    }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {movimientos.map((mov, i) => (
                  <tr
                    key={mov.id}
                    style={{
                      background: i % 2 === 0 ? 'white' : '#f8fafc',
                      borderBottom: '1px solid #f1f5f9',
                    }}
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
                      color: mov.tipo === 'ingreso' ? '#16a34a' : '#dc2626',
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
      )}

      {/* Mensaje jefe sin caja seleccionada */}
      {esJefe && !cajaSeleccionada && (
        <div style={{
          textAlign: 'center', padding: '40px 0',
          color: '#94a3b8', fontSize: 14,
        }}>
          Selecciona una bodega para ver sus movimientos
        </div>
      )}

      {/* Modal */}
      {modalAbierto && (
        <MovimientoModal
          caja={cajaSeleccionada}
          cajas={cajas}
          onCerrar={() => setModalAbierto(false)}
          onGuardado={() => { setModalAbierto(false); refrescar(); }}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}