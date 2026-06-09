import { useState } from 'react';
import { createAbono } from '../../api/cuentasPagar';

const IconX = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
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

export default function AbonoModal({ cuenta, onCerrar, onGuardado }) {
  const [form, setForm] = useState({
    valor: '',
    medio_pago: 'efectivo',
    nota: '',
    fecha: getFechaHoy(),
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const valor = parseFloat(form.valor);
    if (!valor || valor <= 0) { setError('El valor debe ser mayor a cero.'); return; }
    if (valor > parseFloat(cuenta.saldo)) {
      setError(`El abono no puede superar el saldo pendiente (${formatCOP(cuenta.saldo)}).`);
      return;
    }
    setGuardando(true);
    try {
      await createAbono(cuenta.id, form);
      onGuardado();
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.detail || Object.values(data || {})[0] || 'Error al registrar el abono.';
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
        background: 'white', borderRadius: 12, width: '100%', maxWidth: 440,
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column'
      }}>
        {/* Cabecera */}
        <div style={{
          padding: '18px 24px', borderBottom: '1px solid #f1f5f9',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#0f172a' }}>
              Registrar abono
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>
              {cuenta.caficultor_nombre}
            </p>
          </div>
          <button onClick={onCerrar} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}>
            <IconX />
          </button>
        </div>

        {/* Info saldo */}
        <div style={{
          margin: '16px 24px 0', padding: '12px 16px', borderRadius: 8,
          background: '#f8fafc', border: '1px solid #e2e8f0',
          display: 'flex', justifyContent: 'space-between'
        }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Total</p>
            <p style={{ margin: '2px 0 0', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{formatCOP(cuenta.valor_total)}</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Pagado</p>
            <p style={{ margin: '2px 0 0', fontSize: 15, fontWeight: 700, color: '#16a34a' }}>{formatCOP(cuenta.valor_pagado)}</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Saldo</p>
            <p style={{ margin: '2px 0 0', fontSize: 15, fontWeight: 700, color: '#dc2626' }}>{formatCOP(cuenta.saldo)}</p>
          </div>
        </div>

        {/* Cuerpo */}
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div>
              <label style={labelStyle}>Fecha</label>
              <input type="date" name="fecha" value={form.fecha} onChange={handleChange} required style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#16a34a'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
            </div>

            <div>
              <label style={labelStyle}>Valor del abono</label>
              <input type="number" name="valor" value={form.valor} onChange={handleChange}
                placeholder="0" min="1" required style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#16a34a'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
            </div>

            <div>
              <label style={labelStyle}>Medio de pago</label>
              <select name="medio_pago" value={form.medio_pago} onChange={handleChange} style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#16a34a'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}>
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Nota <span style={{ color: '#94a3b8', fontWeight: 400 }}>(opcional)</span></label>
              <input type="text" name="nota" value={form.nota} onChange={handleChange}
                placeholder="Observación del abono..." maxLength={255} style={inputStyle}
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
              {guardando ? 'Guardando...' : 'Registrar abono'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}