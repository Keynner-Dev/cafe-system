import api from './axios'

const URL = '/terceros/terceros/'

export const getTerceros = () => api.get(URL)
export const getTercero = (id) => api.get(`${URL}${id}/`)
export const createTercero = (data) => api.post(URL, data)
export const updateTercero = (id, data) => api.put(`${URL}${id}/`, data)
export const deleteTercero = (id) => api.delete(`${URL}${id}/`)