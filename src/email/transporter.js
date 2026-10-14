require('dotenv').config();
const nodemailer = require('nodemailer');
const { google } = require('googleapis');

function getGmailEnv() {
  const { GMAIL_USER, GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN } = process.env;

  if (!GMAIL_USER || !GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN) {
    throw new Error(
      'Faltan variables de entorno Gmail (GMAIL_USER, GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN)'
    );
  }

  return {
    user: GMAIL_USER,
    clientId: GMAIL_CLIENT_ID,
    clientSecret: GMAIL_CLIENT_SECRET,
    refreshToken: GMAIL_REFRESH_TOKEN,
  };
}

function createOAuth2Client() {
  const { clientId, clientSecret, refreshToken } = getGmailEnv();
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return oauth2Client;
}

async function obtenerAccessToken() {
  const oauth2Client = createOAuth2Client();
  const { token } = await oauth2Client.getAccessToken();
  if (!token) {
    throw new Error('No se pudo obtener accessToken desde GMAIL_REFRESH_TOKEN');
  }
  return token;
}

async function crearTransporter() {
  const gmail = getGmailEnv();
  const accessToken = await obtenerAccessToken();

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: gmail.user,
      clientId: gmail.clientId,
      clientSecret: gmail.clientSecret,
      refreshToken: gmail.refreshToken,
      accessToken,
    },
  });
}

module.exports = { crearTransporter, obtenerAccessToken };
