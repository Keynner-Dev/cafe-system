import axios from 'axios'

// Cliente axios SEPARADO del que usa el resto de la app (`./axios`).
// Ese cliente interno probablemente adjunta el token de autenticación
// en cada request (interceptor). El portal caficultor es público y NO
// debe enviar ningún token — por eso usamos una instancia limpia de
// axios aquí, apuntando a la misma URL base de la API.
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const apiPublico = axios.create({
  baseURL: API_BASE_URL,
})

export const consultarPortalCaficultor = (cedula) =>
  apiPublico.get('/portal/caficultor/', { params: { cedula } })