import api from './axios'

export const getVentas = () => api.get('/ventas/ventas/')
export const getVenta = (id) => api.get(`/ventas/ventas/${id}/`)
export const createVenta = (data) => api.post('/ventas/ventas/', data)
export const deleteVenta = (id) => api.delete(`/ventas/ventas/${id}/`)