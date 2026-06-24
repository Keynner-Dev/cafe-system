import { useState, useEffect } from 'react';
import { getGastos, deleteGasto } from '../../api/gastos';
import { getBodegas } from '../../api/inventario';
import { useAuth } from '../../context/AuthContext';
import GastoModal from '../../components/gastos/GastosModal';

const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);
const IconExport = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

function formatCOP(valor) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0,
  }).format(valor);
}

function getMesActual() {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
}

function formatMesLabel(mes) {
  if (!mes) return 'Todos los períodos';
  const [anio, m] = mes.split('-');
  const fecha = new Date(Number(anio), Number(m) - 1, 1);
  return fecha.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
}

// ── Genera y abre el reporte imprimible ──────────────────────────────────────
function exportarReporte({ gastos, filtroMes, filtroBodega, bodegas }) {
  const bodegaNombre = filtroBodega
    ? bodegas.find(b => String(b.id) === String(filtroBodega))?.nombre || 'Bodega'
    : 'Todas las bodegas';

  const periodoLabel = formatMesLabel(filtroMes);
  const total = gastos.reduce((acc, g) => acc + parseFloat(g.valor), 0);

  // Resumen por categoría
  const porCategoria = {};
  gastos.forEach(g => {
    if (!porCategoria[g.categoria]) porCategoria[g.categoria] = 0;
    porCategoria[g.categoria] += parseFloat(g.valor);
  });
  const categorias = Object.entries(porCategoria).sort((a, b) => b[1] - a[1]);

  // Resumen por medio de pago
  const efectivo = gastos.filter(g => g.medio_pago === 'efectivo').reduce((acc, g) => acc + parseFloat(g.valor), 0);
  const transferencia = gastos.filter(g => g.medio_pago === 'transferencia').reduce((acc, g) => acc + parseFloat(g.valor), 0);

  const filasDetalle = gastos.map(g => `
    <tr>
      <td>${new Date(g.fecha + 'T00:00:00').toLocaleDateString('es-CO')}</td>
      <td><span class="badge">${g.categoria}</span></td>
      <td>${g.descripcion}</td>
      <td>${g.bodega_nombre}</td>
      <td><span class="medio ${g.medio_pago}">${g.medio_pago === 'efectivo' ? 'Efectivo' : 'Transferencia'}</span></td>
      <td style="text-align:right;font-weight:600;color:#dc2626">${formatCOP(g.valor)}</td>
    </tr>
  `).join('');

  const filasCategorias = categorias.map(([cat, val]) => `
    <tr>
      <td>${cat}</td>
      <td style="text-align:right;font-weight:600">${formatCOP(val)}</td>
      <td style="text-align:right;color:#64748b;font-size:12px">${((val / total) * 100).toFixed(1)}%</td>
    </tr>
  `).join('');

  const ventana = window.open('', '_blank', 'width=900,height=750');
  ventana.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Reporte de Gastos — Café San Joaquín</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 36px; color: #0f172a; font-size: 13px; }

        /* Cabecera */
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 2px solid #e2e8f0; }
        .logo h1 { font-size: 20px; font-weight: 700; }
        .logo p { font-size: 12px; color: #64748b; margin-top: 2px; }
        .meta { text-align: right; }
        .meta .titulo { font-size: 18px; font-weight: 700; color: #16a34a; }
        .meta .sub { font-size: 12px; color: #64748b; margin-top: 3px; }

        /* Tarjetas resumen */
        .cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
        .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; }
        .card.green { background: #f0fdf4; border-color: #bbf7d0; }
        .card label { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 4px; }
        .card .val { font-size: 18px; font-weight: 700; color: #0f172a; }
        .card.green .val { color: #16a34a; }

        /* Sección */
        .seccion { margin-bottom: 24px; }
        .seccion h2 { font-size: 13px; font-weight: 700; color: '#475569'; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0; }

        /* Tablas */
        table { width: 100%; border-collapse: collapse; }
        th { background: #0f172a; color: white; padding: 9px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
        td { padding: 9px 12px; border-bottom: 1px solid #f1f5f9; }
        tr:nth-child(even) td { background: #f8fafc; }

        /* Badges */
        .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; background: #eff6ff; color: #2563eb; }
        .medio { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; }
        .medio.efectivo { background: #fefce8; color: #ca8a04; }
        .medio.transferencia { background: #f0fdf4; color: #16a34a; }

        /* Total final */
        .total-final { background: #0f172a; color: white; border-radius: 8px; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; margin-top: 20px; }
        .total-final span { font-size: 13px; color: #94a3b8; }
        .total-final strong { font-size: 24px; font-weight: 700; }

        /* Footer */
        .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; display: flex; justify-content: space-between; }

        @media print {
          body { padding: 20px; }
          button { display: none; }
        }
      </style>
    </head>
    <body>

      <div class="header">
        <div class="logo">
          <h1>☕ Café San Joaquín</h1>
          <p>NIT. 901659573-6</p>
        </div>
        <div class="meta">
          <div class="titulo">Reporte de Gastos</div>
          <div class="sub">${periodoLabel} · ${bodegaNombre}</div>
          <div class="sub" style="margin-top:2px">${gastos.length} registro${gastos.length !== 1 ? 's' : ''}</div>
        </div>
      </div>

      <!-- Tarjetas resumen -->
      <div class="cards">
        <div class="card green">
          <label>Total gastos</label>
          <div class="val">${formatCOP(total)}</div>
        </div>
        <div class="card">
          <label>En efectivo</label>
          <div class="val">${formatCOP(efectivo)}</div>
        </div>
        <div class="card">
          <label>Por transferencia</label>
          <div class="val">${formatCOP(transferencia)}</div>
        </div>
        <div class="card">
          <label>Categorías</label>
          <div class="val">${categorias.length}</div>
        </div>
      </div>

      <!-- Resumen por categoría -->
      <div class="seccion">
        <h2>Resumen por categoría</h2>
        <table>
          <thead>
            <tr>
              <th>Categoría</th>
              <th style="text-align:right">Total</th>
              <th style="text-align:right">% del total</th>
            </tr>
          </thead>
          <tbody>${filasCategorias}</tbody>
        </table>
      </div>

      <!-- Detalle completo -->
      <div class="seccion">
        <h2>Detalle de gastos</h2>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Categoría</th>
              <th>Descripción</th>
              <th>Bodega</th>
              <th>Medio de pago</th>
              <th style="text-align:right">Valor</th>
            </tr>
          </thead>
          <tbody>${filasDetalle}</tbody>
        </table>
      </div>

      <div class="total-final">
        <span>Total del período</span>
        <strong>${formatCOP(total)}</strong>
      </div>

      <div class="footer">
        <span>Café San Joaquín SAS · Reporte generado el ${new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
        <span>Para uso contable interno</span>
      </div>

      <script>window.onload = () => window.print()</script>
    </body>
    </html>
  `);
  ventana.document.close();
}

// ────────────────────────────────────────────────────────────────────────────

export default function GastosPage() {
  const { usuario } = useAuth();
  const esJefe = usuario?.rol === 'jefe';

  const [gastos, setGastos] = useState([]);
  const [bodegas, setBodegas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [gastoEditando, setGastoEditando] = useState(null);
  const [filtroMes, setFiltroMes] = useState(getMesActual());
  const [filtroBodega, setFiltroBodega] = useState('');
  const [confirmandoId, setConfirmandoId] = useState(null);

  const cargarGastos = () => {
    setCargando(true);
    const params = {};
    if (filtroMes) params.mes = filtroMes;
    if (filtroBodega) params.bodega = filtroBodega;
    getGastos(params)
      .then(res => setGastos(res.data))
      .finally(() => setCargando(false));
  };

  useEffect(() => { cargarGastos(); }, [filtroMes, filtroBodega]);

  useEffect(() => {
    if (esJefe) getBodegas().then(res => setBodegas(res.data));
  }, []);

  const handleEliminar = async (id) => {
    await deleteGasto(id);
    setConfirmandoId(null);
    cargarGastos();
  };

  const totalMes = gastos.reduce((acc, g) => acc + parseFloat(g.valor), 0);

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100, margin: '0 auto' }}>

      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>Gastos</h1>
          <p style={{ color: '#64748b', fontSize: 14, margin: '4px 0 0' }}>
            Registro de egresos operativos por bodega
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {/* Exportar reporte — solo jefe */}
          {esJefe && gastos.length > 0 && (
            <button
              onClick={() => exportarReporte({ gastos, filtroMes, filtroBodega, bodegas })}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'white', color: '#0f172a',
                border: '1px solid #e2e8f0',
                borderRadius: 6, padding: '9px 18px', fontSize: 14,
                fontWeight: 600, cursor: 'pointer'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}
            >
              <IconExport /> Exportar reporte
            </button>
          )}
          <button
            onClick={() => { setGastoEditando(null); setModalAbierto(true); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#16a34a', color: 'white', border: 'none',
              borderRadius: 6, padding: '9px 18px', fontSize: 14,
              fontWeight: 600, cursor: 'pointer'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#15803d'}
            onMouseLeave={e => e.currentTarget.style.background = '#16a34a'}
          >
            <IconPlus /> Registrar gasto
          </button>
        </div>
      </div>

      {/* Tarjeta total del mes */}
      <div style={{
        background: '#0f172a', borderRadius: 12, padding: '20px 28px',
        marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ color: 'white' }}>
          <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>
            Total gastos — {formatMesLabel(filtroMes)}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 32, fontWeight: 700, letterSpacing: '-0.5px' }}>
            {formatCOP(totalMes)}
          </p>
        </div>
        <div style={{ color: '#475569', fontSize: 13 }}>
          {gastos.length} registro{gastos.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          type="month"
          value={filtroMes}
          onChange={e => setFiltroMes(e.target.value)}
          style={{
            padding: '8px 12px', fontSize: 14, borderRadius: 6,
            border: '1px solid #e2e8f0', color: '#0f172a', outline: 'none'
          }}
          onFocus={e => e.target.style.borderColor = '#16a34a'}
          onBlur={e => e.target.style.borderColor = '#e2e8f0'}
        />
        {esJefe && bodegas.length > 0 && (
          <select
            value={filtroBodega}
            onChange={e => setFiltroBodega(e.target.value)}
            style={{
              padding: '8px 12px', fontSize: 14, borderRadius: 6,
              border: '1px solid #e2e8f0', color: '#0f172a', outline: 'none'
            }}
            onFocus={e => e.target.style.borderColor = '#16a34a'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          >
            <option value="">Todas las bodegas</option>
            {bodegas.map(b => (
              <option key={b.id} value={b.id}>{b.nombre}</option>
            ))}
          </select>
        )}
        {(filtroMes || filtroBodega) && (
          <button
            onClick={() => { setFiltroMes(''); setFiltroBodega(''); }}
            style={{
              padding: '8px 14px', fontSize: 13, borderRadius: 6,
              border: '1px solid #e2e8f0', background: 'white',
              color: '#64748b', cursor: 'pointer'
            }}
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Tabla */}
      <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {cargando ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              border: '3px solid #e2e8f0', borderTopColor: '#16a34a',
              animation: 'spin 0.8s linear infinite'
            }} />
          </div>
        ) : gastos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8', fontSize: 14 }}>
            No hay gastos registrados para este período
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0f172a' }}>
                {['Fecha', 'Categoría', 'Descripción', 'Medio de pago', esJefe && 'Bodega', 'Valor', 'Acciones']
                  .filter(Boolean).map(col => (
                  <th key={col} style={{
                    padding: '11px 16px', textAlign: 'left', fontSize: 12,
                    fontWeight: 600, color: '#e2e8f0',
                    textTransform: 'uppercase', letterSpacing: '0.05em'
                  }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gastos.map((g, i) => (
                <tr
                  key={g.id}
                  style={{ background: i % 2 === 0 ? 'white' : '#f8fafc', borderBottom: '1px solid #f1f5f9' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f0fdf4'}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'white' : '#f8fafc'}
                >
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#64748b' }}>
                    {new Date(g.fecha + 'T00:00:00').toLocaleDateString('es-CO')}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                      fontSize: 12, fontWeight: 600,
                      background: '#eff6ff', color: '#2563eb'
                    }}>
                      {g.categoria}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: '#0f172a' }}>
                    {g.descripcion}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                      fontSize: 12, fontWeight: 600,
                      background: g.medio_pago === 'efectivo' ? '#fefce8' : '#f0fdf4',
                      color: g.medio_pago === 'efectivo' ? '#ca8a04' : '#16a34a',
                    }}>
                      {g.medio_pago === 'efectivo' ? 'Efectivo' : 'Transferencia'}
                    </span>
                  </td>
                  {esJefe && (
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#64748b' }}>
                      {g.bodega_nombre}
                    </td>
                  )}
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600, color: '#dc2626' }}>
                    {formatCOP(g.valor)}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => { setGastoEditando(g); setModalAbierto(true); }}
                        style={{
                          padding: '5px 10px', borderRadius: 5, fontSize: 12,
                          border: '1px solid #e2e8f0', background: 'white',
                          color: '#374151', cursor: 'pointer', display: 'flex',
                          alignItems: 'center', gap: 4
                        }}
                      >
                        <IconEdit /> Editar
                      </button>

                      {confirmandoId === g.id ? (
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                          <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 500 }}>¿Eliminar?</span>
                          <button
                            onClick={() => handleEliminar(g.id)}
                            style={{
                              padding: '5px 10px', borderRadius: 5, fontSize: 12,
                              border: 'none', background: '#dc2626',
                              color: 'white', cursor: 'pointer'
                            }}
                          >
                            Sí
                          </button>
                          <button
                            onClick={() => setConfirmandoId(null)}
                            style={{
                              padding: '5px 10px', borderRadius: 5, fontSize: 12,
                              border: '1px solid #e2e8f0', background: 'white',
                              color: '#374151', cursor: 'pointer'
                            }}
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmandoId(g.id)}
                          style={{
                            padding: '5px 10px', borderRadius: 5, fontSize: 12,
                            border: '1px solid #fecaca', background: '#fef2f2',
                            color: '#dc2626', cursor: 'pointer', display: 'flex',
                            alignItems: 'center', gap: 4
                          }}
                        >
                          <IconTrash /> Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalAbierto && (
        <GastoModal
          gasto={gastoEditando}
          bodegas={bodegas}
          onCerrar={() => { setModalAbierto(false); setGastoEditando(null); }}
          onGuardado={() => { setModalAbierto(false); setGastoEditando(null); cargarGastos(); }}
        />
      )}
    </div>
  );
}