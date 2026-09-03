import api from './axios';

const desenvolver = (res) =>
  Array.isArray(res.data) ? res.data : (res.data?.results ?? []);

// Cajas
export const getCajas        = ()       => api.get('/caja/cajas/').then(res => ({ ...res, data: desenvolver(res) }));
export const getCajasDestino = ()       => api.get('/caja/cajas/destinos/').then(res => ({ ...res, data: desenvolver(res) }));

// Movimientos
export const getMovimientos = (cajaId, opciones = {}) =>
  api.get('/caja/movimientos/', { params: { caja: cajaId, ...opciones } });
export const createMovimiento = (datos)  => api.post('/caja/movimientos/', datos);
//totales de ingresos/egresos de HOY para cuadrar caja
export const getResumenDiaCaja = (cajaId) => api.get('/caja/movimientos/resumen-dia/', { params: { caja: cajaId } });
//datos completos del día para exportar en Excel/PDF
export const getExportarDiaCaja = (cajaId) => api.get('/caja/movimientos/exportar-dia/', { params: { caja: cajaId } });

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