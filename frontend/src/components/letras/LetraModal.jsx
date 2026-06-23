import { useState, useEffect, useRef } from 'react';
import { getTerceros } from '../../api/terceros';
import { createLetra } from '../../api/letras';
import { getBodegas } from '../../api/inventario';
import { useAuth } from '../../context/AuthContext';

export default function LetraModal({ onClose, onCreated }) {
  const { usuario } = useAuth();
  const esJefe = usuario?.rol === 'jefe';

  const [bodegas, setBodegas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [dropdown, setDropdown] = useState(false);
  const [resultados, setResultados] = useState([]);
  const [caficultor, setCaficultor] = useState(null);
  const [bodega, setBodega] = useState(usuario?.bodega_id?.toString() || '');
  const [valorTotal, setValorTotal] = useState('');
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef(null);

  useEffect(() => {
    if (esJefe) getBodegas().then(res => setBodegas(res.data));
   }, [esJefe]);

  const buscarCaficultores = (texto) => {
    clearTimeout(debounceRef.current);
    setBusqueda(texto);
    setDropdown(true);
    setCaficultor(null);
    debounceRef.current = setTimeout(() => {
      if (texto.length < 2) { setResultados([]); return; }
      getTerceros({ buscar: texto, tipo: 'caficultor' }).then(res => setResultados(res.data));
    }, 300);
  };

  const seleccionarCaficultor = (c) => {
    setCaficultor(c);
    setBusqueda(c.nombre);
    setDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!caficultor) return setError('Selecciona un caficultor.');
    if (!valorTotal || Number(valorTotal) <= 0) return setError('Ingresa el valor del adelanto.');
    if (esJefe && !bodega) return setError('Selecciona una bodega.');
    setLoading(true); setError('');
    try {
      await createLetra({
        caficultor: caficultor.id,
        bodega: esJefe ? bodega : usuario?.bodega_id,
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
        width: '100%', maxWidth: 460,
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }}>
        {/* Cabecera */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontWeight: 600, fontSize: 16, color: '#0f172a' }}>
            Nueva letra de cambio
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Aviso de impacto en caja */}
        <div style={{
          margin: '16px 24px 0', padding: '10px 14px',
          background: '#fefce8', border: '1px solid #fde68a',
          borderRadius: 8, fontSize: 12, color: '#92400e',
        }}>
          Al crear esta letra se registrará un <strong>egreso automático</strong> en la caja de la bodega seleccionada.
        </div>

        {/* Cuerpo */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>
            Buscar caficultor *
          </label>
          <div style={{ position: 'relative', marginTop: 6, marginBottom: 16 }}>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => buscarCaficultores(e.target.value)}
              onFocus={() => busqueda.length >= 2 && setDropdown(true)}
              placeholder="Nombre o cédula..."
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '9px 12px', border: '1px solid #e2e8f0',
                borderRadius: 6, fontSize: 14, outline: 'none',
              }}
              onBlur={() => setTimeout(() => setDropdown(false), 150)}
            />
            {dropdown && resultados.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0,
                background: 'white', border: '1px solid #e2e8f0',
                borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                zIndex: 100, maxHeight: 200, overflowY: 'auto',
              }}>
                {resultados.map((c) => (
                  <div
                    key={c.id}
                    onMouseDown={() => seleccionarCaficultor(c)}
                    style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f8fafc' }}
                    onMouseEnter={(ev) => ev.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={(ev) => ev.currentTarget.style.background = 'white'}
                  >
                    <div style={{ fontWeight: 500, fontSize: 14, color: '#0f172a' }}>{c.nombre}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>CC {c.cedula}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {caficultor && (
            <div style={{
              marginBottom: 16, background: '#f0fdf4',
              border: '1px solid #bbf7d0', borderRadius: 8, padding: '12px 16px',
            }}>
              <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 14 }}>{caficultor.nombre}</div>
              <div style={{ fontSize: 12, color: '#16a34a', marginTop: 2 }}>
                CC {caficultor.cedula} · {caficultor.telefono || 'Sin teléfono'}
              </div>
            </div>
          )}

          {esJefe && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>Bodega *</label>
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
                {bodegas.map((b) => <option key={b.id} value={b.id}>{b.nombre}</option>)}
              </select>
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>
              Valor del adelanto *
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
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>Notas</label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={3}
              placeholder="Motivo del adelanto, condiciones, etc."
              style={{
                width: '100%', boxSizing: 'border-box',
                marginTop: 6, padding: '9px 12px',
                border: '1px solid #e2e8f0', borderRadius: 6,
                fontSize: 14, outline: 'none', resize: 'vertical',
              }}
              onFocus={(e) => e.target.style.borderColor = '#16a34a'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
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

        {/* Pie */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid #f1f5f9',
          display: 'flex', justifyContent: 'flex-end', gap: 10,
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px', borderRadius: 6,
              border: '1px solid #e2e8f0', background: 'white',
              fontSize: 13, cursor: 'pointer', color: '#374151',
            }}
          >
            Cancelar
          </button>
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
            {loading ? 'Guardando...' : 'Crear letra'}
          </button>
        </div>
      </div>
    </div>
  );
}