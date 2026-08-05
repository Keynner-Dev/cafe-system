import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  // NUEVO: sin esto, si Railway no responde, la petición queda colgada
  // indefinidamente y el usuario se queda viendo el spinner sin saber
  // si debe esperar o recargar.
  timeout: 15000,
})

// ── Interceptor de REQUEST ────────────────────────────────────────────────────
// Antes de cada petición, lee el token del localStorage y lo agrega al header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Token ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Interceptor de RESPONSE ───────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 (no autenticado): limpia todo y redirige al login, como ya estaba.
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('usuario')
      window.location.href = '/login'
      return Promise.reject(error)
    }

    // NUEVO: normaliza los casos donde no hay respuesta del servidor
    // (timeout, backend caído, sin internet) para que cada página pueda
    // mostrar un mensaje claro en vez de un genérico "undefined".
    // error.response no existe en estos casos -- solo error.request.
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        error.mensajeAmigable = 'El servidor tardó demasiado en responder. Intenta de nuevo.'
      } else {
        error.mensajeAmigable = 'No se pudo conectar con el servidor. Verifica tu conexión a internet.'
      }
    }

    return Promise.reject(error)
  }
)

export default api