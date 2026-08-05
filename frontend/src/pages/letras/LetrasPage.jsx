import { useState, useEffect } from 'react';
import { getLetras, getLetrasResumen } from '../../api/letras';
import { useAuth } from '../../context/AuthContext';
import LetraModal from '../../components/letras/LetraModal';
import AbonoLetraModal from '../../components/letras/AbonoLetraModal';
import EstadoError from '../../components/common/EstadoError'; // NUEVO

const IconChevronLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)
const IconChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
)

const fmt = (n) =>
  Number(n).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

const BADGE = {
  pendiente: { bg: '#fef2f2', color: '#dc2626' },
  parcial:   { bg: '#fefce8', color: '#ca8a04' },
  pagado:    { bg: '#f0fdf4', color: '#16a34a' },
};

export default function LetrasPage() {
  const { user } = useAuth();
  const esJefe = user?.rol === 'jefe';

  const [letras, setLetras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState(false); // NUEVO
  const [filtroEstado, setFiltroEstado] = useState('');
  const [modalCrear, setModalCrear] = useState(false);
  const [letraAbono, setLetraAbono] = useState(null);

  // ── NUEVO (ítem 17): paginación de la tabla ──
  const [pagina, setPagina] = useState(1);
  const [totalLetras, setTotalLetras] = useState(0);
  const PAGE_SIZE = 10; // debe coincidir con settings.REST_FRAMEWORK['PAGE_SIZE']
  const totalPaginas = Math.max(1, Math.ceil(totalLetras / PAGE_SIZE));

  // ── NUEVO (ítem 17): totales (adelantado/abonado/saldo) vienen de un
  // endpoint aparte que SIEMPRE suma sobre el conjunto completo del
  // filtro, sin paginar -- así las tarjetas resumen no dependen de
  // cuántas letras quepan en la página actual de la tabla. ──
  const [resumen, setResumen] = useState({
    total_adelantado: 0, total_abonado: 0, saldo_total: 0, cantidad: 0,
  });

  const cargar = () => {
    setLoading(true);
    const params = { page: pagina };
    if (filtroEstado) params.estado = filtroEstado;
    getLetras(params)
      .then(res => {
        const data = res.data;
        const results = Array.isArray(data) ? data : (data?.results ?? []);
        const count = Array.isArray(data) ? data.length : (data?.count ?? results.length);
        setLetras(results);
        setTotalLetras(count);
        setErrorCarga(false); // NUEVO
      })
      .catch(() => setErrorCarga(true)) // NUEVO
      .finally(() => setLoading(false));
  };

  const cargarResumen = () => {
    const params = {};
    if (filtroEstado) params.estado = filtroEstado;
    getLetrasResumen(params).then(setResumen);
  };

  useEffect(() => { cargar(); }, [pagina, filtroEstado]);
  useEffect(() => { cargarResumen(); setPagina(1); }, [filtroEstado]);

  // ── ÍTEM 17: los totales ya NO se calculan sumando 'letras' (que
  // ahora solo trae 10 a la vez) -- vienen de 'resumen', calculado en
  // SQL sobre el conjunto completo del filtro. ──
  const totales = {
    total: resumen.total_adelantado,
    abonado: resumen.total_abonado,
    saldo: resumen.saldo_total,
  };

  const handleAbonoActualizado = () => {
    cargar();
    cargarResumen();
  };

  const handleLetraCreada = () => {
    cargar();
    cargarResumen();
  };

  return (
    <div style={{ padding: '28px 32px', background: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 24,
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0f172a' }}>
            Letras de cambio
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
            Adelantos de dinero a caficultores
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
          Nueva letra
        </button>
      </div>

      {/* Tarjetas resumen — ítem 17: ahora vienen de 'resumen', no de
          sumar el array 'letras' (que solo trae la página actual) */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 16, marginBottom: 24,
      }}>
        {[
          { label: 'Total adelantado', value: fmt(totales.total),   color: '#2563eb', bg: '#eff6ff' },
          { label: 'Ya abonado',       value: fmt(totales.abonado), color: '#16a34a', bg: '#f0fdf4' },
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
              {resumen.cantidad} letra{resumen.cantidad !== 1 ? 's' : ''}
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
              color: filtroEstado === e ? 'white' : '#475569',
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
              {['Caficultor', 'Bodega', 'Adelantado', 'Abonado', 'Saldo', 'Estado', 'Fecha', ''].map((h) => (
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
            ) : errorCarga ? (
              <tr>
                <td colSpan={8} style={{ padding: '16px' }}>
                  <EstadoError
                    mensaje="No se pudieron cargar las letras. Verifica tu conexión e intenta de nuevo."
                    onReintentar={cargar}
                  />
                </td>
              </tr>
            ) : letras.length === 0 ? (
              <tr>
                <td colSpan={8} style={{
                  textAlign: 'center', padding: '40px 0',
                  color: '#94a3b8', fontSize: 14,
                }}>
                  No hay letras registradas
                </td>
              </tr>
            ) : (
              letras.map((l) => {
                const b = BADGE[l.estado] || BADGE.pendiente;
                return (
                  <tr
                    key={l.id}
                    style={{ borderTop: '1px solid #f1f5f9' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                  >
                    <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 500, color: '#0f172a' }}>
                      {l.caficultor_nombre}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#64748b' }}>
                      {l.bodega_nombre}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: '#0f172a' }}>
                      {fmt(l.valor_total)}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: '#16a34a' }}>
                      {fmt(l.valor_abonado)}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: '#dc2626' }}>
                      {fmt(l.saldo)}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        background: b.bg, color: b.color,
                        padding: '4px 10px', borderRadius: 6,
                        fontSize: 12, fontWeight: 600,
                      }}>
                        {l.estado.charAt(0).toUpperCase() + l.estado.slice(1)}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 12, color: '#94a3b8' }}>
                      {new Date(l.fecha_creacion).toLocaleDateString('es-CO')}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {l.estado !== 'pagado' && (
                        <button
                          onClick={() => setLetraAbono(l)}
                          style={{
                            padding: '6px 14px', borderRadius: 6,
                            background: '#eff6ff', color: '#2563eb',
                            border: '1px solid #bfdbfe',
                            fontSize: 12, cursor: 'pointer', fontWeight: 500,
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#dbeafe'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#eff6ff'}
                        >
                          Ver abonos
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* ── NUEVO (ítem 17): pie de tabla con conteo real + controles
             de paginación, mismo patrón que ComprasPage.jsx / GastosPage.jsx ── */}
        {!loading && letras.length > 0 && (
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 16px', borderTop: '1px solid #f1f5f9',
            flexWrap: 'wrap', gap: '10px',
          }}>
            <span style={{ color: '#94a3b8', fontSize: '12px' }}>
              {totalLetras} letra{totalLetras !== 1 ? 's' : ''} en total
            </span>

            {totalPaginas > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={() => setPagina(p => Math.max(1, p - 1))}
                  disabled={pagina === 1}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '28px', height: '28px', borderRadius: '6px',
                    border: '1px solid #e2e8f0', background: 'white',
                    color: pagina === 1 ? '#cbd5e1' : '#475569',
                    cursor: pagina === 1 ? 'not-allowed' : 'pointer',
                  }}
                >
                  <IconChevronLeft />
                </button>
                <span style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                  Página {pagina} de {totalPaginas}
                </span>
                <button
                  onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                  disabled={pagina === totalPaginas}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '28px', height: '28px', borderRadius: '6px',
                    border: '1px solid #e2e8f0', background: 'white',
                    color: pagina === totalPaginas ? '#cbd5e1' : '#475569',
                    cursor: pagina === totalPaginas ? 'not-allowed' : 'pointer',
                  }}
                >
                  <IconChevronRight />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modales */}
      {modalCrear && (
        <LetraModal
          onClose={() => setModalCrear(false)}
          onCreated={handleLetraCreada}
        />
      )}
      {letraAbono && (
        <AbonoLetraModal
          letra={letraAbono}
          onClose={() => setLetraAbono(null)}
          onUpdated={handleAbonoActualizado}
        />
      )}
    </div>
  );
}