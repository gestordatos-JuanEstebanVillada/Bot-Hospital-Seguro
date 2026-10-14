const oracledb = require('oracledb');
const { getOracleConfig } = require('../config/oracle');
const { correosUsuarios } = require('../config/correosUsuarios');
const { SQL_TAREAS_PLANEADAS } = require('../queries/tareasPlaneadas');
const { crearTransporter } = require('../email/transporter');
const { buildAsunto, buildHtmlCorreo } = require('../email/template');
function normalizarUsuario(usuario) {
  if (usuario == null) return '';
  return String(usuario).trim().toLowerCase();
}

function obtenerCampo(fila, ...claves) {
  for (const clave of claves) {
    if (fila[clave] !== undefined && fila[clave] !== null) return fila[clave];
  }
  return undefined;
}

async function enviarRecordatoriosTareasPlaneadas() {
  let connection;

  try {
    console.log('[bot] Iniciando consulta de tareas planeadas...');
    oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

    connection = await oracledb.getConnection(getOracleConfig());
    const result = await connection.execute(SQL_TAREAS_PLANEADAS);
    const filas = result.rows ?? [];

    console.log(`[bot] Registros obtenidos: ${filas.length}`);

    if (filas.length === 0) {
      console.log('[bot] No hay tareas planeadas para notificar.');
      return;
    }

    const transporter = await crearTransporter();
    const remitente = process.env.GMAIL_USER;

    let enviados = 0;
    let omitidos = 0;

    for (const fila of filas) {
      const usuarioRaw = obtenerCampo(fila, 'USUARIO', 'usuario');
      const usuarioKey = normalizarUsuario(usuarioRaw);
      const destino = correosUsuarios[usuarioKey];

      if (!destino) {
        omitidos += 1;
        console.log(
          `[bot] Sin correo configurado para usuario "${usuarioRaw ?? '(vacío)'}". Registro omitido.`
        );
        continue;
      }

      const numEvento = obtenerCampo(fila, 'NUM_EVENTO', 'num_evento');
      const asunto = buildAsunto(numEvento);
      const html = buildHtmlCorreo(fila);

      try {
        const info = await transporter.sendMail({
          from: remitente,
          to: destino,
          subject: asunto,
          html,
        });

        enviados += 1;
        console.log(
          `[bot] Correo enviado a ${destino} (usuario: ${usuarioKey}, evento #${numEvento}, messageId: ${info.messageId})`
        );
      } catch (errEnvio) {
        console.error(
          `[bot] Error al enviar correo a ${destino} (evento #${numEvento}):`,
          errEnvio.message
        );
      }
    }

    console.log(`[bot] Proceso finalizado. Enviados: ${enviados}, omitidos: ${omitidos}.`);
  } catch (error) {
    console.error('[bot] Error en el proceso de recordatorios:', error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log('[bot] Conexión Oracle cerrada correctamente.');
      } catch (errClose) {
        console.error('[bot] Error al cerrar la conexión Oracle:', errClose.message);
      }
    }
  }
}

module.exports = { enviarRecordatoriosTareasPlaneadas };
