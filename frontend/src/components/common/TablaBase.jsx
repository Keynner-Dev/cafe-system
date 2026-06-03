// ─── Iconos SVG inline ────────────────────────────────────────────────────────
const IconEdit = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)
const IconTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
)

// ─── Componente ───────────────────────────────────────────────────────────────
export default function TablaBase({ columnas, datos, onEditar, onEliminar, loading, entidad = 'registros' }) {

  if (loading) {
    return (
      <div style={{ color: '#94a3b8', fontSize: '13px', padding: '20px 0' }}>
        Cargando {entidad}...
      </div>
    )
  }

  return (
    <div style={{
      background: 'white', border: '1px solid #e2e8f0',
      borderRadius: '10px', overflow: 'hidden',
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr style={{ background: '#0f172a' }}>
            {columnas.map(col => (
              <th key={col.key} style={{
                padding: '11px 16px', textAlign: 'left',
                color: '#e2e8f0', fontWeight: 500, fontSize: '12px',
                whiteSpace: 'nowrap',
              }}>
                {col.label}
              </th>
            ))}
            <th style={{
              padding: '11px 16px', textAlign: 'left',
              color: '#e2e8f0', fontWeight: 500, fontSize: '12px',
            }}>
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {datos.length === 0 ? (
            <tr>
              <td
                colSpan={columnas.length + 1}
                style={{
                  padding: '40px', textAlign: 'center',
                  color: '#94a3b8', fontSize: '13px',
                }}
              >
                No hay {entidad} registrados aún.
              </td>
            </tr>
          ) : (
            datos.map(fila => (
              <tr
                key={fila.id}
                style={{ borderTop: '1px solid #f1f5f9', transition: 'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = 'white'}
              >
                {columnas.map(col => (
                  <td key={col.key} style={{ padding: '11px 16px', color: '#475569' }}>
                    {col.render ? col.render(fila) : (fila[col.key] ?? '—')}
                  </td>
                ))}
                <td style={{ padding: '11px 16px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {onEditar && (
                      <button
                        onClick={() => onEditar(fila)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '4px',
                          padding: '5px 10px', borderRadius: '5px', border: 'none',
                          background: '#eff6ff', color: '#2563eb',
                          fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#dbeafe'}
                        onMouseLeave={e => e.currentTarget.style.background = '#eff6ff'}
                      >
                        <IconEdit /> Editar
                      </button>
                    )}
                    {onEliminar && (
                      <button
                        onClick={() => onEliminar(fila.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '4px',
                          padding: '5px 10px', borderRadius: '5px', border: 'none',
                          background: '#fef2f2', color: '#dc2626',
                          fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                        onMouseLeave={e => e.currentTarget.style.background = '#fef2f2'}
                      >
                        <IconTrash /> Eliminar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pie con conteo */}
      {datos.length > 0 && (
        <div style={{
          padding: '10px 16px', borderTop: '1px solid #f1f5f9',
          color: '#94a3b8', fontSize: '12px',
        }}>
          {datos.length} {entidad} registrado(s)
        </div>
      )}
    </div>
  )
}