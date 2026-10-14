require('dotenv').config();
const cron = require('node-cron');
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

const ejecutarUnaVez = process.argv.includes('--once');

if (ejecutarUnaVez) {
  ejecutarJob().then(() => process.exit(0));
} else {
  iniciarProgramacion();
}
