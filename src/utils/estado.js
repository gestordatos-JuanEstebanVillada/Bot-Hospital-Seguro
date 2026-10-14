const ESTADO_ETIQUETAS = {
  PL: 'Planeado',
};

function etiquetaEstado(codigoEstado) {
  if (codigoEstado == null) return '';
  const clave = String(codigoEstado).trim().toUpperCase();
  return ESTADO_ETIQUETAS[clave] ?? String(codigoEstado);
}

module.exports = { etiquetaEstado };
