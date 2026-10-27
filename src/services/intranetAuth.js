const SQL_VALIDAR_USUARIO = `
SELECT id, usuario
FROM intranet_usuarios
WHERE UPPER(TRIM(usuario)) = UPPER(TRIM(:usuario))
  AND contrasena = :contrasena
FETCH FIRST 1 ROWS ONLY
`;

/**
 * @param {import('oracledb').Connection} connection
 */
async function validarCredencialesIntranet(connection, usuario, contrasena) {
  if (!usuario?.trim() || contrasena == null) {
    return null;
  }

  const result = await connection.execute(SQL_VALIDAR_USUARIO, {
    usuario: usuario.trim(),
    contrasena: String(contrasena),
  });

  const fila = result.rows?.[0];
  if (!fila) return null;

  return {
    id: fila.ID ?? fila.id,
    usuario: fila.USUARIO ?? fila.usuario,
  };
}

module.exports = { validarCredencialesIntranet };
