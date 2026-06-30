import api from './axios'

const desenvolver = (res) =>
  Array.isArray(res.data) ? res.data : (res.data?.results ?? [])

export const getUsuarios    = ()           => api.get('/usuarios/').then(res => ({ ...res, data: desenvolver(res) }))
export const createUsuario  = (data)       => api.post('/usuarios/', data)
export const updateUsuario  = (id, data)   => api.put(`/usuarios/${id}/`, data)
export const deleteUsuario  = (id)         => api.delete(`/usuarios/${id}/`)