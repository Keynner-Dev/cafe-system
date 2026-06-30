import api from './axios'

const URL = '/terceros/terceros/'

const desenvolver = (res) =>
  Array.isArray(res.data) ? res.data : (res.data?.results ?? [])

// getTerceros — los dropdowns de búsqueda (CompraModal, VentaModal,
// CuentaPagarModal) hacen .map() sobre el resultado, así que se
// desenvuelve el array. Si una tabla de terceros en el futuro necesita
// la paginación completa, se puede agregar una función separada.
export const getTerceros       = (params = {}) => api.get(URL, { params }).then(res => ({ ...res, data: desenvolver(res) }))
export const getTercero        = (id)          => api.get(`${URL}${id}/`)
export const getTerceroPerfil  = (id)          => api.get(`${URL}${id}/perfil/`)
export const createTercero     = (data)        => api.post(URL, data)
export const updateTercero     = (id, data)    => api.put(`${URL}${id}/`, data)
export const deleteTercero     = (id)          => api.delete(`${URL}${id}/`)