const MENSAJE_CORREO_PRUEBA_OBLIGATORIO =
  'Seguridad: en modo prueba debe definir CORREO_PRUEBA en .env (ej. gestor.datos@laliga.org.co). ' +
  'Sin esta variable no se enviará ningún correo de prueba.';

/**
 * Modo prueba: destino SIEMPRE es CORREO_PRUEBA (nunca correosUsuarios).
 */
function obtenerDestinoModoPrueba() {
  const correo = process.env.CORREO_PRUEBA?.trim();
  if (!correo) {
    throw new Error(MENSAJE_CORREO_PRUEBA_OBLIGATORIO);
  }
  return correo;
}

function resolverDestino({ modoPrueba, destinoMapeado }) {
  if (modoPrueba) {
    return obtenerDestinoModoPrueba();
  }
  return destinoMapeado ?? null;
}

module.exports = {
  MENSAJE_CORREO_PRUEBA_OBLIGATORIO,
  obtenerDestinoModoPrueba,
  resolverDestino,
};
