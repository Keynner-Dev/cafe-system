import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

function formatCOP(val) {
  return `$${Number(val || 0).toLocaleString('es-CO')}`
}

function nombreConcepto(tipo, concepto) {
  return `${tipo === 'ingreso' ? 'Ingreso' : 'Egreso'} — ${concepto}`
}

// ── Excel ──────────────────────────────────────────────────────────────────
export function exportarExcelCaja(datos, bodegaNombre, fecha) {
  const { movimientos, totales_por_concepto } = datos

  // Hoja 1: detalle de movimientos
  const filasDetalle = movimientos.map(m => ({
    Fecha: new Date(m.fecha).toLocaleString('es-CO'),
    Tipo: m.tipo === 'ingreso' ? 'Ingreso' : 'Egreso',
    Concepto: m.concepto,
    Descripción: m.descripcion,
    Valor: m.valor,
    'Registrado por': m.registrado_por,
  }))
  const hojaDetalle = XLSX.utils.json_to_sheet(filasDetalle)

  // Hoja 2: totales por concepto
  const totalIngresos = totales_por_concepto
    .filter(t => t.tipo === 'ingreso')
    .reduce((acc, t) => acc + t.total, 0)
  const totalEgresos = totales_por_concepto
    .filter(t => t.tipo === 'egreso')
    .reduce((acc, t) => acc + t.total, 0)

  const filasTotales = [
    ...totales_por_concepto.map(t => ({
      Concepto: nombreConcepto(t.tipo, t.concepto),
      Total: t.total,
    })),
    { Concepto: '', Total: '' },
    { Concepto: 'TOTAL INGRESOS', Total: totalIngresos },
    { Concepto: 'TOTAL EGRESOS', Total: totalEgresos },
    { Concepto: 'NETO DEL DÍA', Total: totalIngresos - totalEgresos },
  ]
  const hojaTotales = XLSX.utils.json_to_sheet(filasTotales)

  const libro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(libro, hojaTotales, 'Totales')
  XLSX.utils.book_append_sheet(libro, hojaDetalle, 'Detalle')

  XLSX.writeFile(libro, `movimientos_${bodegaNombre}_${fecha}.xlsx`)
}

// ── PDF ────────────────────────────────────────────────────────────────────
export function exportarPDFCaja(datos, bodegaNombre, fecha) {
  const { movimientos, totales_por_concepto } = datos
  const doc = new jsPDF()

  doc.setFontSize(14)
  doc.text('Café San Joaquín — Movimientos de Caja', 14, 16)
  doc.setFontSize(10)
  doc.text(`Bodega: ${bodegaNombre}    Fecha: ${fecha}`, 14, 23)

  const totalIngresos = totales_por_concepto
    .filter(t => t.tipo === 'ingreso')
    .reduce((acc, t) => acc + t.total, 0)
  const totalEgresos = totales_por_concepto
    .filter(t => t.tipo === 'egreso')
    .reduce((acc, t) => acc + t.total, 0)

  // Tabla de totales por concepto
  autoTable(doc, {
    startY: 30,
    head: [['Concepto', 'Total']],
    body: [
      ...totales_por_concepto.map(t => [nombreConcepto(t.tipo, t.concepto), formatCOP(t.total)]),
      ['TOTAL INGRESOS', formatCOP(totalIngresos)],
      ['TOTAL EGRESOS', formatCOP(totalEgresos)],
      ['NETO DEL DÍA', formatCOP(totalIngresos - totalEgresos)],
    ],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [15, 23, 42] },
  })

  // Tabla de detalle completo
  const finalY = doc.lastAutoTable.finalY || 30
  doc.setFontSize(11)
  doc.text('Detalle de movimientos', 14, finalY + 10)
  autoTable(doc, {
    startY: finalY + 14,
    head: [['Hora', 'Tipo', 'Concepto', 'Descripción', 'Valor', 'Registrado por']],
    body: movimientos.map(m => [
      new Date(m.fecha).toLocaleTimeString('es-CO'),
      m.tipo === 'ingreso' ? 'Ingreso' : 'Egreso',
      m.concepto,
      m.descripcion,
      formatCOP(m.valor),
      m.registrado_por,
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [15, 23, 42] },
  })

  doc.save(`movimientos_${bodegaNombre}_${fecha}.pdf`)
}