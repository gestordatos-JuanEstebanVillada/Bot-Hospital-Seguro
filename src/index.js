require('dotenv').config();
const cron = require('node-cron');
const { initOraclePool, closeOraclePool } = require('./db/oraclePool');
const { iniciarServidorAdmin } = require('./admin/app');
const { enviarRecordatoriosTareasPlaneadas } = require('./services/enviarRecordatorios');

const CRON_DIARIO_8AM = '0 8 * * *';
const ZONA_HORARIA = 'America/Bogota';

async function ejecutarJob() {
  const inicio = new Date().toISOString();
  console.log(`[bot] Ejecución programada iniciada: ${inicio}`);
  try {
    await enviarRecordatoriosTareasPlaneadas();
  } catch {
    console.error('[bot] La ejecución terminó con errores. Revisa los logs anteriores.');
  }
}

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
  const sinCron = process.argv.includes('--no-cron');
  const sinAdmin = process.argv.includes('--no-admin');

  await initOraclePool();

  if (ejecutarUnaVez) {
    await ejecutarJob();
    await closeOraclePool();
    process.exit(0);
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
