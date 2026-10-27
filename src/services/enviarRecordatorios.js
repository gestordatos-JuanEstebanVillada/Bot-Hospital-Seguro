const oracledb = require('oracledb');
const { correosUsuarios } = require('../config/correosUsuarios');
const { SQL_TAREAS_PLANEADAS } = require('../queries/tareasPlaneadas');
const { crearTransporter } = require('../email/transporter');
const { buildAsunto, buildHtmlCorreo } = require('../email/template');
const { resolverDestino } = require('../utils/destinoCorreo');
const { getPool } = require('../db/oraclePool');
const { registrarEnvioExitoso } = require('./historialCorreos');
const {
  resolverEscenarioEnvio,
  parseFechaCompromiso,
  hoyInicioDia,
  ZONA_HORARIA,
  ESCENARIO,
} = require('../utils/fechas');

const ESCENARIOS_PRUEBA = [
  ESCENARIO.CINCO_DIAS_ANTES,
  ESCENARIO.UN_DIA_ANTES,
  ESCENARIO.QUINCE_DIAS_DESPUES,
];

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

function escenarioParaHistorial(resolucion) {
  return resolucion.escenario;
}

function opcionesPlantillaDesdeResolucion(resolucion) {
  if (resolucion.mesesAtraso != null) {
    return { mesesAtraso: resolucion.mesesAtraso };
  }
  return {};
}

async function enviarUnCorreo(
  transporter,
  remitente,
  destino,
  fila,
  escenario,
  modoPrueba,
  opcionesEscenario = {}
) {
  const numEvento = obtenerCampo(fila, 'NUM_EVENTO', 'num_evento');
  const prefijo = modoPrueba ? '[PRUEBA] ' : '';
  const asunto = prefijo + buildAsunto(numEvento, escenario, opcionesEscenario);
  const html = buildHtmlCorreo(fila, escenario, opcionesEscenario);

  const info = await transporter.sendMail({
    from: remitente,
    to: destino,
    subject: asunto,
    html,
  });

  return { numEvento, info };
}

async function guardarHistorial(connection, fila, destino, escenario, messageId, modoPrueba) {
  try {
    await registrarEnvioExitoso(connection, {
      numEvento: obtenerCampo(fila, 'NUM_EVENTO', 'num_evento'),
      item: obtenerCampo(fila, 'ITEM', 'item'),
      paciente: obtenerCampo(fila, 'PACIENTE', 'paciente'),
      destinatario: destino,
      escenario,
      messageId,
      modoPrueba,
    });
  } catch (err) {
    console.error('[bot] No se pudo registrar HS-historial_correos_bot:', err.message);
  }
}

/**
 * @param {{ modoPrueba?: boolean, soloPrimeraFila?: boolean }} [opciones]
 */
async function enviarRecordatoriosTareasPlaneadas(opciones = {}) {
  const { modoPrueba = false, soloPrimeraFila = false } = opciones;
  let connection;

  try {
    const hoy = hoyInicioDia().format('YYYY-MM-DD');
    const etiquetaModo = modoPrueba ? ' [MODO PRUEBA]' : '';
    console.log(
      `[bot] Iniciando consulta de tareas planeadas${etiquetaModo} (fecha local ${ZONA_HORARIA}: ${hoy})...`
    );

    if (modoPrueba) {
      const destinoSeguro = resolverDestino({ modoPrueba: true, destinoMapeado: null });
      console.log(`[bot] [PRUEBA] Todos los envíos irán únicamente a: ${destinoSeguro}`);
    }

    oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
    connection = await getPool().getConnection();

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
    let filasPruebaProcesadas = 0;

    for (const fila of filas) {
      const usuarioRaw = obtenerCampo(fila, 'USUARIO', 'usuario');
      const usuarioKey = normalizarUsuario(usuarioRaw);
      const destinoMapeado = correosUsuarios[usuarioKey];

      let destino;
      try {
        destino = resolverDestino({ modoPrueba, destinoMapeado });
      } catch (err) {
        console.error('[bot]', err.message);
        throw err;
      }

      if (!modoPrueba && !destino) {
        omitidosSinCorreo += 1;
        console.log(
          `[bot] Sin correo configurado para usuario "${usuarioRaw ?? '(vacío)'}". Registro omitido.`
        );
        continue;
      }

      if (modoPrueba) {
        if (soloPrimeraFila && filasPruebaProcesadas >= 1) {
          break;
        }

        for (const escenario of ESCENARIOS_PRUEBA) {
          try {
            const { numEvento, info } = await enviarUnCorreo(
              transporter,
              remitente,
              destino,
              fila,
              escenario,
              true
            );
            await guardarHistorial(connection, fila, destino, escenario, info.messageId, true);
            enviados += 1;
            console.log(
              `[bot] [PRUEBA] Correo enviado (${escenario}) a ${destino} (usuario BD: ${usuarioKey || 'N/A'}, evento #${numEvento}, messageId: ${info.messageId})`
            );
          } catch (errEnvio) {
            const numEvento = obtenerCampo(fila, 'NUM_EVENTO', 'num_evento');
            console.error(
              `[bot] [PRUEBA] Error al enviar a ${destino} (evento #${numEvento}, ${escenario}):`,
              errEnvio.message
            );
          }
        }

        filasPruebaProcesadas += 1;
        continue;
      }

      const fechaCompromisoRaw = obtenerCampo(fila, 'FECHA_COMPROMISO', 'fecha_compromiso');
      if (fechaCompromisoRaw == null) {
        omitidosFechaInvalida += 1;
        console.log('[bot] Registro sin fecha_compromiso; omitido.');
        continue;
      }

      const ultimaFechaEnvioRaw = obtenerCampo(
        fila,
        'ULTIMA_FECHA_ENVIO',
        'ultima_fecha_envio'
      );
      const resolucion = resolverEscenarioEnvio(fechaCompromisoRaw, ultimaFechaEnvioRaw);

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
      const opcionesEscenario = opcionesPlantillaDesdeResolucion(resolucion);

      try {
        const { numEvento, info } = await enviarUnCorreo(
          transporter,
          remitente,
          destino,
          fila,
          escenario,
          false,
          opcionesEscenario
        );
        await guardarHistorial(
          connection,
          fila,
          destino,
          escenarioParaHistorial(resolucion),
          info.messageId,
          false
        );
        enviados += 1;
        console.log(
          `[bot] Correo enviado (${escenario}) a ${destino} (usuario: ${usuarioKey}, evento #${numEvento}, messageId: ${info.messageId})`
        );
      } catch (errEnvio) {
        const numEvento = obtenerCampo(fila, 'NUM_EVENTO', 'num_evento');
        console.error(
          `[bot] Error al enviar correo a ${destino} (evento #${numEvento}, ${escenario}):`,
          errEnvio.message
        );
      }
    }

    if (modoPrueba) {
      console.log(
        `[bot] [PRUEBA] Finalizado. Correos enviados: ${enviados}, filas usadas: ${filasPruebaProcesadas}.`
      );
    } else {
      console.log(
        `[bot] Proceso finalizado. Enviados: ${enviados}, omitidos por fecha/escenario: ${omitidosPorFecha}, sin correo: ${omitidosSinCorreo}, fecha inválida: ${omitidosFechaInvalida}.`
      );
    }
  } catch (error) {
    console.error('[bot] Error en el proceso de recordatorios:', error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log('[bot] Conexión Oracle devuelta al pool.');
      } catch (errClose) {
        console.error('[bot] Error al devolver conexión Oracle:', errClose.message);
      }
    }
  }
}

module.exports = { enviarRecordatoriosTareasPlaneadas };
