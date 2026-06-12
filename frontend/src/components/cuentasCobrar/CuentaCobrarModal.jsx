import { useState, useEffect, useRef } from 'react';
import { getTerceros } from '../../api/terceros';
import { getVentas } from '../../api/ventas';
import { createCuentaCobrar } from '../../api/cuentasCobrar';
import { getBodegas } from '../../api/inventario';
import { useAuth } from '../../context/AuthContext';

const fmt = (n) =>
  Number(n).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

export default function CuentaCobrarModal({ onClose, onCreated }) {
  const { user } = useAuth();
  const esJefe   = user?.rol === 'jefe';

  const [paso,       setPaso]       = useState(1);
  const [empresas,   setEmpresas]   = useState([]);
  const [bodegas,    setBodegas]    = useState([]);
  const [ventas,     setVentas]     = useState([]);
  const [busqueda,   setBusqueda]   = useState('');
  const [dropdown,   setDropdown]   = useState(false);
  const [empresa,    setEmpresa]    = useState(null);
  const [ventaSel,   setVentaSel]   = useState(null);
  const [bodega,     setBodega]     = useState(user?.bodega?.toString() || '');
  const [valorTotal, setValorTotal] = useState('');
  const [notas,      setNotas]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const debounceRef = useRef(null);

  useEffect(() => {
    if (esJefe) getBodegas().then(setBodegas);
  }, [esJefe]);

  const buscarEmpresas = (texto) => {
    clearTimeout(debounceRef.current);
    setBusqueda(texto);
    setDropdown(true);
    debounceRef.current = setTimeout(() => {
      if (texto.length < 2) { setEmpresas([]); return; }
      getTerceros({ buscar: texto, tipo: 'empresa' }).then(setEmpresas);
    }, 300);
  };

  const seleccionarEmpresa = (e) => {
    setEmpresa(e);
    setBusqueda(e.nombre);
    setDropdown(false);
    // Cargar ventas de esa empresa
    getVentas({ empresa: e.id }).then(setVentas);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!empresa) return setError('Selecciona una empresa.');
    if (!valorTotal || Number(valorTotal) <= 0) return setError('Ingresa el valor total.');
    setLoading(true); setError('');
    try {
      await createCuentaCobrar({
        empresa:     empresa.id,
        venta:       ventaSel || null,
        bodega:      bodega,
        valor_total: Number(valorTotal),
        notas,
      });
      onCreated?.();
      onClose();
    } catch (err) {
      const d = err.response?.data;
      setError(typeof d === 'string' ? d : JSON.stringify(d));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(15,23,42,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: 'white', borderRadius: 12,
        width: '100%', maxWidth: 500,
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }}>
        {/* Cabecera */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 16, color: '#0f172a' }}>
              Nueva cuenta por cobrar
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
              Paso {paso} de 2
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Indicador de pasos */}
        <div style={{
          display: 'flex', padding: '14px 24px',
          borderBottom: '1px solid #f1f5f9', gap: 8,
        }}>
          {['Seleccionar empresa', 'Configurar cuenta'].map((label, i) => (
            <div key={i} style={{
              flex: 1, textAlign: 'center',
              padding: '6px 0', borderRadius: 6, fontSize: 12, fontWeight: 500,
              background: paso === i + 1 ? '#f0fdf4' : '#f8fafc',
              color:      paso === i + 1 ? '#16a34a' : '#94a3b8',
              border: `1px solid ${paso === i + 1 ? '#bbf7d0' : '#e2e8f0'}`,
            }}>
              {label}
            </div>
          ))}
        </div>

        {/* Cuerpo */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {/* ── Paso 1: buscar empresa ── */}
          {paso === 1 && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>
                Buscar empresa *
              </label>
              <div style={{ position: 'relative', marginTop: 6 }}>
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => buscarEmpresas(e.target.value)}
                  onFocus={() => busqueda.length >= 2 && setDropdown(true)}
                  placeholder="Nombre o cédula..."
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '9px 12px', border: '1px solid #e2e8f0',
                    borderRadius: 6, fontSize: 14, outline: 'none',
                  }}
                  onFocus_={(e) => e.target.style.borderColor = '#16a34a'}
                  onBlur={() => setTimeout(() => setDropdown(false), 150)}
                />
                {dropdown && empresas.length > 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0,
                    background: 'white', border: '1px solid #e2e8f0',
                    borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                    zIndex: 100, maxHeight: 200, overflowY: 'auto',
                  }}>
                    {empresas.map((e) => (
                      <div
                        key={e.id}
                        onMouseDown={() => seleccionarEmpresa(e)}
                        style={{
                          padding: '10px 14px', cursor: 'pointer',
                          borderBottom: '1px solid #f8fafc',
                        }}
                        onMouseEnter={(ev) => ev.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={(ev) => ev.currentTarget.style.background = 'white'}
                      >
                        <div style={{ fontWeight: 500, fontSize: 14, color: '#0f172a' }}>
                          {e.nombre}
                        </div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>
                          CC {e.cedula}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Empresa seleccionada */}
              {empresa && (
                <div style={{
                  marginTop: 16, background: '#f0fdf4',
                  border: '1px solid #bbf7d0', borderRadius: 8, padding: '12px 16px',
                }}>
                  <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 14 }}>
                    {empresa.nombre}
                  </div>
                  <div style={{ fontSize: 12, color: '#16a34a', marginTop: 2 }}>
                    CC {empresa.cedula} · {empresa.telefono || 'Sin teléfono'}
                  </div>
                </div>
              )}

              {/* Ventas de esa empresa */}
              {empresa && ventas.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>
                    Ventas recientes (opcional — vincular)
                  </div>
                  {ventas.slice(0, 5).map((v) => (
                    <div
                      key={v.id}
                      onClick={() => setVentaSel(ventaSel === v.id ? null : v.id)}
                      style={{
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', padding: '10px 14px',
                        border: `1px solid ${ventaSel === v.id ? '#16a34a' : '#e2e8f0'}`,
                        borderRadius: 8, marginBottom: 6, cursor: 'pointer',
                        background: ventaSel === v.id ? '#f0fdf4' : 'white',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>
                          Venta #{v.id} — {new Date(v.fecha).toLocaleDateString('es-CO')}
                        </div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>
                          {v.bodega_nombre || ''}
                        </div>
                      </div>
                      {ventaSel === v.id && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                          stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Paso 2: configurar cuenta ── */}
          {paso === 2 && (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>
                  Empresa
                </label>
                <div style={{
                  marginTop: 6, padding: '9px 12px',
                  background: '#f8fafc', border: '1px solid #e2e8f0',
                  borderRadius: 6, fontSize: 14, color: '#64748b',
                }}>
                  {empresa?.nombre}
                </div>
              </div>

              {esJefe && (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>
                    Bodega *
                  </label>
                  <select
                    value={bodega}
                    onChange={(e) => setBodega(e.target.value)}
                    required
                    style={{
                      width: '100%', marginTop: 6, padding: '9px 12px',
                      border: '1px solid #e2e8f0', borderRadius: 6,
                      fontSize: 14, outline: 'none', background: 'white',
                    }}
                  >
                    <option value="">Seleccionar bodega</option>
                    {bodegas.map((b) => (
                      <option key={b.id} value={b.id}>{b.nombre}</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>
                  Valor total *
                </label>
                <input
                  type="number"
                  value={valorTotal}
                  onChange={(e) => setValorTotal(e.target.value)}
                  placeholder="0"
                  min="1"
                  required
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    marginTop: 6, padding: '9px 12px',
                    border: '1px solid #e2e8f0', borderRadius: 6,
                    fontSize: 14, outline: 'none',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#16a34a'}
                  onBlur={(e)  => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>
                  Notas
                </label>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  rows={3}
                  placeholder="Observaciones sobre esta cuenta..."
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    marginTop: 6, padding: '9px 12px',
                    border: '1px solid #e2e8f0', borderRadius: 6,
                    fontSize: 14, outline: 'none', resize: 'vertical',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#16a34a'}
                  onBlur={(e)  => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>

              {error && (
                <div style={{
                  background: '#fef2f2', color: '#dc2626',
                  padding: '8px 12px', borderRadius: 6,
                  fontSize: 13, marginBottom: 12,
                }}>
                  {error}
                </div>
              )}
            </form>
          )}
        </div>

        {/* Pie */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid #f1f5f9',
          display: 'flex', justifyContent: 'space-between', gap: 10,
        }}>
          <button
            onClick={() => paso === 1 ? onClose() : setPaso(1)}
            style={{
              padding: '8px 20px', borderRadius: 6,
              border: '1px solid #e2e8f0', background: 'white',
              fontSize: 13, cursor: 'pointer', color: '#374151',
            }}
          >
            {paso === 1 ? 'Cancelar' : 'Atrás'}
          </button>
          {paso === 1 ? (
            <button
              onClick={() => empresa && setPaso(2)}
              disabled={!empresa}
              style={{
                padding: '8px 20px', borderRadius: 6,
                background: empresa ? '#16a34a' : '#e2e8f0',
                color: empresa ? 'white' : '#94a3b8',
                border: 'none', fontSize: 13,
                cursor: empresa ? 'pointer' : 'not-allowed', fontWeight: 600,
              }}
            >
              Siguiente
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                padding: '8px 20px', borderRadius: 6,
                background: loading ? '#86efac' : '#16a34a',
                color: 'white', border: 'none', fontSize: 13,
                cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600,
              }}
            >
              {loading ? 'Guardando...' : 'Crear cuenta'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}