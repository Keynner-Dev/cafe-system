import { useState } from 'react';
import { createMovimiento } from '../../api/caja';
import { useAuth } from '../../context/AuthContext';

const IconX = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default function MovimientoModal({ caja, cajas, onCerrar, onGuardado }) {
  const { usuario } = useAuth();
  const esJefe = usuario?.rol === 'jefe';

  const [form, setForm] = useState({
    tipo: 'ingreso',
    valor: '',
    descripcion: '',
    caja_id: caja.id,
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.valor || parseFloat(form.valor) <= 0) {
      setError('El valor debe ser mayor a cero.');
      return;
    }
    setGuardando(true);
    try {
      await createMovimiento(form.caja_id, {
        tipo: form.tipo,
        valor: form.valor,
        descripcion: form.descripcion,
      });
      onGuardado();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Error al registrar el movimiento.';
      setError(msg);
    } finally {
      setGuardando(false);
    }
  };

  const labelStyle = {
    display: 'block', fontSize: 13, fontWeight: 600,
    color: '#374151', marginBottom: 6
  };

  const inputStyle = {
    width: '100%', padding: '9px 12px', fontSize: 14,
    border: '1px solid #e2e8f0', borderRadius: 6,
    outline: 'none', boxSizing: 'border-box', color: '#0f172a',
    background: 'white',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        background: 'white', borderRadius: 12, width: '100%', maxWidth: 460,
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column',
        maxHeight: '90vh'
      }}>

        {/* Cabecera */}
        <div style={{
          padding: '18px 24px', borderBottom: '1px solid #f1f5f9',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#0f172a' }}>
            Registrar movimiento
          </h2>
          <button onClick={onCerrar} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#94a3b8', display: 'flex', padding: 4
          }}>
            <IconX />
          </button>
        </div>

        {/* Cuerpo */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto' }}>
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Selector de caja — solo jefe con varias cajas */}
            {esJefe && cajas.length > 1 && (
              <div>
                <label style={labelStyle}>Caja (bodega)</label>
                <select
                  name="caja_id"
                  value={form.caja_id}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  {cajas.map(c => (
                    <option key={c.id} value={c.id}>{c.bodega_nombre}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Tipo — admin solo ve ingreso */}
            <div>
              <label style={labelStyle}>Tipo</label>
              {esJefe ? (
                <select
                  name="tipo"
                  value={form.tipo}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="ingreso">Ingreso</option>
                  <option value="egreso">Egreso</option>
                </select>
              ) : (
                <div style={{
                  ...inputStyle, background: '#f8fafc', color: '#64748b',
                  display: 'flex', alignItems: 'center'
                }}>
                  Ingreso
                </div>
              )}
            </div>

            {/* Valor */}
            <div>
              <label style={labelStyle}>Valor</label>
              <input
                type="number"
                name="valor"
                value={form.valor}
                onChange={handleChange}
                placeholder="0"
                min="1"
                required
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#16a34a'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            {/* Descripción */}
            <div>
              <label style={labelStyle}>Descripción</label>
              <input
                type="text"
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                placeholder="Ej: Venta de café, pago de flete..."
                required
                maxLength={255}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#16a34a'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            {/* Error */}
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
            <button
              type="button"
              onClick={onCerrar}
              style={{
                padding: '9px 18px', borderRadius: 6, fontSize: 14, fontWeight: 600,
                background: 'white', border: '1px solid #e2e8f0', color: '#374151', cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              style={{
                padding: '9px 18px', borderRadius: 6, fontSize: 14, fontWeight: 600,
                background: guardando ? '#86efac' : '#16a34a', color: 'white',
                border: 'none', cursor: guardando ? 'not-allowed' : 'pointer'
              }}
            >
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}