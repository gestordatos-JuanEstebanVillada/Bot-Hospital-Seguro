const express = require('express');
const session = require('express-session');
const { withConnection } = require('../db/oraclePool');
const { validarCredencialesIntranet } = require('../services/intranetAuth');
const { listarHistorialEnvios } = require('../services/historialCorreos');
const { requireAuth } = require('./middleware/requireAuth');
const { renderLoginPage } = require('./views/loginPage');
const { renderDashboardPage } = require('./views/dashboardPage');

function crearAppAdmin() {
  const app = express();

  app.use(express.urlencoded({ extended: false }));

  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    throw new Error('Falta SESSION_SECRET en .env para el panel de administración.');
  }

  app.use(
    session({
      name: 'botHospitalSeguro.sid',
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 8 * 60 * 60 * 1000,
        sameSite: 'lax',
      },
    })
  );

  app.get('/', (_req, res) => {
    res.redirect('/admin/dashboard');
  });

  app.get('/admin/login', (req, res) => {
    if (req.session?.usuarioIntranet) {
      return res.redirect('/admin/dashboard');
    }
    res.type('html').send(renderLoginPage());
  });

  app.post('/admin/login', async (req, res) => {
    const { usuario, contrasena } = req.body;

    try {
      const usuarioValidado = await withConnection((connection) =>
        validarCredencialesIntranet(connection, usuario, contrasena)
      );

      if (!usuarioValidado) {
        return res.status(401).type('html').send(renderLoginPage({ error: 'Usuario o contraseña incorrectos.' }));
      }

      req.session.usuarioIntranet = {
        id: usuarioValidado.id,
        usuario: usuarioValidado.usuario,
      };

      return res.redirect('/admin/dashboard');
    } catch (err) {
      console.error('[admin] Error en login:', err.message);
      return res.status(500).type('html').send(renderLoginPage({ error: 'Error al validar credenciales.' }));
    }
  });

  app.post('/admin/logout', requireAuth, (req, res) => {
    req.session.destroy(() => {
      res.redirect('/admin/login');
    });
  });

  app.get('/admin/dashboard', requireAuth, async (req, res) => {
    try {
      const filas = await withConnection((connection) => listarHistorialEnvios(connection));
      res
        .type('html')
        .send(
          renderDashboardPage({
            usuario: req.session.usuarioIntranet.usuario,
            filas,
          })
        );
    } catch (err) {
      console.error('[admin] Error cargando dashboard:', err.message);
      res.status(500).send('No se pudo cargar el historial. Verifique que exista la tabla HS-historial_correos_bot.');
    }
  });

  return app;
}

function iniciarServidorAdmin() {
  const app = crearAppAdmin();
  const port = Number(process.env.ADMIN_PORT || 2134);

  app.listen(port, () => {
    console.log(`[admin] Panel web en http://localhost:${port}/admin/login`);
  });

  return app;
}

module.exports = { crearAppAdmin, iniciarServidorAdmin };
