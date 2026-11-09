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
 * Oracle DATE → medianoche America/Bogota (evita desfase UTC en objetos Date).
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
  QUINCE_DIAS_DESPUES: 'QUINCE_DIAS_DESPUES',
  RECORDATORIO_INICIAL_ATRASADO: 'RECORDATORIO_INICIAL_ATRASADO',
  RECORDATORIO_MENSUAL_VENCIDO: 'RECORDATORIO_MENSUAL_VENCIDO',
};

/**
 * Días enteros: compromiso − hoy (positivo = futuro, 0 = hoy, negativo = vencida).
 * Ambas fechas en medianoche Bogotá; Math.round sobre milisegundos.
 */
function diffDiasEnteros(fechaCompromisoNormalizada) {
  const hoy = hoyInicioDia().startOf('day');
  const compromiso = fechaCompromisoNormalizada.startOf('day');
  const diffMs = compromiso.valueOf() - hoy.valueOf();
  return Math.round(diffMs / MS_POR_DIA);
}

function tareaAtrasadaCronicamente(fechaCompromisoNormalizada) {
  const hoy = hoyInicioDia();
  if (!fechaCompromisoNormalizada.isBefore(hoy, 'day')) {
    return false;
  }
  const unMesDespuesDelVencimiento = fechaCompromisoNormalizada.add(1, 'month');
  return !hoy.isBefore(unMesDespuesDelVencimiento, 'day');
}

function esDiaRecordatorioMensualDesdeUltimoEnvio(ultimaFechaEnvioNormalizada) {
  const hoy = hoyInicioDia();
  const proximoRecordatorio = ultimaFechaEnvioNormalizada.add(1, 'month');
  return hoy.isSame(proximoRecordatorio, 'day');
}

function mesesAtrasoDesdeCompromiso(fechaCompromisoNormalizada) {
  return Math.max(1, hoyInicioDia().diff(fechaCompromisoNormalizada, 'month'));
}

function resolverEscenarioPorDiff(diffDias, compromiso, ultimaEnvio) {
  if (diffDias === 5) return { escenario: ESCENARIO.CINCO_DIAS_ANTES, compromiso, diffDias };
  if (diffDias === 1) return { escenario: ESCENARIO.UN_DIA_ANTES, compromiso, diffDias };
  if (diffDias === 0) return { escenario: ESCENARIO.VENCE_HOY, compromiso, diffDias };

  if (diffDias < 0 && tareaAtrasadaCronicamente(compromiso)) {
    if (!ultimaEnvio) {
      return {
        escenario: ESCENARIO.RECORDATORIO_INICIAL_ATRASADO,
        compromiso,
        diffDias,
        mesesAtraso: mesesAtrasoDesdeCompromiso(compromiso),
      };
    }
    if (esDiaRecordatorioMensualDesdeUltimoEnvio(ultimaEnvio)) {
      return {
        escenario: ESCENARIO.RECORDATORIO_MENSUAL_VENCIDO,
        compromiso,
        diffDias,
        ultimaFechaEnvio: ultimaEnvio,
      };
    }
    return null;
  }

  if (diffDias === -15) {
    return { escenario: ESCENARIO.QUINCE_DIAS_DESPUES, compromiso, diffDias };
  }

  return null;
}

function resolverEscenarioEnvio(fechaCompromisoRaw, ultimaFechaEnvioRaw = null) {
  const compromiso = parseFechaCompromiso(fechaCompromisoRaw);
  if (!compromiso) return null;

  const ultimaEnvio = ultimaFechaEnvioRaw != null ? parseFechaCompromiso(ultimaFechaEnvioRaw) : null;
  const diffDias = diffDiasEnteros(compromiso);
  return resolverEscenarioPorDiff(diffDias, compromiso, ultimaEnvio);
}

/**
 * Modo --force: elige plantilla según diffDías aunque no sea día de regla.
 */
function resolverEscenarioForzado(fechaCompromisoRaw, ultimaFechaEnvioRaw = null) {
  const resolucion = resolverEscenarioEnvio(fechaCompromisoRaw, ultimaFechaEnvioRaw);
  if (resolucion) return resolucion;

  const compromiso = parseFechaCompromiso(fechaCompromisoRaw);
  if (!compromiso) return null;

  const diffDias = diffDiasEnteros(compromiso);
  if (diffDias === 0) return { escenario: ESCENARIO.VENCE_HOY, compromiso, diffDias };
  if (diffDias === 1) return { escenario: ESCENARIO.UN_DIA_ANTES, compromiso, diffDias };
  if (diffDias === 5) return { escenario: ESCENARIO.CINCO_DIAS_ANTES, compromiso, diffDias };
  if (diffDias === -15) return { escenario: ESCENARIO.QUINCE_DIAS_DESPUES, compromiso, diffDias };
  if (diffDias < 0) {
    return {
      escenario: ESCENARIO.RECORDATORIO_INICIAL_ATRASADO,
      compromiso,
      diffDias,
      mesesAtraso: mesesAtrasoDesdeCompromiso(compromiso),
    };
  }
  return { escenario: ESCENARIO.CINCO_DIAS_ANTES, compromiso, diffDias };
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
  resolverEscenarioPorDiff,
  tareaAtrasadaCronicamente,
  esDiaRecordatorioMensualDesdeUltimoEnvio,
  formatearFechaCompromiso,
};
