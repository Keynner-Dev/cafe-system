export default function Dashboard() {
  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h2>
      <p className="text-gray-500 mb-8">Bienvenido al sistema de gestión de café</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Compras hoy', value: '$0', color: 'bg-blue-500' },
          { label: 'Ventas hoy', value: '$0', color: 'bg-green-500' },
          { label: 'Stock total', value: '0 kg', color: 'bg-yellow-500' },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
            <div className={`${card.color} w-12 h-12 rounded-full flex items-center justify-center text-white text-xl`}>
              ☕
            </div>
            <div>
              <p className="text-gray-500 text-sm">{card.label}</p>
              <p className="text-2xl font-bold text-gray-800">{card.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}