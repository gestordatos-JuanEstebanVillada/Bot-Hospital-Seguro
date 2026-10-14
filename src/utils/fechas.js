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

function hoyInicioDia() {
  return dayjs().tz(ZONA_HORARIA).startOf('day');
}

/**
 * Normaliza fecha_compromiso de Oracle a inicio de día en America/Bogota.
 */
function parseFechaCompromiso(valor) {
  if (valor == null || valor === '') return null;

  if (valor instanceof Date) {
    if (Number.isNaN(valor.getTime())) return null;
    const y = valor.getFullYear();
    const m = valor.getMonth();
    const d = valor.getDate();
    return dayjs.tz({ year: y, month: m, date: d }, ZONA_HORARIA).startOf('day');
  }

  const texto = String(valor).trim();
  const soloFecha = texto.split(/[T\s]/)[0];

  let parsed = dayjs.tz(soloFecha, 'YYYY-MM-DD', ZONA_HORARIA);
  if (!parsed.isValid()) {
    parsed = dayjs.tz(soloFecha, 'DD/MM/YYYY', ZONA_HORARIA);
  }
  if (!parsed.isValid()) return null;
  return parsed.startOf('day');
}

const ESCENARIO = {
  CINCO_DIAS_ANTES: 'CINCO_DIAS_ANTES',
  UN_DIA_ANTES: 'UN_DIA_ANTES',
  QUINCE_DIAS_DESPUES: 'QUINCE_DIAS_DESPUES',
};

/**
 * Días desde hoy hasta compromiso (positivo = compromiso en el futuro).
 */
function diasHastaCompromiso(fechaCompromisoNormalizada) {
  return fechaCompromisoNormalizada.diff(hoyInicioDia(), 'day');
}

/**
 * Días transcurridos desde compromiso hasta hoy (positivo = ya venció).
 */
function diasDesdeCompromiso(fechaCompromisoNormalizada) {
  return hoyInicioDia().diff(fechaCompromisoNormalizada, 'day');
}

function resolverEscenarioEnvio(fechaCompromisoRaw) {
  const compromiso = parseFechaCompromiso(fechaCompromisoRaw);
  if (!compromiso) return null;

  const hasta = diasHastaCompromiso(compromiso);
  if (hasta === 5) return { escenario: ESCENARIO.CINCO_DIAS_ANTES, compromiso };
  if (hasta === 1) return { escenario: ESCENARIO.UN_DIA_ANTES, compromiso };

  const desde = diasDesdeCompromiso(compromiso);
  if (desde === 15) return { escenario: ESCENARIO.QUINCE_DIAS_DESPUES, compromiso };

  return null;
}

function formatearFechaCompromiso(fechaCompromisoNormalizada) {
  return fechaCompromisoNormalizada.locale('es').format('D [de] MMMM [de] YYYY');
}

module.exports = {
  ZONA_HORARIA,
  ESCENARIO,
  hoyInicioDia,
  parseFechaCompromiso,
  resolverEscenarioEnvio,
  formatearFechaCompromiso,
};
