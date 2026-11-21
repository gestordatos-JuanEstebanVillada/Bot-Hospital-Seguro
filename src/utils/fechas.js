const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const customParseFormat = require('dayjs/plugin/customParseFormat');
require('dayjs/locale/es');

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.locale('es');

const ZONA_HORARIA = 'America/Bogota';
const MS_POR_DIA = 24 * 60 * 60 * 1000;

function hoyInicioDia() {
  return dayjs().tz(ZONA_HORARIA).startOf('day');
}

/**
 * obs.eveplafec (fecha_compromiso) → medianoche America/Bogota.
 */
function parseFechaCompromiso(valor) {
  if (valor == null || valor === '') return null;

  if (valor instanceof Date) {
    if (Number.isNaN(valor.getTime())) return null;
    const fechaCalendario = dayjs(valor).tz(ZONA_HORARIA).format('YYYY-MM-DD');
    const parsed = dayjs.tz(fechaCalendario, 'YYYY-MM-DD', ZONA_HORARIA);
    return parsed.isValid() ? parsed.startOf('day') : null;
  }

  const texto = String(valor).trim();
  const soloFecha = texto.split(/[T\s]/)[0];

  let parsed = dayjs.tz(soloFecha, 'YYYY-MM-DD', ZONA_HORARIA);
  if (!parsed.isValid()) {
    parsed = dayjs.tz(soloFecha, 'DD/MM/YYYY', ZONA_HORARIA);
  }
  if (!parsed.isValid()) {
    parsed = dayjs.tz(texto, ZONA_HORARIA);
  }
  if (!parsed.isValid()) return null;
  return parsed.startOf('day');
}

const ESCENARIO = {
  CINCO_DIAS_ANTES: 'CINCO_DIAS_ANTES',
  UN_DIA_ANTES: 'UN_DIA_ANTES',
  VENCE_HOY: 'VENCE_HOY',
};

/**
 * Días enteros hasta el compromiso (compromiso − hoy).
 * Positivo = futuro, 0 = hoy, negativo = ya venció.
 */
function diffDiasEnteros(fechaCompromisoNormalizada) {
  const hoy = hoyInicioDia().startOf('day');
  const compromiso = fechaCompromisoNormalizada.startOf('day');
  const diffMs = compromiso.valueOf() - hoy.valueOf();
  return Math.round(diffMs / MS_POR_DIA);
}

function escenarioDesdeDiffDias(diffDias, compromiso) {
  if (diffDias === 5) {
    return { escenario: ESCENARIO.CINCO_DIAS_ANTES, compromiso, diffDias };
  }
  if (diffDias === 1) {
    return { escenario: ESCENARIO.UN_DIA_ANTES, compromiso, diffDias };
  }
  if (diffDias === 0) {
    return { escenario: ESCENARIO.VENCE_HOY, compromiso, diffDias };
  }
  return null;
}

/**
 * Únicas reglas: 5 días antes, 1 día antes (mañana), vence hoy.
 * Tareas ya vencidas (diff < 0) o cualquier otro día → null.
 */
function resolverEscenarioEnvio(fechaCompromisoRaw) {
  const compromiso = parseFechaCompromiso(fechaCompromisoRaw);
  if (!compromiso) return null;

  const diffDias = diffDiasEnteros(compromiso);
  return escenarioDesdeDiffDias(diffDias, compromiso);
}

/**
 * Modo --force (pruebas): solo plantillas vigentes según diff; vencidas → null.
 */
function resolverEscenarioForzado(fechaCompromisoRaw) {
  return resolverEscenarioEnvio(fechaCompromisoRaw);
}

function formatearFechaCompromiso(fechaCompromisoNormalizada) {
  return fechaCompromisoNormalizada.locale('es').format('D [de] MMMM [de] YYYY');
}

module.exports = {
  ZONA_HORARIA,
  ESCENARIO,
  hoyInicioDia,
  parseFechaCompromiso,
  diffDiasEnteros,
  resolverEscenarioEnvio,
  resolverEscenarioForzado,
  formatearFechaCompromiso,
};