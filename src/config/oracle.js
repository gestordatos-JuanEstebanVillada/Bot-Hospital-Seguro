require('dotenv').config();

function getOracleConfig() {
  const { SCSE_DB_USER, SCSE_DB_PASSWD, SCSE_DB_IP, SCSE_DB_PORT, SCSE_DB_DATABASE } =
    process.env;

  if (!SCSE_DB_USER || !SCSE_DB_PASSWD || !SCSE_DB_IP || !SCSE_DB_PORT || !SCSE_DB_DATABASE) {
    throw new Error(
      'Faltan variables de entorno Oracle (SCSE_DB_USER, SCSE_DB_PASSWD, SCSE_DB_IP, SCSE_DB_PORT, SCSE_DB_DATABASE)'
    );
  }

  return {
    user: SCSE_DB_USER,
    password: SCSE_DB_PASSWD,
    connectString: `${SCSE_DB_IP}:${SCSE_DB_PORT}/${SCSE_DB_DATABASE}`,
  };
}

module.exports = { getOracleConfig };
