import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: '🏠 Dashboard' },
  { to: '/terceros', label: '👥 Terceros' },
  { to: '/inventario', label: '📦 Inventario' },
  { to: '/compras', label: '🛒 Compras' },
  { to: '/ventas', label: '💰 Ventas' },
  { to: '/precios', label: '☕ Precios' },
  { to: '/traslados', label: '🚛 Traslados' },
]

export default function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-green-900 text-white flex flex-col">
      <div className="p-6 border-b border-green-700">
        <h1 className="text-xl font-bold">☕ Café System</h1>
        <p className="text-green-300 text-sm mt-1">Gestión de café</p>
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {links.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `block px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-green-600 text-white font-semibold'
                      : 'text-green-100 hover:bg-green-700'
                  }`
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}