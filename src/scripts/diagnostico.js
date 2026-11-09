/**
 * Diagnóstico rápido: .env, OAuth Gmail, Oracle y muestra de escenarios.
 * Uso: npm run diagnostico
 */
require('dotenv').config();
const { initOraclePool, closeOraclePool, withConnection } = require('../db/oraclePool');
const { SQL_TAREAS_PLANEADAS } = require('../queries/tareasPlaneadas');
const { correosUsuarios } = require('../config/correosUsuarios');
const { crearTransporter } = require('../email/transporter');
const { resolverEscenarioEnvio, hoyInicioDia, ZONA_HORARIA } = require('../utils/fechas');

function checkEnv() {
  const required = [
    'SCSE_DB_USER',
    'SCSE_DB_PASSWD',
    'SCSE_DB_IP',
    'SCSE_DB_PORT',
    'SCSE_DB_DATABASE',
    'GMAIL_USER',
    'GMAIL_CLIENT_ID',
    'GMAIL_CLIENT_SECRET',
    'GMAIL_REFRESH_TOKEN',
  ];
  const missing = required.filter((k) => !process.env[k]?.trim());
  console.log('[diag] Variables .env:', missing.length ? `FALTAN: ${missing.join(', ')}` : 'OK');
  console.log('[diag] CORREO_PRUEBA:', process.env.CORREO_PRUEBA?.trim() || '(no definido — obligatorio para test-emails)');
  console.log('[diag] Usuarios en correosUsuarios.js:', Object.keys(correosUsuarios).join(', ') || '(vacío)');
}

async function checkGmail() {
  try {
    const t = await crearTransporter();
    await t.verify();
    console.log('[diag] Gmail OAuth2 + transporter.verify(): OK');
  } catch (err) {
    console.error('[diag] Gmail FALLÓ:', err.message);
    if (err.response?.data) console.error('[diag] Detalle API:', err.response.data);
  }
}

async function checkOracleYMuestra() {
  const oracledb = require('oracledb');
  oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

  await withConnection(async (connection) => {
    const result = await connection.execute(SQL_TAREAS_PLANEADAS);
    const filas = result.rows ?? [];
    console.log(`[diag] Oracle consulta principal: ${filas.length} fila(s)`);
    console.log(`[diag] Hoy (${ZONA_HORARIA}):`, hoyInicioDia().format('YYYY-MM-DD'));

    let conCorreo = 0;
    let conEscenarioHoy = 0;

    for (const fila of filas.slice(0, 15)) {
      const usuario = (fila.USUARIO ?? fila.usuario ?? '').toString().trim().toLowerCase();
      const tieneMapa = Boolean(correosUsuarios[usuario]);
      const fc = fila.FECHA_COMPROMISO ?? fila.fecha_compromiso;
      const ult = fila.ULTIMA_FECHA_ENVIO ?? fila.ultima_fecha_envio;
      const res = resolverEscenarioEnvio(fc, ult);
      if (tieneMapa) conCorreo += 1;
      if (tieneMapa && res) conEscenarioHoy += 1;
      console.log(
        `[diag]   evento=${fila.NUM_EVENTO ?? fila.num_evento} usuario="${usuario}" mapa=${tieneMapa ? 'SÍ' : 'NO'} escenario_hoy=${res?.escenario ?? '—'}`
      );
    }

    for (const fila of filas.slice(15)) {
      const usuario = (fila.USUARIO ?? fila.usuario ?? '').toString().trim().toLowerCase();
      if (correosUsuarios[usuario]) {
        conCorreo += 1;
        const res = resolverEscenarioEnvio(
          fila.FECHA_COMPROMISO ?? fila.fecha_compromiso,
          fila.ULTIMA_FECHA_ENVIO ?? fila.ultima_fecha_envio
        );
        if (res) conEscenarioHoy += 1;
      }
    }

    console.log(
      `[diag] Resumen total: con email en mapa=${conCorreo}, listas para enviar HOY (mapa+fecha)=${conEscenarioHoy}`
    );
    if (conEscenarioHoy === 0) {
      console.log(
        '[diag] Si conEscenarioHoy=0, run-once es correcto al no enviar. Usa: npm run test-emails:una-fila (prueba real de Gmail).'
      );
    }
  });
}

async function main() {
  console.log('[diag] ========== DIAGNÓSTICO BOT HOSPITAL SEGURO ==========');
  checkEnv();
  try {
    await initOraclePool();
    await checkGmail();
    await checkOracleYMuestra();
  } catch (err) {
    console.error('[diag] Error:', err.message);
    console.error(err.stack);
  } finally {
    await closeOraclePool();
  }
  console.log('[diag] =====================================================');
}

main();
