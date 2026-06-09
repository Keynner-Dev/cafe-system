import api from './axios';

// Obtener todas las cajas (jefe ve todas, admin solo la suya)
export const getCajas = () => api.get('/caja/');

// Obtener movimientos de una caja
export const getMovimientos = (cajaId) => api.get(`/caja/${cajaId}/movimientos/`);

// Registrar un nuevo movimiento
export const createMovimiento = (cajaId, datos) => api.post(`/caja/${cajaId}/movimientos/`, datos);