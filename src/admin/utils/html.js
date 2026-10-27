function escaparHtml(texto) {
  if (texto == null) return '';
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatearFechaEnvio(valor) {
  if (valor == null) return '—';
  if (valor instanceof Date) {
    return valor.toLocaleString('es-CO', { timeZone: 'America/Bogota' });
  }
  return String(valor);
}

module.exports = { escaparHtml, formatearFechaEnvio };
