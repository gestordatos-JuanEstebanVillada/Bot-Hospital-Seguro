const { escaparHtml, formatearFechaEnvio } = require('../utils/html');
const { COLOR_ROSADO_LIGA } = require('../../config/brand');

function etiquetaEscenario(codigo) {
  if (codigo == null) return '—';
  const map = {
    CINCO_DIAS_ANTES: '5 días antes',
    UN_DIA_ANTES: 'Vence mañana',
    QUINCE_DIAS_DESPUES: '15 días vencida',
    RECORDATORIO_INICIAL_ATRASADO: 'Inicial atraso crítico',
    RECORDATORIO_MENSUAL_VENCIDO: 'Recordatorio mensual',
  };
  return map[String(codigo)] ?? String(codigo);
}

function renderDashboardPage({ usuario, filas }) {
  const filasHtml =
    filas.length === 0
      ? `<tr><td colspan="7" class="px-4 py-8 text-center text-gray-500">No hay envíos registrados aún.</td></tr>`
      : filas
          .map((f) => {
            const id = f.ID ?? f.id;
            const numEvento = f.NUM_EVENTO ?? f.num_evento;
            const paciente = f.PACIENTE ?? f.paciente;
            const destinatario = f.DESTINATARIO ?? f.destinatario;
            const fechaEnvio = f.FECHA_ENVIO ?? f.fecha_envio;
            const escenario = f.ESCENARIO ?? f.escenario;
            const messageId = f.MESSAGE_ID ?? f.message_id;
            const modoPrueba = (f.MODO_PRUEBA ?? f.modo_prueba) === 'S';

            return `<tr class="border-b border-rose-100 hover:bg-rose-50/50">
              <td class="px-4 py-3 text-sm text-gray-800">${escaparHtml(id)}</td>
              <td class="px-4 py-3 text-sm font-medium">${escaparHtml(numEvento)}</td>
              <td class="px-4 py-3 text-sm">${escaparHtml(paciente)}</td>
              <td class="px-4 py-3 text-sm">${escaparHtml(destinatario)}</td>
              <td class="px-4 py-3 text-sm whitespace-nowrap">${escaparHtml(formatearFechaEnvio(fechaEnvio))}</td>
              <td class="px-4 py-3 text-sm">
                <span class="inline-block rounded-full px-2 py-0.5 text-xs text-white" style="background:${COLOR_ROSADO_LIGA}">${escaparHtml(etiquetaEscenario(escenario))}</span>
                ${modoPrueba ? '<span class="ml-1 text-xs text-amber-600">[PRUEBA]</span>' : ''}
              </td>
              <td class="px-4 py-3 text-xs text-gray-500 break-all">${escaparHtml(messageId)}</td>
            </tr>`;
          })
          .join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard — Bot Hospital Seguro</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-gray-50">
  <header class="text-white shadow" style="background-color:${COLOR_ROSADO_LIGA}">
    <div class="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-lg font-semibold">Historial de correos enviados</h1>
        <p class="text-sm opacity-90">Sesión: ${escaparHtml(usuario)}</p>
      </div>
      <form method="POST" action="/admin/logout">
        <button type="submit" class="rounded-lg bg-white/20 hover:bg-white/30 px-4 py-2 text-sm">Cerrar sesión</button>
      </form>
    </div>
  </header>

  <main class="max-w-7xl mx-auto px-4 py-8">
    <p class="mb-4 text-sm text-gray-600">Últimos 500 envíos exitosos, ordenados por fecha descendente.</p>
    <div class="overflow-x-auto rounded-xl border border-rose-100 bg-white shadow-sm">
      <table class="min-w-full text-left">
        <thead style="background-color:${COLOR_ROSADO_LIGA}" class="text-white text-xs uppercase tracking-wide">
          <tr>
            <th class="px-4 py-3">ID</th>
            <th class="px-4 py-3">Evento</th>
            <th class="px-4 py-3">Paciente</th>
            <th class="px-4 py-3">Destinatario</th>
            <th class="px-4 py-3">Fecha envío</th>
            <th class="px-4 py-3">Escenario</th>
            <th class="px-4 py-3">Message ID</th>
          </tr>
        </thead>
        <tbody>${filasHtml}</tbody>
      </table>
    </div>
  </main>
</body>
</html>`;
}

module.exports = { renderDashboardPage };
