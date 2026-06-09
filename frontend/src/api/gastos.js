import api from './axios';

export const getGastos = (params = {}) => api.get('/gastos/', { params });
export const createGasto = (datos) => api.post('/gastos/', datos);
export const updateGasto = (id, datos) => api.put(`/gastos/${id}/`, datos);
export const deleteGasto = (id) => api.delete(`/gastos/${id}/`);