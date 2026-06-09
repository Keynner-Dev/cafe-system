import { createContext, useContext, useState, useEffect } from 'react'
import { getMe, limpiarSesion, getUsuarioGuardado } from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    // Al cargar la app, verificamos si hay una sesión guardada
    const verificarSesion = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        setCargando(false)
        return
      }
      try {
        // Verificamos con el servidor que el token sigue siendo válido
        const res = await getMe()
        setUsuario(res.data)
      } catch {
        // Token inválido o expirado — limpiamos todo
        limpiarSesion()
      } finally {
        setCargando(false)
      }
    }
    verificarSesion()
  }, [])

  const cerrarSesion = async () => {
    try {
      await import('../api/auth').then(m => m.logout())
    } catch {
      // Si falla el logout en el servidor, igual limpiamos el frontend
    }
    limpiarSesion()
    setUsuario(null)
  }

  return (
    <AuthContext.Provider value={{ usuario, setUsuario, cerrarSesion, cargando }}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook personalizado para usar el contexto fácilmente
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}