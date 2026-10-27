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
 * Normaliza fechas de Oracle (DATE/TIMESTAMP/string) a inicio de día en America/Bogota.
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
  if (!parsed.isValid()) {
    parsed = dayjs.tz(texto, ZONA_HORARIA);
  }
  if (!parsed.isValid()) return null;
  return parsed.startOf('day');
}

const ESCENARIO = {
  CINCO_DIAS_ANTES: 'CINCO_DIAS_ANTES',
  UN_DIA_ANTES: 'UN_DIA_ANTES',
  QUINCE_DIAS_DESPUES: 'QUINCE_DIAS_DESPUES',
  RECORDATORIO_INICIAL_ATRASADO: 'RECORDATORIO_INICIAL_ATRASADO',
  RECORDATORIO_MENSUAL_VENCIDO: 'RECORDATORIO_MENSUAL_VENCIDO',
};

function diasHastaCompromiso(fechaCompromisoNormalizada) {
  return fechaCompromisoNormalizada.diff(hoyInicioDia(), 'day');
}

function diasDesdeCompromiso(fechaCompromisoNormalizada) {
  return hoyInicioDia().diff(fechaCompromisoNormalizada, 'day');
}

/**
 * Tarea con al menos 1 mes calendario de vencida (atraso crónico).
 */
function tareaAtrasadaCronicamente(fechaCompromisoNormalizada) {
  const hoy = hoyInicioDia();
  if (!fechaCompromisoNormalizada.isBefore(hoy, 'day')) {
    return false;
  }
  const unMesDespuesDelVencimiento = fechaCompromisoNormalizada.add(1, 'month');
  return !hoy.isBefore(unMesDespuesDelVencimiento, 'day');
}

/**
 * Hoy coincide con ultima_fecha_envio + 1 mes (dayjs ajusta meses de 28–31 días).
 */
function esDiaRecordatorioMensualDesdeUltimoEnvio(ultimaFechaEnvioNormalizada) {
  const hoy = hoyInicioDia();
  const proximoRecordatorio = ultimaFechaEnvioNormalizada.add(1, 'month');
  return hoy.isSame(proximoRecordatorio, 'day');
}

function mesesAtrasoDesdeCompromiso(fechaCompromisoNormalizada) {
  return Math.max(1, hoyInicioDia().diff(fechaCompromisoNormalizada, 'month'));
}

function resolverEscenarioEnvio(fechaCompromisoRaw, ultimaFechaEnvioRaw = null) {
  const compromiso = parseFechaCompromiso(fechaCompromisoRaw);
  if (!compromiso) return null;

  const ultimaEnvio = parseFechaCompromiso(ultimaFechaEnvioRaw);
  const atrasoCronico = tareaAtrasadaCronicamente(compromiso);

  if (atrasoCronico) {
    if (!ultimaEnvio) {
      return {
        escenario: ESCENARIO.RECORDATORIO_INICIAL_ATRASADO,
        compromiso,
        mesesAtraso: mesesAtrasoDesdeCompromiso(compromiso),
      };
    }

    if (esDiaRecordatorioMensualDesdeUltimoEnvio(ultimaEnvio)) {
      return {
        escenario: ESCENARIO.RECORDATORIO_MENSUAL_VENCIDO,
        compromiso,
        ultimaFechaEnvio: ultimaEnvio,
      };
    }

    return null;
  }

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
  tareaAtrasadaCronicamente,
  esDiaRecordatorioMensualDesdeUltimoEnvio,
  resolverEscenarioEnvio,
  formatearFechaCompromiso,
};
