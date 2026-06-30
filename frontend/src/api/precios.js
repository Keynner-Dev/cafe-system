import api from './axios'

const URL = '/precios/precio-diario/'

const desenvolver = (res) =>
  Array.isArray(res.data) ? res.data : (res.data?.results ?? [])

export const getPrecios    = ()          => api.get(URL).then(res => ({ ...res, data: desenvolver(res) }))
export const getPreciosHoy = ()          => api.get(`${URL}hoy/`).then(res => ({ ...res, data: desenvolver(res) }))
export const createPrecio  = (data)      => api.post(URL, data)
export const updatePrecio  = (id, data)  => api.put(`${URL}${id}/`, data)
export const deletePrecio  = (id)        => api.delete(`${URL}${id}/`)