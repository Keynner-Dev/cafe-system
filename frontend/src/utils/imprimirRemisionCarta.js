const LOGO_BASE64 = 'data:image/png;base64,data:image/png;base64,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'

const formatCOP = (val) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val || 0)

/**
 * Abre una ventana nueva con la remisión formateada para hoja Carta y
 * dispara la impresión. `venta` es el objeto tal como lo devuelve la
 * API (mismo shape que usan VentaModal y VentaDetalle). `pieTexto` deja
 * decir "Generado el" (primera impresión) o "Reimpreso el" (reimpresión)
 * sin duplicar el resto de la plantilla.
 */
export function imprimirRemisionCarta(venta, { pieTexto = 'Generado el' } = {}) {
  const fecha = new Date(venta.fecha + 'T12:00:00').toLocaleDateString('es-CO', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  const tieneCalidad = venta.detalles.some(
    d => d.muestra || d.factor || d.humedad || d.pasilla
  )

  const filasMercancia = venta.detalles.map(d => {
    const calidad = tieneCalidad ? `
      <td>${d.muestra || '—'}</td>
      <td>${d.factor ?? '—'}</td>
      <td>${d.humedad != null ? d.humedad + '%' : '—'}</td>
      <td>${d.pasilla != null ? d.pasilla + '%' : '—'}</td>
    ` : ''
    return `
      <tr>
        <td><strong>${d.tipo_cafe_nombre}</strong></td>
        <td>${d.bodega_nombre}</td>
        <td class="num">${d.bultos}</td>
        <td class="num">${Number(d.kilos).toLocaleString('es-CO')} kg</td>
        ${calidad}
      </tr>`
  }).join('')

  const columnasCalidad = tieneCalidad
    ? '<th>Muestra</th><th>Factor</th><th>Humedad</th><th>Pasilla</th>'
    : ''

  const ventana = window.open('', '_blank', 'width=900,height=1100')
  ventana.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${venta.numero_remision} — Cafe San Joaquin</title>
      <style>
        @page { size: letter portrait; margin: 15mm 18mm; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: Arial, Helvetica, sans-serif;
          color: #111827;
          font-size: 12px;
          line-height: 1.5;
        }

        /* ── Encabezado ── */
        .encabezado {
          display: flex; justify-content: space-between; align-items: flex-start;
          border-bottom: 2px solid #16a34a; padding-bottom: 14px; margin-bottom: 20px;
        }
        .marca { display: flex; align-items: center; gap: 14px; }
        .marca img { width: 60px; height: auto; }
        .marca-texto h1 { font-size: 18px; letter-spacing: .4px; color: #0f172a; }
        .marca-texto p { font-size: 11px; color: #475569; margin-top: 2px; }
        .remision-box { text-align: right; }
        .remision-box .titulo {
          font-size: 10px; text-transform: uppercase; letter-spacing: .06em; color: #64748b;
        }
        .remision-box .numero { font-size: 24px; font-weight: 700; color: #16a34a; margin-top: 2px; }
        .remision-box .fecha { font-size: 12px; color: #334155; margin-top: 2px; text-transform: capitalize; }

        /* ── Secciones ── */
        .seccion { margin-bottom: 18px; }
        .seccion-titulo {
          font-size: 10px; font-weight: 700; text-transform: uppercase;
          letter-spacing: .06em; color: #16a34a;
          border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;
        }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .dato-label { font-size: 9px; text-transform: uppercase; letter-spacing: .04em; color: #94a3b8; }
        .dato-valor { font-size: 12px; color: #0f172a; margin-bottom: 8px; }

        /* ── Tabla de mercancía ── */
        table.mercancia { width: 100%; border-collapse: collapse; margin-top: 4px; }
        table.mercancia th {
          background: #0f172a; color: #e2e8f0; font-size: 10px; font-weight: 500;
          text-transform: uppercase; letter-spacing: .03em; text-align: left; padding: 8px 10px;
        }
        table.mercancia th.num, table.mercancia td.num { text-align: right; }
        table.mercancia td { padding: 8px 10px; font-size: 12px; border-bottom: 1px solid #f1f5f9; }
        table.mercancia tr.fila-total td {
          font-weight: 700; border-top: 2px solid #0f172a; border-bottom: none; background: #f8fafc;
        }

        /* ── Flete ── */
        .flete-box {
          margin-top: 16px; padding: 10px 16px; border: 1px solid #bbf7d0;
          background: #f0fdf4; border-radius: 6px;
          display: flex; justify-content: space-between; align-items: center;
        }
        .flete-box .label { font-size: 11px; color: #15803d; font-weight: 600; }
        .flete-box .detalle { font-size: 10px; color: #475569; margin-top: 2px; }
        .flete-box .valor { font-size: 16px; font-weight: 700; color: #16a34a; }

        .nota { font-size: 11px; color: #475569; margin-top: 12px; }

        /* ── Firmas ── */
        .firmas { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; margin-top: 60px; }
        .firma-linea { border-top: 1px solid #0f172a; padding-top: 6px; text-align: center; }
        .firma-linea .titulo { font-size: 10px; font-weight: 600; color: #0f172a; }
        .firma-linea .sub { font-size: 9px; color: #94a3b8; margin-top: 1px; }

        /* ── Pie ── */
        .pie {
          margin-top: 30px; text-align: center; font-size: 9px; color: #94a3b8;
          border-top: 1px solid #e2e8f0; padding-top: 10px;
        }
      </style>
    </head>
    <body>

      <div class="encabezado">
        <div class="marca">
          <img src="${LOGO_BASE64}" alt="Cafe San" />
          <div class="marca-texto">
            <h1>CAFE SAN JOAQUIN</h1>
            <p>Jimmi Martinez &middot; NIT 901659573-6 &middot; Tel. 3114343274</p>
          </div>
        </div>
        <div class="remision-box">
          <div class="titulo">Remision</div>
          <div class="numero">${venta.numero_remision}</div>
          <div class="fecha">${fecha}</div>
        </div>
      </div>

      <div class="seccion">
        <div class="seccion-titulo">Empresa compradora</div>
        <div class="dato-valor" style="font-size:14px; font-weight:600;">${venta.empresa_nombre}</div>
        ${venta.cuenta ? `<div class="dato-label">Cuenta</div><div class="dato-valor">${venta.cuenta}</div>` : ''}
      </div>

      <div class="seccion grid-2">
        <div>
          <div class="seccion-titulo">Conductor</div>
          <div class="dato-label">Nombre</div>
          <div class="dato-valor">${venta.conductor_nombre}</div>
          <div class="dato-label">Cedula</div>
          <div class="dato-valor">${venta.conductor_cedula}</div>
          ${venta.conductor_telefono ? `<div class="dato-label">Telefono</div><div class="dato-valor">${venta.conductor_telefono}</div>` : ''}
          ${venta.conductor_direccion ? `<div class="dato-label">Direccion</div><div class="dato-valor">${venta.conductor_direccion}</div>` : ''}
        </div>
        <div>
          <div class="seccion-titulo">Vehiculo</div>
          <div class="dato-label">Placas</div>
          <div class="dato-valor">${venta.vehiculo_placas}</div>
          ${venta.vehiculo_clase  ? `<div class="dato-label">Clase</div><div class="dato-valor">${venta.vehiculo_clase}</div>`   : ''}
          ${venta.vehiculo_marca  ? `<div class="dato-label">Marca</div><div class="dato-valor">${venta.vehiculo_marca}</div>`   : ''}
          ${venta.vehiculo_color  ? `<div class="dato-label">Color</div><div class="dato-valor">${venta.vehiculo_color}</div>`   : ''}
          ${venta.vehiculo_modelo ? `<div class="dato-label">Modelo</div><div class="dato-valor">${venta.vehiculo_modelo}</div>` : ''}
        </div>
      </div>

      <div class="seccion">
        <div class="seccion-titulo">Mercancia</div>
        <table class="mercancia">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Bodega</th>
              <th class="num">Bultos</th>
              <th class="num">Kilos</th>
              ${columnasCalidad}
            </tr>
          </thead>
          <tbody>
            ${filasMercancia}
            <tr class="fila-total">
              <td colspan="2">Total</td>
              <td class="num">${venta.total_bultos}</td>
              <td class="num">${Number(venta.total_kilos).toLocaleString('es-CO')} kg</td>
              ${tieneCalidad ? '<td colspan="4"></td>' : ''}
            </tr>
          </tbody>
        </table>
      </div>

      ${Number(venta.flete_valor) > 0 ? `
      <div class="flete-box">
        <div>
          <div class="label">Flete</div>
          ${venta.flete_pagadero_por ? `<div class="detalle">Pagadero por: ${venta.flete_pagadero_por}</div>` : ''}
        </div>
        <div class="valor">${formatCOP(venta.flete_valor)}</div>
      </div>` : ''}

      ${venta.nota ? `<p class="nota"><strong>Nota:</strong> ${venta.nota}</p>` : ''}

      <div class="firmas">
        <div class="firma-linea">
          <div class="titulo">Entregado por</div>
          <div class="sub">Cafe San Joaquin</div>
        </div>
        <div class="firma-linea">
          <div class="titulo">Recibido por</div>
          <div class="sub">${venta.empresa_nombre}</div>
        </div>
      </div>

      <div class="pie">
        Cafe San Joaquin SAS &middot; ${pieTexto} ${new Date().toLocaleDateString('es-CO')}
      </div>

      <script>window.onload = () => window.print()</script>
    </body>
    </html>
  `)
  ventana.document.close()
}