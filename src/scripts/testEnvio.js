require('dotenv').config();
const { initOraclePool, closeOraclePool } = require('../db/oraclePool');
const {
  obtenerDestinoModoPrueba,
  MENSAJE_CORREO_PRUEBA_OBLIGATORIO,
} = require('../utils/destinoCorreo');
const { enviarRecordatoriosTareasPlaneadas } = require('../services/enviarRecordatorios');

const soloPrimeraFila = process.argv.includes('--una-fila');

async function main() {
  try {
    const destinoSeguro = obtenerDestinoModoPrueba();
    console.log('[bot] ========== MODO PRUEBA DE ENVÍO (SEGURO) ==========');
    console.log('[bot] Reglas de fecha: DESACTIVADAS (3 plantillas por fila).');
    console.log(`[bot] Destino OBLIGATORIO (CORREO_PRUEBA): ${destinoSeguro}`);
    console.log('[bot] correosUsuarios: IGNORADO para el campo "to".');
    if (soloPrimeraFila) {
      console.log('[bot] Opción --una-fila: solo la primera fila de la consulta.');
    }
    console.log('[bot] ===================================================');

    await initOraclePool();
    await enviarRecordatoriosTareasPlaneadas({ modoPrueba: true, soloPrimeraFila });
    await closeOraclePool();
    process.exit(0);
  } catch (error) {
    console.error('[bot]', error.message || MENSAJE_CORREO_PRUEBA_OBLIGATORIO);
    await closeOraclePool();
    process.exit(1);
  }
}

main();
