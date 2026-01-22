import nodemailer from 'nodemailer';
import Centro from '../models/Centro.js';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

let transporter = null;

const getTransporter = async () => {
  if (transporter) return transporter;

  // Verificar que las credenciales SMTP esten configuradas
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('Configuracion SMTP no encontrada. Configure las variables de entorno SMTP_HOST, SMTP_USER y SMTP_PASS');
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  // Verificar conexion
  try {
    await transporter.verify();
    console.log('Conexion SMTP verificada correctamente');
  } catch (error) {
    console.error('Error verificando conexion SMTP:', error.message);
    transporter = null;
    throw new Error('No se pudo conectar al servidor SMTP: ' + error.message);
  }

  return transporter;
};

export const enviarFacturaPorEmail = async (factura, pdfBuffer) => {
  const centro = await Centro.obtenerCentro();
  const transport = await getTransporter();

  const clienteNombre = `${factura.cliente?.nombre || ''} ${factura.cliente?.apellido || ''}`.trim();
  const clienteEmail = factura.cliente?.email;

  if (!clienteEmail) {
    throw new Error('El cliente no tiene email registrado');
  }

  const periodoTexto = `${MESES[factura.mes - 1]} ${factura.anio}`;
  const colorPrimario = centro.colorPrimario || '#75b760';

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      border-bottom: 3px solid ${colorPrimario};
      padding-bottom: 20px;
      margin-bottom: 20px;
    }
    .header h1 {
      color: ${colorPrimario};
      margin: 0;
      font-size: 24px;
    }
    .content {
      background: #f9f9f9;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .content p {
      margin: 10px 0;
    }
    .highlight {
      font-weight: bold;
      color: ${colorPrimario};
    }
    .info-box {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 15px;
      margin: 15px 0;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      color: #666;
    }
    .info-value {
      font-weight: bold;
    }
    .bank-info {
      background: #fff8e6;
      border: 1px solid #ffd54f;
      border-radius: 8px;
      padding: 15px;
      margin: 20px 0;
    }
    .bank-info h3 {
      margin-top: 0;
      color: #f57c00;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      color: #666;
      font-size: 12px;
    }
    .button {
      display: inline-block;
      background: ${colorPrimario};
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${centro.nombre}</h1>
  </div>

  <p>Estimado/a <strong>${clienteNombre}</strong>,</p>

  <p>Adjuntamos su factura correspondiente al periodo de <span class="highlight">${periodoTexto}</span>.</p>

  <div class="info-box">
    <div class="info-row">
      <span class="info-label">Numero de factura:</span>
      <span class="info-value">${factura.numeroFactura}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Periodo:</span>
      <span class="info-value">${periodoTexto}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Total:</span>
      <span class="info-value">${(factura.totalAPagar || 0).toFixed(2)} EUR</span>
    </div>
    <div class="info-row">
      <span class="info-label">Estado:</span>
      <span class="info-value">${factura.estado}</span>
    </div>
  </div>

  ${centro.iban && factura.estado !== 'pagada' ? `
  <div class="bank-info">
    <h3>Datos para el pago</h3>
    <p><strong>IBAN:</strong> ${centro.iban}</p>
    <p><strong>Titular:</strong> ${centro.titular || centro.nombre}</p>
    ${centro.banco ? `<p><strong>Banco:</strong> ${centro.banco}</p>` : ''}
  </div>
  ` : ''}

  <p>Encontrara la factura adjunta en formato PDF.</p>

  <p>Un cordial saludo,<br>
  <strong>${centro.nombre}</strong></p>

  ${centro.telefono || centro.email ? `
  <div class="footer">
    <p>
      ${centro.telefono ? `Tel: ${centro.telefono}` : ''}
      ${centro.telefono && centro.email ? ' | ' : ''}
      ${centro.email ? `Email: ${centro.email}` : ''}
    </p>
    ${centro.direccion ? `<p>${centro.direccion}</p>` : ''}
  </div>
  ` : ''}
</body>
</html>
  `;

  const mailOptions = {
    from: `"${centro.nombreRemitente || centro.nombre}" <${centro.emailRemitente || process.env.SMTP_USER}>`,
    to: clienteEmail,
    subject: `Factura ${factura.numeroFactura} - ${periodoTexto}`,
    html: htmlContent,
    attachments: [{
      filename: `Factura_${factura.numeroFactura}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf'
    }]
  };

  const result = await transport.sendMail(mailOptions);
  console.log(`Email enviado a ${clienteEmail}: ${result.messageId}`);

  return result;
};

// Verificar configuracion SMTP
export const verificarConfiguracionEmail = async () => {
  try {
    await getTransporter();
    return { configurado: true, mensaje: 'Configuracion SMTP correcta' };
  } catch (error) {
    return { configurado: false, mensaje: error.message };
  }
};
