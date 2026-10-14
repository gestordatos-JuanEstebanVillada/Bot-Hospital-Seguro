const { etiquetaEstado } = require('../utils/estado');
const { COLOR_ROSADO_LIGA } = require('../config/brand');
const { ESCENARIO, formatearFechaCompromiso, parseFechaCompromiso } = require('../utils/fechas');

function formatearFecha(valor) {
  const normalizada = parseFechaCompromiso(valor);
  if (normalizada) return formatearFechaCompromiso(normalizada);
  if (valor == null) return '—';
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

function mensajesPorEscenario(escenario, fechaCompromisoTexto) {
  switch (escenario) {
    case ESCENARIO.CINCO_DIAS_ANTES:
      return {
        tituloEncabezado: 'Aviso: tarea por vencer en 5 días',
        asunto: (numEvento) =>
          `¡Aviso! Tarea por vencer en 5 días - Evento #${numEvento}`,
        cuerpoIntro: `Recuerda que en 5 días se vence esta tarea (Fecha de compromiso: ${fechaCompromisoTexto}).`,
      };
    case ESCENARIO.UN_DIA_ANTES:
      return {
        tituloEncabezado: 'Urgente: tarea vence mañana',
        asunto: (numEvento) => `¡Urgente! Tarea vence mañana - Evento #${numEvento}`,
        cuerpoIntro: '¡Atención! Mañana se vence esta tarea.',
      };
    case ESCENARIO.QUINCE_DIAS_DESPUES:
      return {
        tituloEncabezado: 'Alerta: tarea vencida hace 15 días',
        asunto: (numEvento) =>
          `¡Alerta! Tarea vencida hace 15 días - Evento #${numEvento}`,
        cuerpoIntro: `Recuerda que la tarea venció hace 15 días (Fecha de compromiso original: ${fechaCompromisoTexto}).`,
      };
    default:
      throw new Error(`Escenario de correo no reconocido: ${escenario}`);
  }
}

function buildAsunto(numEvento, escenario) {
  return mensajesPorEscenario(escenario, '').asunto(numEvento);
}

function buildHtmlCorreo(fila, escenario) {
  const estadoTexto = etiquetaEstado(fila.ESTADO ?? fila.estado);
  const numEvento = fila.NUM_EVENTO ?? fila.num_evento;
  const rosa = COLOR_ROSADO_LIGA;
  const fechaCompromisoRaw = fila.FECHA_COMPROMISO ?? fila.fecha_compromiso;
  const fechaCompromisoTexto = formatearFecha(fechaCompromisoRaw);
  const { tituloEncabezado, cuerpoIntro } = mensajesPorEscenario(
    escenario,
    fechaCompromisoTexto
  );

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escaparHtml(tituloEncabezado)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f0f2;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f5f0f2;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background:#ffffff;border-radius:8px;box-shadow:0 2px 12px rgba(188,20,95,0.12);overflow:hidden;border-top:4px solid ${rosa};">
          <tr>
            <td style="background:${rosa};color:#ffffff;padding:20px 28px;">
              <h1 style="margin:0;font-size:18px;font-weight:600;">${escaparHtml(tituloEncabezado)}</h1>
              <p style="margin:6px 0 0;font-size:14px;opacity:0.95;">Evento #${escaparHtml(numEvento)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;color:#333333;font-size:15px;line-height:1.5;">
              <p style="margin:0 0 16px;">Hola,</p>
              <p style="margin:0 0 20px;">
                ${escaparHtml(cuerpoIntro)}
                Detalle de la tarea en estado <strong style="color:${rosa};">${escaparHtml(estadoTexto)}</strong>:
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
                  ${escaparHtml(fechaCompromisoTexto)}
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
