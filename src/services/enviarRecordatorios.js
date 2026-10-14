const oracledb = require('oracledb');
const { getOracleConfig } = require('../config/oracle');
const { correosUsuarios } = require('../config/correosUsuarios');
const { SQL_TAREAS_PLANEADAS } = require('../queries/tareasPlaneadas');
const { crearTransporter } = require('../email/transporter');
const { buildAsunto, buildHtmlCorreo } = require('../email/template');
const {
  resolverEscenarioEnvio,
  parseFechaCompromiso,
  hoyInicioDia,
  ZONA_HORARIA,
} = require('../utils/fechas');

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
    const hoy = hoyInicioDia().format('YYYY-MM-DD');
    console.log(`[bot] Iniciando consulta de tareas planeadas (fecha local ${ZONA_HORARIA}: ${hoy})...`);
    oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

    connection = await oracledb.getConnection(getOracleConfig());
    const result = await connection.execute(SQL_TAREAS_PLANEADAS);
    const filas = result.rows ?? [];

    console.log(`[bot] Registros obtenidos: ${filas.length}`);

    if (filas.length === 0) {
      console.log('[bot] No hay tareas planeadas en la consulta.');
      return;
    }

    const transporter = await crearTransporter();
    const remitente = process.env.GMAIL_USER;

    let enviados = 0;
    let omitidosSinCorreo = 0;
    let omitidosPorFecha = 0;
    let omitidosFechaInvalida = 0;

    for (const fila of filas) {
      const fechaCompromisoRaw = obtenerCampo(fila, 'FECHA_COMPROMISO', 'fecha_compromiso');
      if (fechaCompromisoRaw == null) {
        omitidosFechaInvalida += 1;
        console.log('[bot] Registro sin fecha_compromiso; omitido.');
        continue;
      }

      const resolucion = resolverEscenarioEnvio(fechaCompromisoRaw);

      if (!resolucion) {
        if (!parseFechaCompromiso(fechaCompromisoRaw)) {
          omitidosFechaInvalida += 1;
          console.log('[bot] fecha_compromiso no parseable; omitido.');
        } else {
          omitidosPorFecha += 1;
        }
        continue;
      }

      const { escenario } = resolucion;
      const usuarioRaw = obtenerCampo(fila, 'USUARIO', 'usuario');
      const usuarioKey = normalizarUsuario(usuarioRaw);
      const destino = correosUsuarios[usuarioKey];

      if (!destino) {
        omitidosSinCorreo += 1;
        console.log(
          `[bot] Sin correo configurado para usuario "${usuarioRaw ?? '(vacío)'}". Registro omitido.`
        );
        continue;
      }

      const numEvento = obtenerCampo(fila, 'NUM_EVENTO', 'num_evento');
      const asunto = buildAsunto(numEvento, escenario);
      const html = buildHtmlCorreo(fila, escenario);

      try {
        const info = await transporter.sendMail({
          from: remitente,
          to: destino,
          subject: asunto,
          html,
        });

        enviados += 1;
        console.log(
          `[bot] Correo enviado (${escenario}) a ${destino} (usuario: ${usuarioKey}, evento #${numEvento}, messageId: ${info.messageId})`
        );
      } catch (errEnvio) {
        console.error(
          `[bot] Error al enviar correo a ${destino} (evento #${numEvento}, ${escenario}):`,
          errEnvio.message
        );
      }
    }

    console.log(
      `[bot] Proceso finalizado. Enviados: ${enviados}, omitidos por fecha/escenario: ${omitidosPorFecha}, sin correo: ${omitidosSinCorreo}, fecha inválida: ${omitidosFechaInvalida}.`
    );
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
