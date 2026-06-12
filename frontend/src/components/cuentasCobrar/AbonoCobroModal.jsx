import { useState, useEffect } from 'react';
import { getAbonos, createAbono } from '../../api/cuentasCobrar';

const fmt = (n) =>
  Number(n).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

export default function AbonoCobroModal({ cuenta, onClose, onUpdated }) {
  const [abonos,  setAbonos]  = useState([]);
  const [valor,   setValor]   = useState('');
  const [notas,   setNotas]   = useState('');
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    getAbonos(cuenta.id)
      .then(setAbonos)
      .finally(() => setLoading(false));
  }, [cuenta.id]);

  const saldo = Number(cuenta.valor_total) - Number(cuenta.valor_cobrado);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!valor || Number(valor) <= 0) return setError('Ingresa un valor válido.');
    if (Number(valor) > saldo) return setError(`El abono supera el saldo (${fmt(saldo)}).`);
    setSaving(true);
    setError('');
    try {
      await createAbono(cuenta.id, { valor: Number(valor), notas });
      setValor(''); setNotas('');
      const updated = await getAbonos(cuenta.id);
      setAbonos(updated);
      onUpdated?.();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al registrar el abono.');
    } finally {
      setSaving(false);
    }
  };

  const badgeEstado = {
    pendiente: { bg: '#fef2f2', color: '#dc2626' },
    parcial:   { bg: '#fefce8', color: '#ca8a04' },
    pagado:    { bg: '#f0fdf4', color: '#16a34a' },
  };
  const b = badgeEstado[cuenta.estado] || badgeEstado.pendiente;

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(15,23,42,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: 'white', borderRadius: 12,
        width: '100%', maxWidth: 520,
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
              Abonos de cobranza
            </div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
              {cuenta.empresa_nombre}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Resumen */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          gap: 12, padding: '16px 24px',
          borderBottom: '1px solid #f1f5f9',
        }}>
          {[
            { label: 'Total',   value: fmt(cuenta.valor_total)   },
            { label: 'Cobrado', value: fmt(cuenta.valor_cobrado) },
            { label: 'Saldo',   value: fmt(saldo)                },
          ].map(({ label, value }) => (
            <div key={label} style={{
              background: '#f8fafc', borderRadius: 8,
              padding: '10px 14px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {label}
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginTop: 2 }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Cuerpo */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {/* Badge estado */}
          <div style={{ marginBottom: 16 }}>
            <span style={{
              background: b.bg, color: b.color,
              padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
            }}>
              {cuenta.estado.charAt(0).toUpperCase() + cuenta.estado.slice(1)}
            </span>
          </div>

          {/* Historial abonos */}
          <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>
            Historial de abonos
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                border: '3px solid #e2e8f0',
                borderTopColor: '#16a34a',
                animation: 'spin 0.7s linear infinite',
                margin: '0 auto',
              }}/>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          ) : abonos.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '20px 0',
              color: '#94a3b8', fontSize: 13,
            }}>
              Sin abonos registrados
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {abonos.map((a) => (
                <div key={a.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: '#f8fafc', borderRadius: 8, padding: '10px 14px',
                  border: '1px solid #e2e8f0',
                }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 14 }}>
                      {fmt(a.valor)}
                    </div>
                    {a.notas && (
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{a.notas}</div>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>
                    {new Date(a.fecha).toLocaleDateString('es-CO')}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Formulario nuevo abono */}
          {saldo > 0 && (
            <>
              <div style={{
                fontSize: 13, fontWeight: 600, color: '#374151',
                marginBottom: 10, marginTop: 4,
              }}>
                Registrar abono
              </div>
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>
                    Valor del abono *
                  </label>
                  <input
                    type="number"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    placeholder={`Máx. ${fmt(saldo)}`}
                    min="1"
                    step="1"
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
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>
                    Notas
                  </label>
                  <input
                    type="text"
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    placeholder="Referencia de pago, transferencia, etc."
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
                {error && (
                  <div style={{
                    background: '#fef2f2', color: '#dc2626',
                    padding: '8px 12px', borderRadius: 6,
                    fontSize: 13, marginBottom: 12,
                  }}>
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    width: '100%', padding: '10px 0',
                    background: saving ? '#86efac' : '#16a34a',
                    color: 'white', border: 'none',
                    borderRadius: 6, fontWeight: 600,
                    fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer',
                  }}
                >
                  {saving ? 'Registrando...' : 'Registrar abono'}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Pie */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid #f1f5f9',
          display: 'flex', justifyContent: 'flex-end',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px', borderRadius: 6,
              border: '1px solid #e2e8f0', background: 'white',
              fontSize: 13, cursor: 'pointer', color: '#374151',
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}