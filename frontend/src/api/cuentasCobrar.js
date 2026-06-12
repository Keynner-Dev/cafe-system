import api from './axios';

export const getCuentasCobrar = (params = {}) =>
  api.get('/cuentas-cobrar/', { params }).then(r => r.data);

export const createCuentaCobrar = (data) =>
  api.post('/cuentas-cobrar/', data).then(r => r.data);

export const updateCuentaCobrar = (id, data) =>
  api.patch(`/cuentas-cobrar/${id}/`, data).then(r => r.data);

export const deleteCuentaCobrar = (id) =>
  api.delete(`/cuentas-cobrar/${id}/`);

export const getAbonos = (cuentaId) =>
  api.get(`/cuentas-cobrar/${cuentaId}/abonos/`).then(r => r.data);

export const createAbono = (cuentaId, data) =>
  api.post(`/cuentas-cobrar/${cuentaId}/abonos/`, data).then(r => r.data);