import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, guardarSesion } from '../api/auth'
import { useAuth } from '../context/AuthContext'

const IconCafe = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
    <path d="M2 21h20M6 21V8l6-5 6 5v13M10 21v-5h4v5"/>
  </svg>
)
const IconEye = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)
const IconEyeOff = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)

export default function LoginPage() {
  const [form, setForm]           = useState({ username: '', password: '' })
  const [verPassword, setVer]     = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const { setUsuario }            = useAuth()
  const navigate                  = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await login(form.username, form.password)
      guardarSesion(res.data.token, res.data.usuario)
      setUsuario(res.data.usuario)
      navigate('/')
    } catch (err) {
      const msg = err.response?.data
      if (msg?.non_field_errors) setError(msg.non_field_errors[0])
      else setError('Usuario o contraseña incorrectos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#f8fafc',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <img
                src="/LogoCafeSan.png"
                alt="Café San"
                style={{
                width: '180px',
                margin: '0 auto 8px',
                display: 'block',
                }}
            />
            <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>
                Jimmi Martínez
            </p>
            </div>

        {/* Tarjeta */}
        <div style={{
          background: 'white', borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          overflow: 'hidden',
        }}>
          {/* Cabecera */}
          <div style={{ padding: '20px 24px 0' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
              Iniciar sesión
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>
              Ingresa tus credenciales para continuar
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit}>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {error && (
                <div style={{
                  background: '#fef2f2', border: '1px solid #fecaca',
                  borderRadius: '6px', padding: '10px 12px',
                  color: '#dc2626', fontSize: '12px',
                }}>
                  {error}
                </div>
              )}

              {/* Usuario */}
              <div>
                <label style={{
                  display: 'block', fontSize: '12px', fontWeight: 500,
                  color: '#475569', marginBottom: '5px',
                }}>
                  Usuario
                </label>
                <input
                  type="text"
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  required
                  placeholder="Ej: jimmi"
                  autoComplete="username"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    border: '1px solid #e2e8f0', borderRadius: '6px',
                    padding: '9px 12px', fontSize: '13px', color: '#0f172a',
                    outline: 'none', background: 'white',
                  }}
                  onFocus={e => e.target.style.borderColor = '#16a34a'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>

              {/* Contraseña */}
              <div>
                <label style={{
                  display: 'block', fontSize: '12px', fontWeight: 500,
                  color: '#475569', marginBottom: '5px',
                }}>
                  Contraseña
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={verPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    required
                    placeholder="Tu contraseña"
                    autoComplete="current-password"
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      border: '1px solid #e2e8f0', borderRadius: '6px',
                      padding: '9px 40px 9px 12px', fontSize: '13px', color: '#0f172a',
                      outline: 'none', background: 'white',
                    }}
                    onFocus={e => e.target.style.borderColor = '#16a34a'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                  <button
                    type="button"
                    onClick={() => setVer(!verPassword)}
                    style={{
                      position: 'absolute', right: '10px', top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none', border: 'none',
                      cursor: 'pointer', color: '#94a3b8',
                      display: 'flex', alignItems: 'center',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#475569'}
                    onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                  >
                    {verPassword ? <IconEyeOff /> : <IconEye />}
                  </button>
                </div>
              </div>

            </div>

            {/* Pie */}
            <div style={{ padding: '0 24px 24px' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '10px',
                  border: 'none', borderRadius: '6px',
                  background: loading ? '#86efac' : '#16a34a',
                  color: 'white', fontSize: '13px', fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#15803d' }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#16a34a' }}
              >
                {loading ? 'Ingresando...' : 'Ingresar'}
              </button>
            </div>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '11px', marginTop: '16px' }}>
          Café San · Gestión de café
        </p>
      </div>
    </div>
  )
}