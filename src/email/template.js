const { etiquetaEstado } = require('../utils/estado');
const { COLOR_ROSADO_LIGA } = require('../config/brand');

function formatearFecha(valor) {
  if (valor == null) return '—';
  if (valor instanceof Date) {
    return valor.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
  return String(valor);
}

function escaparHtml(texto) {
  if (texto == null) return '';
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildAsunto(numEvento) {
  return `Recordatorio de Tarea Planeada - Evento #${numEvento}`;
}

function buildHtmlCorreo(fila) {
  const estadoTexto = etiquetaEstado(fila.ESTADO ?? fila.estado);
  const numEvento = fila.NUM_EVENTO ?? fila.num_evento;
  const rosa = COLOR_ROSADO_LIGA;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recordatorio de tarea planeadas - Hospital Seguro</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f0f2;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f5f0f2;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background:#ffffff;border-radius:8px;box-shadow:0 2px 12px rgba(188,20,95,0.12);overflow:hidden;border-top:4px solid ${rosa};">
          <tr>
            <td style="background:${rosa};color:#ffffff;padding:20px 28px;">
              <h1 style="margin:0;font-size:18px;font-weight:600;">Recordatorio de tarea planeadas</h1>
              <p style="margin:6px 0 0;font-size:14px;opacity:0.95;">Evento #${escaparHtml(numEvento)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;color:#333333;font-size:15px;line-height:1.5;">
              <p style="margin:0 0 16px;">Hola,</p>
              <p style="margin:0 0 20px;">
                Te recordamos que tienes una tarea en estado <strong style="color:${rosa};">${escaparHtml(estadoTexto)}</strong>.
                A continuación encontrarás el detalle:
              </p>
              <ul style="margin:0;padding:0;list-style:none;border:1px solid #ecd0dc;border-radius:6px;overflow:hidden;">
                <li style="padding:12px 16px;border-bottom:1px solid #ecd0dc;background:#fdf8fa;">
                  <strong style="color:${rosa};">Historia:</strong>
                  ${escaparHtml(fila.HISTORIA ?? fila.historia)}
                </li>
                <li style="padding:12px 16px;border-bottom:1px solid #ecd0dc;">
                  <strong style="color:${rosa};">Identificación:</strong>
                  ${escaparHtml(fila.IDENTIFICACION ?? fila.identificacion)}
                </li>
                <li style="padding:12px 16px;border-bottom:1px solid #ecd0dc;background:#fdf8fa;">
                  <strong style="color:${rosa};">Paciente:</strong>
                  ${escaparHtml(fila.PACIENTE ?? fila.paciente)}
                </li>
                <li style="padding:12px 16px;border-bottom:1px solid #ecd0dc;">
                  <strong style="color:${rosa};">Número de Evento:</strong>
                  ${escaparHtml(numEvento)}
                </li>
                <li style="padding:12px 16px;border-bottom:1px solid #ecd0dc;background:#fdf8fa;">
                  <strong style="color:${rosa};">Ítem:</strong>
                  ${escaparHtml(fila.ITEM ?? fila.item)}
                </li>
                <li style="padding:12px 16px;border-bottom:1px solid #ecd0dc;">
                  <strong style="color:${rosa};">Tarea:</strong>
                  ${escaparHtml(fila.TAREA ?? fila.tarea)}
                </li>
                <li style="padding:12px 16px;border-bottom:1px solid #ecd0dc;background:#fdf8fa;">
                  <strong style="color:${rosa};">Fecha de Compromiso:</strong>
                  ${escaparHtml(formatearFecha(fila.FECHA_COMPROMISO ?? fila.fecha_compromiso))}
                </li>
                <li style="padding:12px 16px;">
                  <strong style="color:${rosa};">Estado:</strong>
                  ${escaparHtml(estadoTexto)}
                </li>
              </ul>
              <p style="margin:24px 0 0;color:#666;font-size:13px;">
                Este mensaje fue generado automáticamente. Por favor no respondas a este correo.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

module.exports = { buildAsunto, buildHtmlCorreo };
