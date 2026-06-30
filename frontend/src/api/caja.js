import api from './axios';

// ── Helper interno ─────────────────────────────────────────────────────────────
// La paginación global (PAGE_SIZE: 10) envuelve las respuestas de lista en
// {count, next, previous, results}. Se desenvuelve aquí para que ningún
// caller tenga que saber si la respuesta está paginada o no.
const desenvolver = (res) =>
  Array.isArray(res.data) ? res.data : (res.data?.results ?? []);

// Cajas
export const getCajas        = ()       => api.get('/caja/cajas/').then(res => ({ ...res, data: desenvolver(res) }));
export const getCajasDestino = ()       => api.get('/caja/cajas/destinos/').then(res => ({ ...res, data: desenvolver(res) }));

// Movimientos
export const getMovimientos   = (cajaId) => api.get(`/caja/movimientos/?caja=${cajaId}`).then(res => ({ ...res, data: desenvolver(res) }));
export const createMovimiento = (datos)  => api.post('/caja/movimientos/', datos);

// Cierre / apertura
export const cerrarCaja = (cajaId, datos) => api.post(`/caja/cajas/${cajaId}/cerrar/`, datos);
export const abrirCaja  = (cajaId)        => api.post(`/caja/cajas/${cajaId}/abrir/`);

// Traslados de dinero
export const getTraslados   = ()      => api.get('/caja/traslados/').then(res => ({ ...res, data: desenvolver(res) }));
export const createTraslado = (datos) => api.post('/caja/traslados/', datos);

export const getHistorialCierres = (cajaId, opciones = {}) => {
  const params = cajaId ? { caja: cajaId, ...opciones } : { ...opciones };
  return api.get('/caja/historial-cierres/', { params });
};