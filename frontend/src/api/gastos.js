import api from './axios';

const desenvolver = (res) =>
  Array.isArray(res.data) ? res.data : (res.data?.results ?? [])

export const getGastos        = (params = {}) => api.get('/gastos/', { params }).then(res => ({ ...res, data: desenvolver(res) }));
export const getGastosResumen = (params = {}) => api.get('/gastos/resumen/', { params });

export const createGasto = (datos)     => api.post('/gastos/', datos);
export const updateGasto = (id, datos) => api.put(`/gastos/${id}/`, datos);
export const deleteGasto = (id)        => api.delete(`/gastos/${id}/`);