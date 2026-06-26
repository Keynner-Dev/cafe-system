import { createContext, useContext, useState, useEffect } from 'react'
import { getMe, limpiarSesion } from '../api/auth'

const AuthContext = createContext(null)

// Clave de localStorage: por usuario y por día
function clavePrecios(usuarioId) {
  const hoy = new Date().toISOString().split('T')[0]
  return `precios_registrados_${usuarioId}_${hoy}`
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario]               = useState(null)
  const [cargando, setCargando]             = useState(true)
  const [redirigirAPrecios, setRedirigir]   = useState(false)

  useEffect(() => {
    const verificarSesion = async () => {
      const token = localStorage.getItem('token')
      if (!token) { setCargando(false); return }
      try {
        const res = await getMe()
        const u = res.data
        setUsuario(u)

        // Solo para administrador: revisar si ya registró precios hoy
        if (u.rol === 'administrador') {
          const yaRegistro = localStorage.getItem(clavePrecios(u.id))
          if (!yaRegistro) setRedirigir(true)
        }
      } catch {
        limpiarSesion()
      } finally {
        setCargando(false)
      }
    }
    verificarSesion()
  }, [])

  const marcarPreciosRegistrados = () => {
    if (usuario) {
      localStorage.setItem(clavePrecios(usuario.id), '1')
      setRedirigir(false)
    }
  }

  const cerrarSesion = async () => {
    try {
      await import('../api/auth').then(m => m.logout())
    } catch {}
    limpiarSesion()
    setUsuario(null)
    setRedirigir(false)
  }

  return (
    <AuthContext.Provider value={{
      usuario, setUsuario, cerrarSesion, cargando,
      redirigirAPrecios, marcarPreciosRegistrados,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}