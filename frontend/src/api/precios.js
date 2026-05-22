import api from './axios'

const URL = '/precios/precio-diario/'

export const getPrecios = () => api.get(URL)
export const getPreciosHoy = () => api.get(`${URL}hoy/`)
export const createPrecio = (data) => api.post(URL, data)
export const updatePrecio = (id, data) => api.put(`${URL}${id}/`, data)
export const deletePrecio = (id) => api.delete(`${URL}${id}/`)