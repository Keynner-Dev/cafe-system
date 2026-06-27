import { useState, useEffect } from 'react'
import { createUsuario, updateUsuario } from '../../api/usuarios'
import { getBodegas } from '../../api/inventario'

// ─── Iconos SVG inline ────────────────────────────────────────────────────────
const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const IconEye = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)
const IconEyeOff = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)

// ─── Estilos reutilizables ────────────────────────────────────────────────────
const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  border: '1px solid #e2e8f0', borderRadius: '6px',
  padding: '8px 12px', fontSize: '13px', color: '#0f172a',
  outline: 'none', background: 'white',
}
const labelStyle = {
  display: 'block', fontSize: '12px', fontWeight: 500,
  color: '#475569', marginBottom: '5px',
}

// Campos base para creación
const initialFormCrear = {
  username:   '',
  first_name: '',
  last_name:  '',
  email:      '',
  password:   '',
  rol:        'administrador',
  bodega:     '',
}

// Campos base para edición (sin password)
const initialFormEditar = {
  username:   '',
  first_name: '',
  last_name:  '',
  email:      '',
  rol:        'administrador',
  bodega:     '',
  is_active:  true,
}

export default function UsuarioModal({ usuario, onClose, onSaved }) {
  // Si hay usuario es edición, si no es creación
  const esEdicion = Boolean(usuario)

  const [form, setForm]               = useState(esEdicion ? initialFormEditar : initialFormCrear)
  const [bodegas, setBodegas]         = useState([])
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState(null)
  const [verPassword, setVerPassword] = useState(false)

  // Cargar bodegas y rellenar el form si es edición
  useEffect(() => {
    getBodegas().then(res => setBodegas(res.data))

    if (usuario) {
      // Mapeamos los campos que usa el serializer de edición
      setForm({
        username:   usuario.username   || '',
        first_name: usuario.first_name || '',
        last_name:  usuario.last_name  || '',
        email:      usuario.email      || '',
        rol:        usuario.rol        || 'administrador',
        // bodega viene como ID numérico desde el serializer
        bodega:     usuario.bodega     || '',
        is_active:  usuario.is_active  ?? true,
      })
    }
  }, [usuario])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => {
      const nuevo = { ...prev, [name]: type === 'checkbox' ? checked : value }
      // Si cambia el rol a jefe, limpiamos la bodega automáticamente
      if (name === 'rol' && value === 'jefe') {
        nuevo.bodega = ''
      }
      return nuevo
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Construimos el payload limpiando campos vacíos
    const payload = { ...form }

    // Si es jefe, nos aseguramos de no enviar bodega
    if (payload.rol === 'jefe') {
      payload.bodega = null
    }

    // Si bodega quedó como string vacío, lo convertimos a null
    if (payload.bodega === '') {
      payload.bodega = null
    }

    try {
      if (esEdicion) {
        await updateUsuario(usuario.id, payload)
      } else {
        await createUsuario(payload)
      }
      onSaved()
      onClose()
    } catch (err) {
      // El backend devuelve errores de validación como objeto
      const data = err.response?.data
      if (data) {
        // Intentamos mostrar el primer mensaje de error del backend
        const primerCampo = Object.keys(data)[0]
        const mensaje = Array.isArray(data[primerCampo])
          ? data[primerCampo][0]
          : data[primerCampo]
        setError(typeof mensaje === 'string' ? mensaje : 'Error al guardar. Verifica los datos.')
      } else {
        setError('Error al guardar. Verifica los datos.')
      }
    } finally {
      setLoading(false)
    }
  }


  const focusGreen = (e) => e.target.style.borderColor = '#16a34a'
  const blurGray   = (e) => e.target.style.borderColor = '#e2e8f0'

  // El campo bodega solo se muestra si el rol es administrador
  const mostrarBodega = form.rol === 'administrador'

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15, 23, 42, 0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 50, padding: '16px',
      }}
    >
      <div style={{
        background: 'white', borderRadius: '12px',
        width: '100%', maxWidth: '500px',
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }}>

        {/* ── Cabecera ── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '18px 20px', borderBottom: '1px solid #f1f5f9',
          position: 'sticky', top: 0, background: 'white', zIndex: 1,
        }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
              {esEdicion ? 'Editar usuario' : 'Nuevo usuario'}
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>
              {esEdicion
                ? `Modificando: ${usuario.username}`
                : 'Completa los datos del nuevo usuario'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '30px', height: '30px', borderRadius: '6px',
              border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8' }}
          >
            <IconX />
          </button>
        </div>

        {/* ── Cuerpo ── */}
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {error && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fecaca',
                borderRadius: '6px', padding: '10px 12px',
                color: '#dc2626', fontSize: '12px',
              }}>
                {error}
              </div>
            )}

            {/* Nombre y apellido en grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Nombre</label>
                <input
                  name="first_name"
                  value={form.first_name}
                  onChange={handleChange}
                  placeholder="Ej: Jimmi"
                  style={inputStyle}
                  onFocus={focusGreen} onBlur={blurGray}
                />
              </div>
              <div>
                <label style={labelStyle}>Apellido</label>
                <input
                  name="last_name"
                  value={form.last_name}
                  onChange={handleChange}
                  placeholder="Ej: Martínez"
                  style={inputStyle}
                  onFocus={focusGreen} onBlur={blurGray}
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label style={labelStyle}>
                Usuario *
                <span style={{ color: '#94a3b8', fontWeight: 400, marginLeft: '4px' }}>
                  (para iniciar sesión)
                </span>
              </label>
              <input
                name="username"
                value={form.username}
                onChange={handleChange}
                required
                placeholder="Ej: jimmi"
                style={{ ...inputStyle, fontFamily: 'monospace' }}
                onFocus={focusGreen} onBlur={blurGray}
              />
            </div>

            {/* Email */}
            <div>
              <label style={labelStyle}>Correo electrónico</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Ej: jimmi@cafesystem.com"
                style={inputStyle}
                onFocus={focusGreen} onBlur={blurGray}
              />
            </div>

            {/* Password — solo en creación */}
            {!esEdicion && (
              <div>
                <label style={labelStyle}>
                  Contraseña *
                  <span style={{ color: '#94a3b8', fontWeight: 400, marginLeft: '4px' }}>
                    (mínimo 6 caracteres)
                  </span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={verPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    style={{ ...inputStyle, paddingRight: '40px' }}
                    onFocus={focusGreen} onBlur={blurGray}
                  />
                  <button
                    type="button"
                    onClick={() => setVerPassword(v => !v)}
                    style={{
                      position: 'absolute', right: '10px', top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none', border: 'none',
                      cursor: 'pointer', color: '#94a3b8',
                      display: 'flex', alignItems: 'center', padding: '2px',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#475569'}
                    onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                  >
                    {verPassword ? <IconEyeOff /> : <IconEye />}
                  </button>
                </div>
              </div>
            )}

            {/* Rol */}
            <div>
              <label style={labelStyle}>Rol *</label>
              <select
                name="rol"
                value={form.rol}
                onChange={handleChange}
                style={inputStyle}
                onFocus={focusGreen} onBlur={blurGray}
              >
                <option value="administrador">Administrador</option>
                <option value="jefe">Jefe</option>
              </select>
              {/* Descripción contextual según el rol */}
              <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                {form.rol === 'jefe'
                  ? 'Acceso total al sistema. No tiene bodega asignada.'
                  : 'Gestiona una bodega. No ve precios de venta ni ajusta caja.'}
              </p>
            </div>

            {/* Bodega — solo visible si rol es administrador */}
            {mostrarBodega && (
              <div>
                <label style={labelStyle}>Bodega *</label>
                <select
                  name="bodega"
                  value={form.bodega}
                  onChange={handleChange}
                  required={mostrarBodega}
                  style={inputStyle}
                  onFocus={focusGreen} onBlur={blurGray}
                >
                  <option value="">Selecciona una bodega</option>
                  {bodegas.map(b => (
                    <option key={b.id} value={b.id}>{b.nombre}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Estado activo — solo en edición */}
            {esEdicion && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: '#f8fafc', borderRadius: '6px', padding: '10px 12px',
              }}>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 500, color: '#0f172a', margin: 0 }}>
                    Usuario activo
                  </p>
                  <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0' }}>
                    Los usuarios inactivos no pueden iniciar sesión
                  </p>
                </div>
                <label style={{
                  position: 'relative', display: 'inline-block',
                  width: '40px', height: '22px', flexShrink: 0,
                }}>
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={form.is_active}
                    onChange={handleChange}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute', inset: 0, borderRadius: '99px', cursor: 'pointer',
                    background: form.is_active ? '#16a34a' : '#e2e8f0',
                    transition: 'background 0.2s',
                  }}>
                    <span style={{
                      position: 'absolute',
                      width: '16px', height: '16px', borderRadius: '50%',
                      background: 'white', top: '3px',
                      left: form.is_active ? '21px' : '3px',
                      transition: 'left 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }} />
                  </span>
                </label>
              </div>
            )}

          </div>

          {/* ── Pie ── */}
          <div style={{
            display: 'flex', gap: '10px',
            padding: '16px 20px', borderTop: '1px solid #f1f5f9',
            position: 'sticky', bottom: 0, background: 'white',
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, padding: '9px',
                border: '1px solid #e2e8f0', borderRadius: '6px',
                background: 'white', color: '#475569',
                fontSize: '13px', fontWeight: 500, cursor: 'pointer',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1, padding: '9px',
                border: 'none', borderRadius: '6px',
                background: loading ? '#86efac' : '#16a34a', color: 'white',
                fontSize: '13px', fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#15803d' }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#16a34a' }}
            >
              {loading ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}