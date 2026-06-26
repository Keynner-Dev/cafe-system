import api from './axios';

// Cajas
export const getCajas = () => api.get('/caja/cajas/');
export const getCajasDestino = () => api.get('/caja/cajas/destinos/');

// Movimientos
export const getMovimientos = (cajaId) => api.get(`/caja/movimientos/?caja=${cajaId}`);
export const createMovimiento = (datos) => api.post('/caja/movimientos/', datos);

// Cierre / apertura
export const cerrarCaja = (cajaId, datos) => api.post(`/caja/cajas/${cajaId}/cerrar/`, datos);
export const abrirCaja  = (cajaId)        => api.post(`/caja/cajas/${cajaId}/abrir/`);

// Traslados de dinero
export const getTraslados      = ()      => api.get('/caja/traslados/');
export const createTraslado    = (datos) => api.post('/caja/traslados/', datos);

// Historial de cierres
export const getHistorialCierres = (cajaId) => api.get(`/caja/cajas/${cajaId}/historial/`);