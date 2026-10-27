const oracledb = require('oracledb');
const { getOracleConfig } = require('../config/oracle');

/** @type {oracledb.Pool | null} */
let pool = null;

async function initOraclePool() {
  if (pool) return pool;

  oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

  pool = await oracledb.createPool({
    ...getOracleConfig(),
    poolMin: 1,
    poolMax: 10,
    poolIncrement: 1,
    poolTimeout: 60,
  });

  console.log('[oracle] Pool de conexiones inicializado.');
  return pool;
}

function getPool() {
  if (!pool) {
    throw new Error('Oracle pool no inicializado. Llama initOraclePool() al arrancar la app.');
  }
  return pool;
}

/**
 * Ejecuta fn(connection) y devuelve la conexión al pool en finally.
 * @template T
 * @param {(connection: oracledb.Connection) => Promise<T>} fn
 * @returns {Promise<T>}
 */
async function withConnection(fn) {
  const connection = await getPool().getConnection();
  try {
    return await fn(connection);
  } finally {
    await connection.close();
  }
}

async function closeOraclePool() {
  if (pool) {
    await pool.close(0);
    pool = null;
    console.log('[oracle] Pool cerrado.');
  }
}

module.exports = {
  initOraclePool,
  getPool,
  withConnection,
  closeOraclePool,
};
