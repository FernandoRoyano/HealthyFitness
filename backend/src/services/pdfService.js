import PDFDocument from 'pdfkit';
import Centro from '../models/Centro.js';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const generarPDFFactura = async (factura) => {
  const centro = await Centro.obtenerCentro();

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Factura ${factura.numeroFactura}`,
          Author: centro.nombre
        }
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // === CABECERA ===
      // Datos del centro (izquierda)
      doc.fontSize(18).font('Helvetica-Bold')
         .fillColor(centro.colorPrimario || '#75b760')
         .text(centro.nombre, 50, 50);

      doc.fontSize(10).font('Helvetica')
         .fillColor('#333333');

      let y = 75;
      if (centro.direccion) {
        doc.text(centro.direccion, 50, y);
        y += 15;
      }
      if (centro.codigoPostal || centro.ciudad) {
        doc.text(`${centro.codigoPostal || ''} ${centro.ciudad || ''}`.trim(), 50, y);
        y += 15;
      }
      if (centro.nif) {
        doc.text(`NIF: ${centro.nif}`, 50, y);
        y += 15;
      }
      if (centro.telefono) {
        doc.text(`Tel: ${centro.telefono}`, 50, y);
        y += 15;
      }
      if (centro.email) {
        doc.text(`Email: ${centro.email}`, 50, y);
      }

      // Numero de factura (derecha)
      doc.fontSize(24).font('Helvetica-Bold')
         .fillColor('#333333')
         .text('FACTURA', 350, 50, { align: 'right', width: 195 });

      doc.fontSize(12).font('Helvetica')
         .text(factura.numeroFactura, 350, 80, { align: 'right', width: 195 });

      const fechaEmision = factura.fechaEmision || factura.fechaGeneracion || new Date();
      doc.fontSize(10)
         .text(`Fecha: ${new Date(fechaEmision).toLocaleDateString('es-ES')}`, 350, 100, { align: 'right', width: 195 });

      // Linea separadora
      doc.moveTo(50, 160).lineTo(545, 160).strokeColor('#e0e0e0').stroke();

      // === DATOS CLIENTE ===
      doc.fontSize(12).font('Helvetica-Bold')
         .fillColor('#333333')
         .text('FACTURAR A:', 50, 180);

      doc.fontSize(10).font('Helvetica');
      y = 200;

      const clienteNombre = `${factura.cliente?.nombre || ''} ${factura.cliente?.apellido || ''}`.trim();
      if (clienteNombre) {
        doc.text(clienteNombre, 50, y);
        y += 15;
      }
      if (factura.cliente?.direccion) {
        doc.text(factura.cliente.direccion, 50, y);
        y += 15;
      }
      if (factura.cliente?.email) {
        doc.text(`Email: ${factura.cliente.email}`, 50, y);
        y += 15;
      }
      if (factura.cliente?.telefono) {
        doc.text(`Tel: ${factura.cliente.telefono}`, 50, y);
      }

      // Periodo (derecha)
      doc.fontSize(12).font('Helvetica-Bold')
         .text('PERIODO:', 350, 180);
      doc.fontSize(10).font('Helvetica')
         .text(`${MESES[factura.mes - 1]} ${factura.anio}`, 350, 200);

      // === TABLA DE DETALLE ===
      const tableTop = 280;
      const tableLeft = 50;
      const colWidths = [250, 70, 100, 75];

      // Cabecera de tabla
      doc.fillColor('#f5f5f5')
         .rect(tableLeft, tableTop, 495, 25)
         .fill();

      doc.fillColor('#333333')
         .fontSize(10)
         .font('Helvetica-Bold');

      doc.text('CONCEPTO', tableLeft + 10, tableTop + 8);
      doc.text('CANTIDAD', tableLeft + colWidths[0] + 10, tableTop + 8);
      doc.text('PRECIO UNIT.', tableLeft + colWidths[0] + colWidths[1] + 10, tableTop + 8);
      doc.text('TOTAL', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + 10, tableTop + 8);

      // Linea bajo cabecera
      doc.moveTo(tableLeft, tableTop + 25)
         .lineTo(tableLeft + 495, tableTop + 25)
         .strokeColor('#e0e0e0')
         .stroke();

      // Fila de datos
      y = tableTop + 35;
      doc.font('Helvetica').fontSize(10);

      const concepto = factura.datosSuscripcion?.nombreProducto || 'Sesiones de entrenamiento';
      const cantidad = factura.totalSesionesACobrar || 0;
      const precioUnitario = factura.datosSuscripcion?.precioUnitario || 0;
      const subtotal = factura.subtotal || 0;

      doc.text(concepto, tableLeft + 10, y, { width: colWidths[0] - 20 });
      doc.text(cantidad.toString(), tableLeft + colWidths[0] + 10, y);
      doc.text(`${precioUnitario.toFixed(2)} EUR`, tableLeft + colWidths[0] + colWidths[1] + 10, y);
      doc.text(`${subtotal.toFixed(2)} EUR`, tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + 10, y);

      y += 25;

      // Descuentos (si hay)
      if (factura.totalDescuentos > 0) {
        doc.fillColor('#666666')
           .text('Descuento', tableLeft + 10, y);
        doc.text(`-${factura.totalDescuentos.toFixed(2)} EUR`, tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + 10, y);
        y += 25;
      }

      // Linea sobre total
      y += 10;
      doc.moveTo(tableLeft + 300, y)
         .lineTo(tableLeft + 495, y)
         .strokeColor('#333333')
         .stroke();

      // TOTAL
      y += 15;
      doc.fontSize(14).font('Helvetica-Bold')
         .fillColor('#333333')
         .text('TOTAL:', tableLeft + 300, y);
      doc.text(`${(factura.totalAPagar || 0).toFixed(2)} EUR`, tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + 10, y);

      // === ESTADO DE PAGO ===
      y += 50;
      const estadoColor = factura.estado === 'pagada' ? '#22c55e' :
                          factura.estado === 'parcial' ? '#f59e0b' : '#ef4444';

      doc.fontSize(10).font('Helvetica-Bold')
         .fillColor(estadoColor)
         .text(`Estado: ${factura.estado.toUpperCase()}`, 50, y);

      if (factura.totalPagado > 0 && factura.totalPagado < factura.totalAPagar) {
        doc.font('Helvetica')
           .fillColor('#333333')
           .text(`Pagado: ${factura.totalPagado.toFixed(2)} EUR | Pendiente: ${(factura.totalAPagar - factura.totalPagado).toFixed(2)} EUR`, 50, y + 15);
      }

      // === DATOS BANCARIOS ===
      if (centro.iban && factura.estado !== 'pagada') {
        y += 50;
        doc.fontSize(10).font('Helvetica-Bold')
           .fillColor('#333333')
           .text('FORMA DE PAGO:', 50, y);

        doc.font('Helvetica')
           .text('Transferencia bancaria', 50, y + 15);
        doc.text(`IBAN: ${centro.iban}`, 50, y + 30);
        doc.text(`Titular: ${centro.titular || centro.nombre}`, 50, y + 45);
      }

      // === PIE DE PAGINA ===
      if (centro.pieFactura) {
        doc.fontSize(8).font('Helvetica')
           .fillColor('#666666')
           .text(centro.pieFactura, 50, 750, {
             width: 495,
             align: 'center'
           });
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
