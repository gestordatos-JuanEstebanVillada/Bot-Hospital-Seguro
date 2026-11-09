require('dotenv').config();
const cron = require('node-cron');
const { initOraclePool, closeOraclePool } = require('./db/oraclePool');
const { iniciarServidorAdmin } = require('./admin/app');
const { enviarRecordatoriosTareasPlaneadas } = require('./services/enviarRecordatorios');

const CRON_DIARIO_8AM = '0 8 * * *';
const ZONA_HORARIA = 'America/Bogota';

function opcionesDesdeArgv() {
  return {
    forzarEscenario: process.argv.includes('--force'),
  };
}

async function ejecutarJob() {
  const inicio = new Date().toISOString();
  const opts = opcionesDesdeArgv();
  if (opts.forzarEscenario) {
    console.log('[bot] Modo --force: se enviarán correos aunque hoy no cumpla la regla de calendario.');
  }
  console.log(`[bot] Ejecución programada iniciada: ${inicio}`);
  try {
    await enviarRecordatoriosTareasPlaneadas(opts);
  } catch (err) {
    console.error('[bot] La ejecución terminó con errores:', err?.message || err);
    if (err?.stack) console.error(err.stack);
  }
}

process.on('unhandledRejection', (reason) => {
  console.error('[app] unhandledRejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[app] uncaughtException:', err);
});

function iniciarProgramacion() {
  if (!cron.validate(CRON_DIARIO_8AM)) {
    throw new Error(`Expresión cron inválida: ${CRON_DIARIO_8AM}`);
  }

  cron.schedule(CRON_DIARIO_8AM, ejecutarJob, { timezone: ZONA_HORARIA });

  console.log(
    `[bot] Programado todos los días a las 8:00 AM (${ZONA_HORARIA}). Esperando próxima ejecución...`
  );
}

async function apagadoLimpio() {
  console.log('[app] Cerrando pool Oracle...');
  await closeOraclePool();
  process.exit(0);
}

async function main() {
  const ejecutarUnaVez = process.argv.includes('--once');
  const ejecutarAlInicio = process.argv.includes('--run-on-start');
  const sinCron = process.argv.includes('--no-cron');
  const sinAdmin = process.argv.includes('--no-admin');

  await initOraclePool();

  if (ejecutarUnaVez) {
    await ejecutarJob();
    await closeOraclePool();
    process.exit(0);
  }

  if (ejecutarAlInicio) {
    console.log('[bot] --run-on-start: ejecutando ronda de envíos al arrancar...');
    await ejecutarJob();
  }

  if (!sinCron) {
    iniciarProgramacion();
  }

  if (!sinAdmin) {
    iniciarServidorAdmin();
  }

  process.on('SIGINT', apagadoLimpio);
  process.on('SIGTERM', apagadoLimpio);
}

main().catch(async (err) => {
  console.error('[app] Error fatal al iniciar:', err);
  await closeOraclePool();
  process.exit(1);
});
