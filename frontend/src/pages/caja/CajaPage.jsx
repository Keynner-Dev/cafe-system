import { useState, useEffect } from 'react';
import { getCajas, getCajasDestino, getMovimientos, cerrarCaja, abrirCaja, createTraslado, getHistorialCierres } from '../../api/caja';
import { useAuth } from '../../context/AuthContext';
import MovimientoModal from '../../components/caja/MovimientoModal';

const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
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
const IconLock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const IconUnlock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
  </svg>
);
const IconTransfer = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12h14"/><path d="M12 5l7 7-7 7"/>
  </svg>
);
const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconHistory = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
    <path d="M3 3v5h5"/>
    <path d="M12 7v5l4 2"/>
  </svg>
);
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

// ── Modal cierre ─────────────────────────────────────────────────────────────
function CierreModal({ caja, onCerrar, onConfirmar }) {
  const [saldoFisico, setSaldoFisico] = useState('');
  const [nota, setNota]               = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);

  const saldoTeorico = Number(caja.saldo_actual);
  const diferencia   = saldoFisico !== '' ? Number(saldoFisico) - saldoTeorico : null;

  const handleSubmit = async () => {
    if (saldoFisico === '') { setError('Debes ingresar el efectivo contado.'); return; }
    setLoading(true); setError(null);
    try {
      await cerrarCaja(caja.id, { saldo_fisico: Number(saldoFisico), nota });
      onConfirmar();
    } catch (e) {
      setError(e.response?.data?.detail || 'Error al cerrar la caja.');
    } finally { setLoading(false); }
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 16 }}>
      <div style={{ background: 'white', borderRadius: 12, width: '100%', maxWidth: 420,
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '18px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', margin: 0 }}>Cerrar caja</h2>
            <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>{caja.bodega_nombre}</p>
          </div>
          <button onClick={onCerrar} style={{ width: 30, height: 30, borderRadius: 6, border: 'none',
            background: 'transparent', cursor: 'pointer', color: '#94a3b8',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconX /></button>
        </div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: 6, padding: '10px 12px', color: '#dc2626', fontSize: 12 }}>{error}</div>}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '14px 16px' }}>
            <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Saldo teórico en sistema</p>
            <p style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: '4px 0 0' }}>
              {formatCOP(saldoTeorico)}</p>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#475569', marginBottom: 5 }}>
              Efectivo físico contado *</label>
            <input type="number" value={saldoFisico} onChange={e => setSaldoFisico(e.target.value)}
              placeholder="0" min="0" autoFocus
              style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #e2e8f0',
                borderRadius: 6, padding: '9px 12px', fontSize: 16, color: '#0f172a',
                outline: 'none', background: 'white', fontWeight: 600 }}
              onFocus={e => e.target.style.borderColor = '#16a34a'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
          </div>
          {diferencia !== null && (
            <div style={{ background: diferencia === 0 ? '#f0fdf4' : diferencia > 0 ? '#eff6ff' : '#fef2f2',
              border: `1px solid ${diferencia === 0 ? '#bbf7d0' : diferencia > 0 ? '#bfdbfe' : '#fecaca'}`,
              borderRadius: 8, padding: '12px 16px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#475569' }}>Diferencia</span>
              <span style={{ fontSize: 16, fontWeight: 700,
                color: diferencia === 0 ? '#16a34a' : diferencia > 0 ? '#2563eb' : '#dc2626' }}>
                {diferencia > 0 ? '+' : ''}{formatCOP(diferencia)}</span>
            </div>
          )}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#475569', marginBottom: 5 }}>
              Nota (opcional)</label>
            <textarea value={nota} onChange={e => setNota(e.target.value)} rows={2}
              placeholder="Observación sobre el cierre..."
              style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #e2e8f0',
                borderRadius: 6, padding: '8px 12px', fontSize: 13, color: '#0f172a',
                outline: 'none', background: 'white', resize: 'vertical' }}
              onFocus={e => e.target.style.borderColor = '#16a34a'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, padding: '0 20px 20px' }}>
          <button onClick={onCerrar} style={{ flex: 1, padding: 9, border: '1px solid #e2e8f0',
            borderRadius: 6, background: 'white', color: '#475569', fontSize: 13,
            fontWeight: 500, cursor: 'pointer' }}>Cancelar</button>
          <button onClick={handleSubmit} disabled={loading}
            style={{ flex: 1, padding: 9, border: 'none', borderRadius: 6,
              background: loading ? '#94a3b8' : '#0f172a', color: 'white',
              fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Cerrando...' : 'Confirmar cierre'}</button>
        </div>
      </div>
    </div>
  );
}

// ── Modal traslado de dinero ──────────────────────────────────────────────────
function TrasladoModal({ cajas, cajaOrigen, onCerrar, onConfirmar }) {
  const cajasDestino = cajas.filter(c => c.id !== cajaOrigen?.id);

  const [form, setForm] = useState({
    caja_origen:  cajaOrigen?.id || '',
    caja_destino: cajasDestino[0]?.id || '',
    valor: '',
    nota: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const cajaOrigenActual = cajaOrigen || cajas.find(c => c.id === Number(form.caja_origen));
  const saldoDisponible  = Number(cajaOrigenActual?.saldo_actual || 0);

  const handleSubmit = async () => {
    if (!form.valor || Number(form.valor) <= 0) {
      setError('El valor debe ser mayor a cero.'); return;
    }
    if (Number(form.valor) > saldoDisponible) {
      setError(`Saldo insuficiente. Disponible: ${formatCOP(saldoDisponible)}`); return;
    }
    if (!form.caja_destino) { setError('Selecciona una caja destino.'); return; }

    setLoading(true); setError(null);
    try {
      await createTraslado({
        caja_origen:  Number(form.caja_origen),
        caja_destino: Number(form.caja_destino),
        valor: Number(form.valor),
        nota: form.nota,
      });
      onConfirmar();
    } catch (e) {
      setError(e.response?.data?.detail || JSON.stringify(e.response?.data) || 'Error al trasladar.');
    } finally { setLoading(false); }
  };

  const inputStyle = {
    width: '100%', boxSizing: 'border-box', border: '1px solid #e2e8f0',
    borderRadius: 6, padding: '9px 12px', fontSize: 13, color: '#0f172a',
    outline: 'none', background: 'white',
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 16 }}>
      <div style={{ background: 'white', borderRadius: 12, width: '100%', maxWidth: 440,
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '18px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', margin: 0 }}>
              Trasladar dinero</h2>
            <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>
              Entre cajas de diferentes bodegas</p>
          </div>
          <button onClick={onCerrar} style={{ width: 30, height: 30, borderRadius: 6, border: 'none',
            background: 'transparent', cursor: 'pointer', color: '#94a3b8',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconX /></button>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: 6, padding: '10px 12px', color: '#dc2626', fontSize: 12 }}>{error}</div>}

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#475569', marginBottom: 5 }}>
              Caja origen</label>
            <select value={form.caja_origen}
              onChange={e => setForm(p => ({ ...p, caja_origen: e.target.value, caja_destino: '' }))}
              disabled={!!cajaOrigen}
              style={{ ...inputStyle, background: cajaOrigen ? '#f8fafc' : 'white' }}
              onFocus={e => e.target.style.borderColor = '#16a34a'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}>
              {cajaOrigen ? (
                <option value={cajaOrigen.id}>
                  {cajaOrigen.bodega_nombre} — {formatCOP(cajaOrigen.saldo_actual)}
                </option>
              ) : (
                cajas.map(c => (
                  <option key={c.id} value={c.id}>{c.bodega_nombre} — {formatCOP(c.saldo_actual)}</option>
                ))
              )}
            </select>
            {cajaOrigenActual && (
              <p style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                Saldo disponible: <strong>{formatCOP(saldoDisponible)}</strong>
              </p>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
            <IconTransfer />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#475569', marginBottom: 5 }}>
              Caja destino</label>
            <select value={form.caja_destino}
              onChange={e => setForm(p => ({ ...p, caja_destino: e.target.value }))}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#16a34a'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}>
              <option value="">Selecciona una caja</option>
              {cajas.filter(c => c.id !== Number(form.caja_origen)).map(c => (
                <option key={c.id} value={c.id}>{c.bodega_nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#475569', marginBottom: 5 }}>
              Valor a trasladar *</label>
            <input type="number" value={form.valor}
              onChange={e => setForm(p => ({ ...p, valor: e.target.value }))}
              placeholder="0" min="1" autoFocus
              style={{ ...inputStyle, fontSize: 15, fontWeight: 600 }}
              onFocus={e => e.target.style.borderColor = '#16a34a'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#475569', marginBottom: 5 }}>
              Nota (opcional)</label>
            <textarea value={form.nota} onChange={e => setForm(p => ({ ...p, nota: e.target.value }))}
              rows={2} placeholder="Motivo del traslado..."
              style={{ ...inputStyle, resize: 'vertical' }}
              onFocus={e => e.target.style.borderColor = '#16a34a'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, padding: '0 20px 20px' }}>
          <button onClick={onCerrar} style={{ flex: 1, padding: 9, border: '1px solid #e2e8f0',
            borderRadius: 6, background: 'white', color: '#475569', fontSize: 13,
            fontWeight: 500, cursor: 'pointer' }}>Cancelar</button>
          <button onClick={handleSubmit} disabled={loading}
            style={{ flex: 1, padding: 9, border: 'none', borderRadius: 6,
              background: loading ? '#86efac' : '#16a34a', color: 'white',
              fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Trasladando...' : 'Confirmar traslado'}</button>
        </div>
      </div>
    </div>
  );
}

// ── Detección de pestaña duplicada (ítem 20) ──────────────────────────────────
// Cada pestaña que monta CajaPage genera un id propio y anuncia su
// presencia por BroadcastChannel. Si ya hay otra pestaña activa con Caja
// abierta, esta nueva pestaña queda bloqueada para ACCIONES (registrar
// movimiento, cerrar/abrir caja, trasladar) pero sigue mostrando los
// datos con normalidad — sigue siendo útil para solo consultar.
//
// Esto NO sustituye la protección real de datos (ítem 21, select_for_
// update() en backend): es solo para que el mismo usuario no se confunda
// teniendo dos pestañas de Caja abiertas en su propio navegador. Si dos
// usuarios distintos entran desde dispositivos distintos, este mecanismo
// no los detecta entre sí — eso ya está cubierto por el backend.
//
// Degrada sin romper nada si el navegador no soporta BroadcastChannel
// (poco probable hoy, pero por seguridad).
const CANAL_CAJA = 'caja-pestanas';
const soportaBroadcastChannel = typeof BroadcastChannel !== 'undefined';

function usarDeteccionPestanaDuplicada() {
  const [pestanaBloqueada, setPestanaBloqueada] = useState(false);

  useEffect(() => {
    if (!soportaBroadcastChannel) return;

    const miId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const canal = new BroadcastChannel(CANAL_CAJA);

    const handleMensaje = (e) => {
      const msg = e.data;
      if (!msg || msg.id === miId) return;

      if (msg.tipo === 'ping') {
        canal.postMessage({ tipo: 'pong', id: miId });
      } else if (msg.tipo === 'pong') {
        setPestanaBloqueada(true);
      } else if (msg.tipo === 'cerrando') {
        setPestanaBloqueada(false);
      }
    };

    canal.addEventListener('message', handleMensaje);
    canal.postMessage({ tipo: 'ping', id: miId });

    const avisarSalida = () => {
      canal.postMessage({ tipo: 'cerrando', id: miId });
    };
    window.addEventListener('beforeunload', avisarSalida);

    return () => {
      avisarSalida();
      window.removeEventListener('beforeunload', avisarSalida);
      canal.removeEventListener('message', handleMensaje);
      canal.close();
    };
  }, []);

  return pestanaBloqueada;
}

// ── Banner de pestaña duplicada ───────────────────────────────────────────────
function BannerPestanaDuplicada() {
  return (
    <div style={{
      background: '#fffbeb', border: '1px solid #fde68a',
      borderRadius: 10, padding: '14px 18px', marginBottom: 20,
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{ background: '#fef3c7', borderRadius: 8, padding: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ca8a04', flexShrink: 0 }}>
        <IconLock />
      </div>
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#92400e', margin: 0 }}>
          Caja ya está abierta en otra pestaña
        </p>
        <p style={{ fontSize: 12, color: '#a16207', margin: '2px 0 0' }}>
          Puedes seguir consultando aquí, pero registrar movimientos, cerrar caja o
          trasladar dinero está bloqueado en esta pestaña para evitar confusiones.
          Cierra la otra pestaña para volver a habilitar las acciones aquí.
        </p>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function CajaPage() {
  const { usuario } = useAuth();
  const esJefe = usuario?.rol === 'jefe';
  const pestanaBloqueada = usarDeteccionPestanaDuplicada();

  const [cajas,             setCajas]             = useState([]);
  const [cajasDestino,      setCajasDestino]      = useState([]);
  const [cajaSeleccionada,  setCajaSeleccionada]  = useState(null);
  const [movimientos,       setMovimientos]       = useState([]);
  const [historialCierres,  setHistorialCierres]  = useState([]);
  const [cargandoCajas,     setCargandoCajas]     = useState(true);
  const [cargandoMov,       setCargandoMov]       = useState(false);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [modalAbierto,      setModalAbierto]      = useState(false);
  const [modalCierre,       setModalCierre]       = useState(false);
  const [modalTraslado,     setModalTraslado]     = useState(false);
  const [filtroTipo,        setFiltroTipo]        = useState('todos');
  const [loadingAbrir,      setLoadingAbrir]      = useState(false);
  const [tabActiva,         setTabActiva]         = useState('movimientos');

  // ── NUEVO: paginación de "Historial cierres" ──
  // Estos registros crecen con el tiempo (un cierre por día por bodega
  // como mínimo), así que igual que Cuentas/Gastos/Letras, esta tabla
  // necesita paginar desde ya en vez de esperar a que falle en
  // producción con muchos registros.
  const [paginaHistorial,   setPaginaHistorial]   = useState(1);
  const [totalCierres,      setTotalCierres]      = useState(0);
  const PAGE_SIZE_HISTORIAL = 10; // debe coincidir con settings.REST_FRAMEWORK['PAGE_SIZE']
  const totalPaginasHistorial = Math.max(1, Math.ceil(totalCierres / PAGE_SIZE_HISTORIAL));

  // Carga inicial de cajas
  useEffect(() => {
    getCajas()
      .then(res => {
        const data = res.data;
        setCajas(data);
        if (!esJefe && data.length > 0) setCajaSeleccionada(data[0]);
      })
      .finally(() => setCargandoCajas(false));

    if (!esJefe) {
      getCajasDestino().then(res => setCajasDestino(res.data));
    }
  }, []);

  // Carga movimientos al cambiar de caja — resetea pestaña, historial y su paginación
  useEffect(() => {
    if (!cajaSeleccionada) return;
    setHistorialCierres([]);
    setTotalCierres(0);
    setPaginaHistorial(1);
    setTabActiva('movimientos');
    setCargandoMov(true);
    getMovimientos(cajaSeleccionada.id)
      .then(res => setMovimientos(res.data))
      .finally(() => setCargandoMov(false));
  }, [cajaSeleccionada]);

  // Carga historial de cierres al activar esa pestaña o cambiar de página
  useEffect(() => {
    if (!cajaSeleccionada || tabActiva !== 'historial') return;
    setCargandoHistorial(true);
    getHistorialCierres(cajaSeleccionada.id, { page: paginaHistorial })
      .then(res => {
        const data = res.data;
        const results = Array.isArray(data) ? data : (data?.results ?? []);
        const count = Array.isArray(data) ? data.length : (data?.count ?? results.length);
        setHistorialCierres(results);
        setTotalCierres(count);
      })
      .finally(() => setCargandoHistorial(false));
  }, [cajaSeleccionada, tabActiva, paginaHistorial]);

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

  const handleAbrirCaja = async (caja) => {
    setLoadingAbrir(true);
    try { await abrirCaja(caja.id); refrescar(); }
    finally { setLoadingAbrir(false); }
  };

  const totalConsolidado = cajas.reduce((acc, c) => acc + Number(c.saldo_actual), 0);
  const movimientosFiltrados = movimientos.filter(mov =>
    filtroTipo === 'todos' ? true : mov.tipo === filtroTipo
  );
  const cajaActual = cajaSeleccionada
    ? cajas.find(c => c.id === cajaSeleccionada.id) || cajaSeleccionada
    : null;
  const cajaEstaAbierta = cajaActual?.abierta !== false;
  const puedeTrasladar = esJefe ? cajas.length > 1 : cajasDestino.length > 1;

  if (cargandoCajas) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%',
          border: '3px solid #e2e8f0', borderTopColor: '#16a34a',
          animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100, margin: '0 auto' }}>

      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>Caja</h1>
          <p style={{ color: '#64748b', fontSize: 14, margin: '4px 0 0' }}>
            Movimientos de dinero por bodega</p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {cajaActual && (
            cajaEstaAbierta ? (
              <button onClick={() => setModalCierre(true)} disabled={pestanaBloqueada}
                style={{ display: 'flex', alignItems: 'center', gap: 8,
                  background: pestanaBloqueada ? '#94a3b8' : '#0f172a', color: 'white', border: 'none',
                  borderRadius: 6, padding: '9px 16px', fontSize: 13, fontWeight: 600,
                  cursor: pestanaBloqueada ? 'not-allowed' : 'pointer' }}
                onMouseEnter={e => { if (!pestanaBloqueada) e.currentTarget.style.background = '#1e293b' }}
                onMouseLeave={e => { if (!pestanaBloqueada) e.currentTarget.style.background = '#0f172a' }}>
                <IconLock /> Cerrar caja
              </button>
            ) : (
              <button onClick={() => handleAbrirCaja(cajaActual)} disabled={loadingAbrir || pestanaBloqueada}
                style={{ display: 'flex', alignItems: 'center', gap: 8,
                  background: (loadingAbrir || pestanaBloqueada) ? '#94a3b8' : '#16a34a', color: 'white', border: 'none',
                  borderRadius: 6, padding: '9px 16px', fontSize: 13, fontWeight: 600,
                  cursor: (loadingAbrir || pestanaBloqueada) ? 'not-allowed' : 'pointer' }}>
                <IconUnlock /> {loadingAbrir ? 'Abriendo...' : 'Abrir caja'}
              </button>
            )
          )}

          {puedeTrasladar && (
            <button onClick={() => setModalTraslado(true)} disabled={pestanaBloqueada}
              style={{ display: 'flex', alignItems: 'center', gap: 8,
                background: 'white', color: pestanaBloqueada ? '#94a3b8' : '#0f172a',
                border: '1px solid #e2e8f0', borderRadius: 6,
                padding: '9px 16px', fontSize: 13, fontWeight: 600,
                cursor: pestanaBloqueada ? 'not-allowed' : 'pointer' }}
              onMouseEnter={e => { if (!pestanaBloqueada) e.currentTarget.style.background = '#f8fafc' }}
              onMouseLeave={e => { if (!pestanaBloqueada) e.currentTarget.style.background = 'white' }}>
              <IconTransfer /> Trasladar dinero
            </button>
          )}

          {(!esJefe || cajaActual) && cajaEstaAbierta && (
            <button onClick={() => setModalAbierto(true)} disabled={pestanaBloqueada}
              style={{ display: 'flex', alignItems: 'center', gap: 8,
                background: pestanaBloqueada ? '#94a3b8' : '#16a34a', color: 'white', border: 'none',
                borderRadius: 6, padding: '9px 18px', fontSize: 14, fontWeight: 600,
                cursor: pestanaBloqueada ? 'not-allowed' : 'pointer' }}
              onMouseEnter={e => { if (!pestanaBloqueada) e.currentTarget.style.background = '#15803d' }}
              onMouseLeave={e => { if (!pestanaBloqueada) e.currentTarget.style.background = '#16a34a' }}>
              <IconPlus /> Registrar movimiento
            </button>
          )}
        </div>
      </div>

      {/* Banner pestaña duplicada (ítem 20) */}
      {pestanaBloqueada && <BannerPestanaDuplicada />}

      {/* Banner caja cerrada */}
      {cajaActual && !cajaEstaAbierta && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca',
          borderRadius: 10, padding: '16px 20px', marginBottom: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: '#fee2e2', borderRadius: 8, padding: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
              <IconLock />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#dc2626', margin: 0 }}>Caja cerrada</p>
              {cajaActual.ultimo_cierre && (
                <p style={{ fontSize: 12, color: '#94a3b8', margin: '3px 0 0' }}>
                  Último cierre · saldo sistema {formatCOP(cajaActual.ultimo_cierre.saldo_teorico)}
                  {' · '}efectivo contado {formatCOP(cajaActual.ultimo_cierre.saldo_fisico)}
                  {cajaActual.ultimo_cierre.diferencia !== 0 && (
                    <span style={{
                      color: cajaActual.ultimo_cierre.diferencia > 0 ? '#2563eb' : '#dc2626',
                      fontWeight: 600, marginLeft: 4 }}>
                      ({cajaActual.ultimo_cierre.diferencia > 0 ? '+' : ''}{formatCOP(cajaActual.ultimo_cierre.diferencia)})
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>
          <button onClick={() => handleAbrirCaja(cajaActual)} disabled={loadingAbrir || pestanaBloqueada}
            style={{ display: 'flex', alignItems: 'center', gap: 8,
              background: (loadingAbrir || pestanaBloqueada) ? '#94a3b8' : '#16a34a', color: 'white', border: 'none',
              borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600,
              cursor: (loadingAbrir || pestanaBloqueada) ? 'not-allowed' : 'pointer', flexShrink: 0 }}>
            <IconUnlock /> {loadingAbrir ? 'Abriendo...' : 'Abrir caja'}
          </button>
        </div>
      )}

      {/* Vista jefe */}
      {esJefe && (
        <>
          <div style={{ background: '#0f172a', borderRadius: 12, padding: '28px 32px',
            marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconCaja /></div>
              <div style={{ color: 'white' }}>
                <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>
                  Total consolidado — todas las bodegas</p>
                <p style={{ margin: '4px 0 0', fontSize: 32, fontWeight: 700, letterSpacing: '-0.5px' }}>
                  {formatCOP(totalConsolidado)}</p>
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#475569' }}>
              {cajas.length} bodega{cajas.length !== 1 ? 's' : ''}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 14, marginBottom: 24 }}>
            {cajas.map(caja => (
              <div key={caja.id}
                onClick={() => setCajaSeleccionada(cajaSeleccionada?.id === caja.id ? null : caja)}
                style={{ background: 'white', borderRadius: 10, padding: '18px 20px',
                  border: `1px solid ${cajaSeleccionada?.id === caja.id ? '#16a34a' : '#e2e8f0'}`,
                  cursor: 'pointer', transition: 'all 0.15s',
                  boxShadow: cajaSeleccionada?.id === caja.id ? '0 0 0 2px #bbf7d0' : 'none',
                  opacity: caja.abierta ? 1 : 0.75 }}
                onMouseEnter={e => { if (cajaSeleccionada?.id !== caja.id) e.currentTarget.style.borderColor = '#94a3b8'; }}
                onMouseLeave={e => { if (cajaSeleccionada?.id !== caja.id) e.currentTarget.style.borderColor = '#e2e8f0'; }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: 13, color: '#64748b', marginBottom: 6 }}>{caja.bodega_nombre}</div>
                  {!caja.abierta && (
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#dc2626',
                      background: '#fee2e2', padding: '2px 7px', borderRadius: 99 }}>Cerrada</span>
                  )}
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>
                  {formatCOP(caja.saldo_actual)}</div>
                {cajaSeleccionada?.id === caja.id && (
                  <div style={{ marginTop: 8, fontSize: 11, color: '#16a34a', fontWeight: 600 }}>
                    Viendo movimientos ↓</div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Vista administrador */}
      {!esJefe && cajaActual && (
        <div style={{ background: '#0f172a', borderRadius: 12, padding: '28px 32px',
          marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconCaja /></div>
          <div style={{ color: 'white' }}>
            <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>
              Saldo actual — {cajaActual.bodega_nombre}
              {!cajaEstaAbierta && (
                <span style={{ marginLeft: 10, fontSize: 11, fontWeight: 600,
                  color: '#fca5a5', background: 'rgba(220,38,38,0.2)',
                  padding: '2px 8px', borderRadius: 99 }}>Cerrada</span>
              )}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 32, fontWeight: 700, letterSpacing: '-0.5px' }}>
              {formatCOP(cajaActual.saldo_actual)}</p>
          </div>
        </div>
      )}

      {/* Tabla con pestañas */}
      {(!esJefe || cajaActual) && (
        <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' }}>

          {/* Pestañas */}
          <div style={{ padding: '0 20px', borderBottom: '1px solid #f1f5f9',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 0 }}>
              {[
                { key: 'movimientos', label: 'Movimientos',       icon: <IconPlus /> },
                { key: 'historial',   label: 'Historial cierres', icon: <IconHistory /> },
              ].map(tab => (
                <button key={tab.key} onClick={() => setTabActiva(tab.key)}
                  style={{ display: 'flex', alignItems: 'center', gap: 7,
                    padding: '14px 18px', border: 'none', background: 'transparent',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    color: tabActiva === tab.key ? '#16a34a' : '#64748b',
                    borderBottom: tabActiva === tab.key ? '2px solid #16a34a' : '2px solid transparent',
                    marginBottom: -1, transition: 'all 0.15s' }}>
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Filtros tipo — solo en pestaña movimientos */}
            {tabActiva === 'movimientos' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[
                    { value: 'todos',   label: 'Todos' },
                    { value: 'ingreso', label: 'Ingresos' },
                    { value: 'egreso',  label: 'Egresos' },
                  ].map(op => (
                    <button key={op.value} onClick={() => setFiltroTipo(op.value)}
                      style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12,
                        fontWeight: 600, cursor: 'pointer', border: 'none',
                        background: filtroTipo === op.value
                          ? op.value === 'ingreso' ? '#f0fdf4' : op.value === 'egreso' ? '#fef2f2' : '#0f172a'
                          : '#f1f5f9',
                        color: filtroTipo === op.value
                          ? op.value === 'ingreso' ? '#16a34a' : op.value === 'egreso' ? '#dc2626' : 'white'
                          : '#64748b' }}>
                      {op.label}
                    </button>
                  ))}
                </div>
                {esJefe && cajaActual && (
                  <button onClick={() => setCajaSeleccionada(null)}
                    style={{ fontSize: 12, color: '#64748b', background: 'none',
                      border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                    Volver al consolidado</button>
                )}
              </div>
            )}

            {/* Botón volver — solo en historial para el jefe */}
            {tabActiva === 'historial' && esJefe && cajaActual && (
              <button onClick={() => setCajaSeleccionada(null)}
                style={{ fontSize: 12, color: '#64748b', background: 'none',
                  border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                Volver al consolidado</button>
            )}
          </div>

          {/* Contenido: Movimientos */}
          {tabActiva === 'movimientos' && (
            cargandoMov ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%',
                  border: '3px solid #e2e8f0', borderTopColor: '#16a34a',
                  animation: 'spin 0.8s linear infinite' }} />
              </div>
            ) : movimientosFiltrados.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8', fontSize: 14 }}>
                No hay movimientos {filtroTipo !== 'todos' ? `de tipo "${filtroTipo}"` : 'registrados aún'}
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#0f172a' }}>
                    {['Fecha', 'Descripción', 'Tipo', 'Valor', 'Registrado por'].map(col => (
                      <th key={col} style={{ padding: '11px 16px', textAlign: 'left',
                        fontSize: 12, fontWeight: 600, color: '#e2e8f0',
                        textTransform: 'uppercase', letterSpacing: '0.05em' }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {movimientosFiltrados.map((mov, i) => (
                    <tr key={mov.id}
                      style={{ background: i % 2 === 0 ? 'white' : '#f8fafc', borderBottom: '1px solid #f1f5f9' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f0fdf4'}
                      onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'white' : '#f8fafc'}>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#64748b' }}>{formatFecha(mov.fecha)}</td>
                      <td style={{ padding: '12px 16px', fontSize: 14, color: '#0f172a' }}>{mov.descripcion}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                          fontSize: 12, fontWeight: 600,
                          background: mov.tipo === 'ingreso' ? '#f0fdf4' : '#fef2f2',
                          color: mov.tipo === 'ingreso' ? '#16a34a' : '#dc2626' }}>
                          {mov.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600,
                        color: mov.tipo === 'ingreso' ? '#16a34a' : '#dc2626' }}>
                        {mov.tipo === 'egreso' ? '− ' : '+ '}{formatCOP(mov.valor)}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#64748b' }}>
                        {mov.creado_por_nombre || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}

          {/* Contenido: Historial de cierres */}
          {tabActiva === 'historial' && (
            cargandoHistorial ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%',
                  border: '3px solid #e2e8f0', borderTopColor: '#16a34a',
                  animation: 'spin 0.8s linear infinite' }} />
              </div>
            ) : historialCierres.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8', fontSize: 14 }}>
                Esta caja aún no tiene cierres registrados
              </div>
            ) : (
              <>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#0f172a' }}>
                    {['Fecha', 'Saldo sistema', 'Efectivo contado', 'Diferencia', 'Nota', 'Cerrado por'].map(col => (
                      <th key={col} style={{ padding: '11px 16px', textAlign: 'left',
                        fontSize: 12, fontWeight: 600, color: '#e2e8f0',
                        textTransform: 'uppercase', letterSpacing: '0.05em' }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {historialCierres.map((cierre, i) => (
                    <tr key={cierre.id}
                      style={{ background: i % 2 === 0 ? 'white' : '#f8fafc', borderBottom: '1px solid #f1f5f9' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f0fdf4'}
                      onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'white' : '#f8fafc'}>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#64748b' }}>
                        {new Date(cierre.fecha).toLocaleDateString('es-CO', {
                          day: '2-digit', month: '2-digit', year: 'numeric'
                        })}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                        {formatCOP(cierre.saldo_teorico)}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                        {formatCOP(cierre.saldo_fisico)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                          fontSize: 12, fontWeight: 700,
                          background: cierre.diferencia === 0 ? '#f0fdf4'
                            : cierre.diferencia > 0 ? '#eff6ff' : '#fef2f2',
                          color: cierre.diferencia === 0 ? '#16a34a'
                            : cierre.diferencia > 0 ? '#2563eb' : '#dc2626',
                        }}>
                          {cierre.diferencia > 0 ? '+' : ''}{formatCOP(cierre.diferencia)}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#64748b' }}>
                        {cierre.nota || <span style={{ color: '#cbd5e1' }}>—</span>}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#64748b' }}>
                        {cierre.creado_por_nombre || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* ── NUEVO: pie de tabla con conteo real + controles de
                   paginación, mismo patrón que LetrasPage/GastosPage ── */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 16px', borderTop: '1px solid #f1f5f9',
                flexWrap: 'wrap', gap: '10px',
              }}>
                <span style={{ color: '#94a3b8', fontSize: '12px' }}>
                  {totalCierres} cierre{totalCierres !== 1 ? 's' : ''} en total
                </span>

                {totalPaginasHistorial > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      onClick={() => setPaginaHistorial(p => Math.max(1, p - 1))}
                      disabled={paginaHistorial === 1}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: '28px', height: '28px', borderRadius: '6px',
                        border: '1px solid #e2e8f0', background: 'white',
                        color: paginaHistorial === 1 ? '#cbd5e1' : '#475569',
                        cursor: paginaHistorial === 1 ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <IconChevronLeft />
                    </button>
                    <span style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                      Página {paginaHistorial} de {totalPaginasHistorial}
                    </span>
                    <button
                      onClick={() => setPaginaHistorial(p => Math.min(totalPaginasHistorial, p + 1))}
                      disabled={paginaHistorial === totalPaginasHistorial}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: '28px', height: '28px', borderRadius: '6px',
                        border: '1px solid #e2e8f0', background: 'white',
                        color: paginaHistorial === totalPaginasHistorial ? '#cbd5e1' : '#475569',
                        cursor: paginaHistorial === totalPaginasHistorial ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <IconChevronRight />
                    </button>
                  </div>
                )}
              </div>
              </>
            )
          )}
        </div>
      )}

      {esJefe && !cajaActual && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: 14 }}>
          Selecciona una bodega para ver sus movimientos</div>
      )}

      {/* Modales */}
      {modalAbierto && !pestanaBloqueada && (
        <MovimientoModal caja={cajaActual} cajas={cajas}
          onCerrar={() => setModalAbierto(false)}
          onGuardado={() => { setModalAbierto(false); refrescar(); }} />
      )}
      {modalCierre && cajaActual && !pestanaBloqueada && (
        <CierreModal caja={cajaActual}
          onCerrar={() => setModalCierre(false)}
          onConfirmar={() => { setModalCierre(false); refrescar(); }} />
      )}
      {modalTraslado && !pestanaBloqueada && (
        <TrasladoModal
          cajas={esJefe ? cajas : cajasDestino}
          cajaOrigen={!esJefe ? cajaActual : null}
          onCerrar={() => setModalTraslado(false)}
          onConfirmar={() => { setModalTraslado(false); refrescar(); }} />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}