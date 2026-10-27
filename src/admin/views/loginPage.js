const { escaparHtml } = require('../utils/html');
const { COLOR_ROSADO_LIGA } = require('../../config/brand');

function renderLoginPage({ error } = {}) {
  const mensajeError = error
    ? `<p class="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">${escaparHtml(error)}</p>`
    : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin — Bot Hospital Seguro</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-rose-50/40 flex items-center justify-center p-4">
  <div class="w-full max-w-md rounded-xl bg-white shadow-lg border-t-4 overflow-hidden" style="border-color:${COLOR_ROSADO_LIGA}">
    <div class="px-8 py-6 text-white" style="background-color:${COLOR_ROSADO_LIGA}">
      <h1 class="text-xl font-semibold">Panel de administración</h1>
      <p class="text-sm opacity-90 mt-1">Bot Hospital Seguro — historial de correos</p>
    </div>
    <form method="POST" action="/admin/login" class="px-8 py-8">
      ${mensajeError}
      <label class="block text-sm font-medium text-gray-700 mb-1" for="usuario">Usuario</label>
      <input id="usuario" name="usuario" type="text" required autocomplete="username"
        class="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-500" />

      <label class="block text-sm font-medium text-gray-700 mb-1" for="contrasena">Contraseña</label>
      <input id="contrasena" name="contrasena" type="password" required autocomplete="current-password"
        class="mb-6 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-500" />

      <button type="submit"
        class="w-full rounded-lg py-2.5 text-white font-medium hover:opacity-95 transition"
        style="background-color:${COLOR_ROSADO_LIGA}">
        Ingresar
      </button>
    </form>
  </div>
</body>
</html>`;
}

module.exports = { renderLoginPage };
