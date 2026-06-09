import { useState, useEffect } from 'react';
import { createGasto, updateGasto } from '../../api/gastos';
import { useAuth } from '../../context/AuthContext';

const IconX = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

function getFechaHoy() {
  return new Date().toISOString().split('T')[0];
}

export default function GastoModal({ gasto, bodegas, onCerrar, onGuardado }) {
  const { usuario } = useAuth();
  const esJefe = usuario?.rol === 'jefe';
  const editando = !!gasto;

  const [form, setForm] = useState({
    categoria: '',
    descripcion: '',
    valor: '',
    medio_pago: 'efectivo',
    fecha: getFechaHoy(),
    bodega: '',
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (gasto) {
      setForm({
        categoria: gasto.categoria,
        descripcion: gasto.descripcion,
        valor: gasto.valor,
        medio_pago: gasto.medio_pago,
        fecha: gasto.fecha,
        bodega: gasto.bodega,
      });
    }
  }, [gasto]);

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (parseFloat(form.valor) <= 0) {
      setError('El valor debe ser mayor a cero.');
      return;
    }
    if (esJefe && !form.bodega) {
      setError('Selecciona una bodega.');
      return;
    }
    setGuardando(true);
    try {
      const datos = { ...form };
      // Si es administrador, el backend asigna la bodega automáticamente
      if (!esJefe) delete datos.bodega;
      if (editando) {
        await updateGasto(gasto.id, datos);
      } else {
        await createGasto(datos);
      }
      onGuardado();
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.detail || Object.values(data || {})[0] || 'Error al guardar el gasto.';
      setError(Array.isArray(msg) ? msg[0] : msg);
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
    outline: 'none', boxSizing: 'border-box', color: '#0f172a', background: 'white',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        background: 'white', borderRadius: 12, width: '100%', maxWidth: 460,
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)', display: 'flex',
        flexDirection: 'column', maxHeight: '90vh'
      }}>

        {/* Cabecera */}
        <div style={{
          padding: '18px 24px', borderBottom: '1px solid #f1f5f9',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#0f172a' }}>
            {editando ? 'Editar gasto' : 'Registrar gasto'}
          </h2>
          <button onClick={onCerrar} style={{
            background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4
          }}>
            <IconX />
          </button>
        </div>

        {/* Cuerpo */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto' }}>
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

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
              <input type="date" name="fecha" value={form.fecha} onChange={handleChange}
                required style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#16a34a'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
            </div>

            {/* Categoría */}
            <div>
              <label style={labelStyle}>Categoría</label>
              <input type="text" name="categoria" value={form.categoria} onChange={handleChange}
                placeholder="Ej: Arriendo, Transporte, Servicios..." required maxLength={100}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#16a34a'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
            </div>

            {/* Descripción */}
            <div>
              <label style={labelStyle}>Descripción</label>
              <input type="text" name="descripcion" value={form.descripcion} onChange={handleChange}
                placeholder="Detalle del gasto..." required maxLength={255}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#16a34a'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
            </div>

            {/* Valor */}
            <div>
              <label style={labelStyle}>Valor</label>
              <input type="number" name="valor" value={form.valor} onChange={handleChange}
                placeholder="0" min="1" required style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#16a34a'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
            </div>

            {/* Medio de pago */}
            <div>
              <label style={labelStyle}>Medio de pago</label>
              <select name="medio_pago" value={form.medio_pago} onChange={handleChange} style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#16a34a'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}>
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
              </select>
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
            <button type="button" onClick={onCerrar} style={{
              padding: '9px 18px', borderRadius: 6, fontSize: 14, fontWeight: 600,
              background: 'white', border: '1px solid #e2e8f0', color: '#374151', cursor: 'pointer'
            }}>
              Cancelar
            </button>
            <button type="submit" disabled={guardando} style={{
              padding: '9px 18px', borderRadius: 6, fontSize: 14, fontWeight: 600,
              background: guardando ? '#86efac' : '#16a34a', color: 'white',
              border: 'none', cursor: guardando ? 'not-allowed' : 'pointer'
            }}>
              {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}