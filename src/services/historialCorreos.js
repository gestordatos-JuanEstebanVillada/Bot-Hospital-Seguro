/** Nombre con guion: identificador entre comillas en Oracle */
const TABLA_HISTORIAL = '"HS-historial_correos_bot"';

const SQL_INSERT = `
INSERT INTO ${TABLA_HISTORIAL} (
  num_evento,
  item,
  paciente,
  destinatario,
  escenario,
  message_id,
  modo_prueba
) VALUES (
  :num_evento,
  :item,
  :paciente,
  :destinatario,
  :escenario,
  :message_id,
  :modo_prueba
)
`;

const SQL_LISTAR = `
SELECT
  id,
  num_evento,
  item,
  paciente,
  destinatario,
  fecha_envio,
  escenario,
  message_id,
  modo_prueba
FROM ${TABLA_HISTORIAL}
ORDER BY fecha_envio DESC
FETCH FIRST 500 ROWS ONLY
`;

/**
 * @param {import('oracledb').Connection} connection
 */
async function registrarEnvioExitoso(connection, datos) {
  const {
    numEvento,
    item,
    paciente,
    destinatario,
    escenario,
    messageId,
    modoPrueba = false,
  } = datos;

  await connection.execute(
    SQL_INSERT,
    {
      num_evento: numEvento != null ? String(numEvento) : null,
      item: item != null ? String(item).slice(0, 50) : null,
      paciente: paciente != null ? String(paciente).slice(0, 500) : null,
      destinatario: String(destinatario).slice(0, 320),
      escenario: String(escenario).slice(0, 50),
      message_id: messageId != null ? String(messageId).slice(0, 255) : null,
      modo_prueba: modoPrueba ? 'S' : 'N',
    },
    { autoCommit: true }
  );
}

async function listarHistorialEnvios(connection) {
  const result = await connection.execute(SQL_LISTAR);
  return result.rows ?? [];
}

module.exports = {
  TABLA_HISTORIAL,
  registrarEnvioExitoso,
  listarHistorialEnvios,
};
