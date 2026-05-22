import api from './axios'

export const getCompras = () => api.get('/compras/compras/')
export const getCompra = (id) => api.get(`/compras/compras/${id}/`)
export const createCompra = (data) => api.post('/compras/compras/', data)
export const updateCompra = (id, data) => api.put(`/compras/compras/${id}/`, data)
export const deleteCompra = (id) => api.delete(`/compras/compras/${id}/`)

export const getLiquidaciones = () => api.get('/compras/liquidaciones/')
export const createLiquidacion = (data) => api.post('/compras/liquidaciones/', data)