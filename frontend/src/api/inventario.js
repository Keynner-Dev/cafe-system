import api from './axios'

// ── Helper interno ─────────────────────────────────────────────────────────────
// La paginación global (PAGE_SIZE: 10) envuelve las respuestas de lista en
// {count, next, previous, results}. Los callers que solo necesitan el array
// completo (selects, dropdowns, PrecioModal, CompraModal, etc.) no deberían
// tener que saber si la respuesta está paginada o no — ese detalle queda acá.
//
// Se preserva res.data tal cual si ya es un array (ej. endpoints sin
// paginación o con paginación desactivada), para no romper nada que ya
// funcione.
const desenvolver = (res) =>
  Array.isArray(res.data) ? res.data : (res.data?.results ?? [])

// Tipos de café
export const getTiposCafe    = ()          => api.get('/inventario/tipos-cafe/').then(res => ({ ...res, data: desenvolver(res) }))
export const createTipoCafe  = (data)      => api.post('/inventario/tipos-cafe/', data)
export const updateTipoCafe  = (id, data)  => api.put(`/inventario/tipos-cafe/${id}/`, data)
export const deleteTipoCafe  = (id)        => api.delete(`/inventario/tipos-cafe/${id}/`)

// Bodegas
export const getBodegas      = ()          => api.get('/inventario/bodegas/').then(res => ({ ...res, data: desenvolver(res) }))
export const createBodega    = (data)      => api.post('/inventario/bodegas/', data)
export const updateBodega    = (id, data)  => api.put(`/inventario/bodegas/${id}/`, data)
export const deleteBodega    = (id)        => api.delete(`/inventario/bodegas/${id}/`)

// Stock
export const getStock         = (params) => api.get('/inventario/movimientos/stock/', { params })
// Stock desglosado por bodega y tipo de café (ítem 12 — mejora consulta de stock)
export const getStockDetallado = (params) => api.get('/inventario/movimientos/stock-detallado/', { params })

// Movimientos
export const getMovimientos  = ()          => api.get('/inventario/movimientos/')
export const createMovimiento = (data)     => api.post('/inventario/movimientos/', data)

export const trasladar        = (data)     => api.post('/inventario/trasladar/', data)