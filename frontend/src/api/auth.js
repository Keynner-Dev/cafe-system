import api from './axios'

// Login — devuelve token + datos del usuario
export const login = (username, password) =>
  api.post('/auth/login/', { username, password })

// Logout — elimina el token en el servidor
export const logout = () =>
  api.post('/auth/logout/')

// Me — verifica que el token sigue siendo válido y trae datos frescos
export const getMe = () =>
  api.get('/auth/me/')

// ── Helpers de localStorage ───────────────────────────────────────────────────
// Guardar sesión después del login
export const guardarSesion = (token, usuario) => {
  localStorage.setItem('token', token)
  localStorage.setItem('usuario', JSON.stringify(usuario))
}

// Leer usuario guardado
export const getUsuarioGuardado = () => {
  const u = localStorage.getItem('usuario')
  return u ? JSON.parse(u) : null
}

// Verificar si hay sesión activa
export const estaAutenticado = () => {
  return !!localStorage.getItem('token')
}

// Cerrar sesión en el frontend (limpia localStorage)
export const limpiarSesion = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('usuario')
}