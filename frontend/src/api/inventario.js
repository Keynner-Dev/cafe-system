import api from './axios'

// Tipos de café
export const getTiposCafe = () => api.get('/inventario/tipos-cafe/')
export const createTipoCafe = (data) => api.post('/inventario/tipos-cafe/', data)
export const updateTipoCafe = (id, data) => api.put(`/inventario/tipos-cafe/${id}/`, data)
export const deleteTipoCafe = (id) => api.delete(`/inventario/tipos-cafe/${id}/`)

// Bodegas
export const getBodegas = () => api.get('/inventario/bodegas/')
export const createBodega = (data) => api.post('/inventario/bodegas/', data)
export const updateBodega = (id, data) => api.put(`/inventario/bodegas/${id}/`, data)
export const deleteBodega = (id) => api.delete(`/inventario/bodegas/${id}/`)

// Stock
export const getStock = (params) => api.get('/inventario/movimientos/stock/', { params })

// Movimientos
export const getMovimientos = () => api.get('/inventario/movimientos/')
export const createMovimiento = (data) => api.post('/inventario/movimientos/', data)

export const trasladar = (data) => api.post('/inventario/trasladar/', data)