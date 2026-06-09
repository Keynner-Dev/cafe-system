import { useState, useEffect, useRef } from 'react';
import { createCuentaPagar, updateCuentaPagar } from '../../api/cuentasPagar';
import { getTerceros } from '../../api/terceros';
import { getComprasPorCaficultor } from '../../api/compras';
import { useAuth } from '../../context/AuthContext';

const IconX = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconBack = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

function formatCOP(valor) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0,
  }).format(valor);
}

function getFechaHoy() {
  return new Date().toISOString().split('T')[0];
}

export default function CuentaPagarModal({ cuenta, bodegas, onCerrar, onGuardado }) {
  const { usuario } = useAuth();
  const esJefe = usuario?.rol === 'jefe';
  const editando = !!cuenta;

  // Paso 1: seleccionar caficultor
  // Paso 2: seleccionar compra y llenar datos
  const [paso, setPaso] = useState(1);

  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState([]);
  const [caficultor, setCaficultor] = useState(null);
  const [compras, setCompras] = useState([]);
  const [cargandoCompras, setCargandoCompras] = useState(false);
  const [compraSeleccionada, setCompraSeleccionada] = useState(null);

  const [form, setForm] = useState({
    descripcion: '',
    valor_total: '',
    fecha: getFechaHoy(),
    bodega: '',
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef(null);

  // Si es edición, precarga todo directamente en paso 2
  useEffect(() => {
    if (cuenta) {
      setCaficultor({ id: cuenta.caficultor, nombre: cuenta.caficultor_nombre });
      setBusqueda(cuenta.caficultor_nombre);
      setForm({
        descripcion: cuenta.descripcion,
        valor_total: cuenta.valor_total,
        fecha: cuenta.fecha,
        bodega: cuenta.bodega,
      });
      setPaso(2);
    }
  }, [cuenta]);

  const handleBusqueda = (valor) => {
    setBusqueda(valor);
    setCaficultor(null);
    clearTimeout(debounceRef.current);
    if (valor.length < 2) { setResultados([]); return; }
    debounceRef.current = setTimeout(() => {
      getTerceros({
        search: valor,
        tipo: 'caficultor'
        }).then(res => setResultados(res.data));
    }, 300);
  };

  const seleccionarCaficultor = (c) => {
    setCaficultor(c);
    setBusqueda(c.nombre);
    setResultados([]);
    // Cargar compras de este caficultor
    setCargandoCompras(true);
    getComprasPorCaficultor(c.id)
      .then(res => setCompras(res.data))
      .finally(() => setCargandoCompras(false));
  };

  const continuarPaso2 = () => {
    if (!caficultor) { setError('Selecciona un caficultor.'); return; }
    setError('');
    setPaso(2);
  };

  const seleccionarCompra = (compra) => {
    setCompraSeleccionada(compra);
    setForm(prev => ({
      ...prev,
      descripcion: `Compra #${compra.id} — ${compra.caficultor_nombre}`,
      valor_total: compra.total.toFixed(0),
      fecha: compra.fecha || getFechaHoy(),
    }));
  };

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (parseFloat(form.valor_total) <= 0) { setError('El valor debe ser mayor a cero.'); return; }
    if (esJefe && !form.bodega) { setError('Selecciona una bodega.'); return; }
    setGuardando(true);
    try {
      const datos = {
        caficultor: caficultor.id,
        compra: compraSeleccionada?.id || null,
        ...form,
      };
      if (!esJefe) delete datos.bodega;
      if (editando) {
        await updateCuentaPagar(cuenta.id, datos);
      } else {
        await createCuentaPagar(datos);
      }
      onGuardado();
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.detail || Object.values(data || {})[0] || 'Error al guardar.';
      setError(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setGuardando(false);
    }
  };

  const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 };
  const inputStyle = {
    width: '100%', padding: '9px 12px', fontSize: 14,
    border: '1px solid #e2e8f0', borderRadius: 6,
    outline: 'none', boxSizing: 'border-box', color: '#0f172a', background: 'white',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        background: 'white', borderRadius: 12, width: '100%', maxWidth: 500,
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)', display: 'flex',
        flexDirection: 'column', maxHeight: '90vh'
      }}>

        {/* Cabecera */}
        <div style={{
          padding: '18px 24px', borderBottom: '1px solid #f1f5f9',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {paso === 2 && !editando && (
              <button onClick={() => setPaso(1)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#64748b', padding: 4, display: 'flex'
              }}>
                <IconBack />
              </button>
            )}
            <div>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#0f172a' }}>
                {editando ? 'Editar cuenta' : paso === 1 ? 'Seleccionar caficultor' : 'Nueva cuenta por pagar'}
              </h2>
              {!editando && (
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94a3b8' }}>
                  Paso {paso} de 2
                </p>
              )}
            </div>
          </div>
          <button onClick={onCerrar} style={{
            background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4
          }}>
            <IconX />
          </button>
        </div>

        {/* ── PASO 1: Buscar caficultor ── */}
        {paso === 1 && (
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ position: 'relative' }}>
              <label style={labelStyle}>Buscar caficultor</label>
              <input
                type="text"
                value={busqueda}
                onChange={e => handleBusqueda(e.target.value)}
                placeholder="Nombre o cédula..."
                autoFocus
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#16a34a'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
              {resultados.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0,
                  background: 'white', border: '1px solid #e2e8f0', borderRadius: 6,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.1)', zIndex: 10,
                  maxHeight: 200, overflowY: 'auto'
                }}>
                  {resultados.map(c => (
                    <div
                      key={c.id}
                      onClick={() => seleccionarCaficultor(c)}
                      style={{
                        padding: '10px 14px', cursor: 'pointer', fontSize: 14,
                        color: '#0f172a', borderBottom: '1px solid #f1f5f9'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f0fdf4'}
                      onMouseLeave={e => e.currentTarget.style.background = 'white'}
                    >
                      <span style={{ fontWeight: 600 }}>{c.nombre}</span>
                      {c.cedula && <span style={{ color: '#94a3b8', fontSize: 12, marginLeft: 8 }}>{c.cedula}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Caficultor seleccionado */}
            {caficultor && (
              <div style={{
                background: '#f0fdf4', border: '1px solid #bbf7d0',
                borderRadius: 8, padding: '12px 16px',
                display: 'flex', alignItems: 'center', gap: 10
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', background: '#16a34a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 700, fontSize: 14, flexShrink: 0
                }}>
                  {caficultor.nombre.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                    {caficultor.nombre}
                  </p>
                  {cargandoCompras && (
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                      Cargando compras...
                    </p>
                  )}
                  {!cargandoCompras && (
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                      {compras.length} compra{compras.length !== 1 ? 's' : ''} registrada{compras.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fecaca',
                borderRadius: 6, padding: '10px 14px', fontSize: 13, color: '#dc2626'
              }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
              <button type="button" onClick={onCerrar} style={{
                padding: '9px 18px', borderRadius: 6, fontSize: 14, fontWeight: 600,
                background: 'white', border: '1px solid #e2e8f0', color: '#374151', cursor: 'pointer'
              }}>Cancelar</button>
              <button
                type="button"
                onClick={continuarPaso2}
                disabled={!caficultor}
                style={{
                  padding: '9px 18px', borderRadius: 6, fontSize: 14, fontWeight: 600,
                  background: caficultor ? '#16a34a' : '#86efac', color: 'white',
                  border: 'none', cursor: caficultor ? 'pointer' : 'not-allowed'
                }}
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* ── PASO 2: Seleccionar compra y datos ── */}
        {paso === 2 && (
          <form onSubmit={handleSubmit} style={{ overflowY: 'auto' }}>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Caficultor seleccionado — resumen */}
              <div style={{
                background: '#f8fafc', border: '1px solid #e2e8f0',
                borderRadius: 8, padding: '10px 14px',
                display: 'flex', alignItems: 'center', gap: 8
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', background: '#16a34a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 700, fontSize: 12, flexShrink: 0
                }}>
                  {caficultor?.nombre?.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                  {caficultor?.nombre}
                </span>
              </div>

              {/* Lista de compras del caficultor */}
              {!editando && (
                <div>
                  <label style={labelStyle}>
                    Vincular a una compra <span style={{ color: '#94a3b8', fontWeight: 400 }}>(opcional)</span>
                  </label>
                  {compras.length === 0 ? (
                    <div style={{
                      padding: '12px 14px', borderRadius: 8, fontSize: 13,
                      background: '#f8fafc', border: '1px solid #e2e8f0', color: '#94a3b8'
                    }}>
                      Este caficultor no tiene compras registradas
                    </div>
                  ) : (
                    <div style={{
                      border: '1px solid #e2e8f0', borderRadius: 8,
                      maxHeight: 180, overflowY: 'auto'
                    }}>
                      {/* Opción sin vincular */}
                      <div
                        onClick={() => { setCompraSeleccionada(null); setForm(prev => ({ ...prev, descripcion: '', valor_total: '' })); }}
                        style={{
                          padding: '10px 14px', cursor: 'pointer', fontSize: 13,
                          borderBottom: '1px solid #f1f5f9',
                          background: !compraSeleccionada ? '#f0fdf4' : 'white',
                          color: !compraSeleccionada ? '#16a34a' : '#64748b',
                          fontWeight: !compraSeleccionada ? 600 : 400,
                        }}
                        onMouseEnter={e => { if (compraSeleccionada) e.currentTarget.style.background = '#f8fafc'; }}
                        onMouseLeave={e => { if (compraSeleccionada) e.currentTarget.style.background = 'white'; }}
                      >
                        Sin vincular a compra específica
                      </div>
                      {compras.map(c => {
                        const seleccionada = compraSeleccionada?.id === c.id;
                        const tieneDeuda = !!c.cuenta_por_pagar;
                        return (
                          <div
                            key={c.id}
                            onClick={() => !tieneDeuda && seleccionarCompra(c)}
                            style={{
                              padding: '10px 14px', fontSize: 13,
                              borderBottom: '1px solid #f1f5f9',
                              background: seleccionada ? '#f0fdf4' : 'white',
                              cursor: tieneDeuda ? 'not-allowed' : 'pointer',
                              opacity: tieneDeuda ? 0.6 : 1,
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}
                            onMouseEnter={e => { if (!seleccionada && !tieneDeuda) e.currentTarget.style.background = '#f8fafc'; }}
                            onMouseLeave={e => { if (!seleccionada && !tieneDeuda) e.currentTarget.style.background = 'white'; }}
                          >
                            <div>
                              <span style={{ fontWeight: 600, color: '#0f172a' }}>
                                Compra #{c.id}
                              </span>
                              <span style={{ color: '#94a3b8', marginLeft: 8 }}>
                                {c.fecha ? new Date(c.fecha + 'T00:00:00').toLocaleDateString('es-CO') : ''}
                              </span>
                              <span style={{ color: '#16a34a', fontWeight: 600, marginLeft: 8 }}>
                                {formatCOP(c.total)}
                              </span>
                            </div>
                            {tieneDeuda && (
                              <span style={{
                                fontSize: 11, fontWeight: 600, padding: '2px 8px',
                                borderRadius: 20, background: '#fef2f2', color: '#dc2626'
                              }}>
                                Ya tiene deuda
                              </span>
                            )}
                            {seleccionada && !tieneDeuda && (
                              <span style={{
                                fontSize: 11, fontWeight: 600, padding: '2px 8px',
                                borderRadius: 20, background: '#f0fdf4', color: '#16a34a'
                              }}>
                                Seleccionada
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Bodega — solo jefe */}
              {esJefe && (
                <div>
                  <label style={labelStyle}>Bodega</label>
                  <select name="bodega" value={form.bodega} onChange={handleChange} required style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#16a34a'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}>
                    <option value="">Seleccionar bodega</option>
                    {bodegas.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                  </select>
                </div>
              )}

              {/* Fecha */}
              <div>
                <label style={labelStyle}>Fecha</label>
                <input type="date" name="fecha" value={form.fecha} onChange={handleChange} required style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#16a34a'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
              </div>

              {/* Descripción */}
              <div>
                <label style={labelStyle}>Descripción</label>
                <input type="text" name="descripcion" value={form.descripcion} onChange={handleChange}
                  placeholder="Ej: Compra café pergamino 200kg..." required maxLength={255} style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#16a34a'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
              </div>

              {/* Valor total */}
              <div>
                <label style={labelStyle}>Valor total</label>
                <input type="number" name="valor_total" value={form.valor_total} onChange={handleChange}
                  placeholder="0" min="1" required style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#16a34a'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
              </div>

              {error && (
                <div style={{
                  background: '#fef2f2', border: '1px solid #fecaca',
                  borderRadius: 6, padding: '10px 14px', fontSize: 13, color: '#dc2626'
                }}>
                  {error}
                </div>
              )}
            </div>

            {/* Pie */}
            <div style={{
              padding: '16px 24px', borderTop: '1px solid #f1f5f9',
              display: 'flex', justifyContent: 'flex-end', gap: 10
            }}>
              <button type="button" onClick={onCerrar} style={{
                padding: '9px 18px', borderRadius: 6, fontSize: 14, fontWeight: 600,
                background: 'white', border: '1px solid #e2e8f0', color: '#374151', cursor: 'pointer'
              }}>Cancelar</button>
              <button type="submit" disabled={guardando} style={{
                padding: '9px 18px', borderRadius: 6, fontSize: 14, fontWeight: 600,
                background: guardando ? '#86efac' : '#16a34a', color: 'white',
                border: 'none', cursor: guardando ? 'not-allowed' : 'pointer'
              }}>
                {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear cuenta'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}