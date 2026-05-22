export const formatCOP = (val) =>
  `$${Number(val || 0).toLocaleString('es-CO')}`

export const formatKilos = (val) =>
  `${Number(val || 0).toLocaleString('es-CO')} kg`