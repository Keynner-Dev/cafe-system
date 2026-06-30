import api from './axios'

const desenvolver = (res) =>
  Array.isArray(res.data) ? res.data : (res.data?.results ?? [])

// getCompras y getComprasPorCaficultor devuelven el objeto paginado
// completo a propósito — las tablas de compras usan count/results/next
// para navegar páginas. NO se desenvuelven aquí.
export const getCompras = (params = {}) => api.get('/compras/compras/', { params })
export const getCompra = (id) => api.get(`/compras/compras/${id}/`)
export const createCompra = (data) => api.post('/compras/compras/', data)
export const updateCompra = (id, data) => api.put(`/compras/compras/${id}/`, data)
export const deleteCompra = (id) => api.delete(`/compras/compras/${id}/`)
export const getComprasPorCaficultor = (caficultorId) =>
  api.get('/compras/compras/', { params: { caficultor: caficultorId } })

export const getLiquidaciones  = ()     => api.get('/compras/liquidaciones/').then(res => ({ ...res, data: desenvolver(res) }))
export const createLiquidacion = (data) => api.post('/compras/liquidaciones/', data)