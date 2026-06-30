import api from './axios';

const desenvolver = (res) =>
  Array.isArray(res.data) ? res.data : (res.data?.results ?? [])

export const getCuentasPagar        = (params = {}) => api.get('/cuentas-pagar/', { params });
export const getCuentasPagarResumen = (params = {}) => api.get('/cuentas-pagar/resumen/', { params });

export const createCuentaPagar = (datos)      => api.post('/cuentas-pagar/', datos);
export const updateCuentaPagar = (id, datos)  => api.put(`/cuentas-pagar/${id}/`, datos);
export const getAbonos         = (id)         => api.get(`/cuentas-pagar/${id}/abonos/`).then(res => ({ ...res, data: desenvolver(res) }));
export const createAbono       = (id, datos)  => api.post(`/cuentas-pagar/${id}/abonos/`, datos);