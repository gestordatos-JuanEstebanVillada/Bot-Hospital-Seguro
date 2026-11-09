const { ESCENARIO, ZONA_HORARIA } = require('../src/utils/fechas');

/** Mediodía en Bogotá para evitar bordes de zona al fijar el reloj del sistema. */
const HOY_SIMULADO = new Date('2025-06-20T12:00:00-05:00');

describe('resolverEscenarioEnvio (America/Bogota)', () => {
  let resolverEscenarioEnvio;
  let diffDiasEnteros;
  let parseFechaCompromiso;

  beforeEach(() => {
    jest.useFakeTimers({ now: HOY_SIMULADO });
    jest.setSystemTime(HOY_SIMULADO);
    jest.resetModules();
    ({
      resolverEscenarioEnvio,
      diffDiasEnteros,
      parseFechaCompromiso,
    } = require('../src/utils/fechas'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('fecha fija de referencia en zona configurada', () => {
    const { hoyInicioDia } = require('../src/utils/fechas');
    expect(hoyInicioDia().format('YYYY-MM-DD')).toBe('2025-06-20');
    expect(ZONA_HORARIA).toBe('America/Bogota');
  });

  test('Oracle Date UTC se normaliza a calendario Bogotá', () => {
    const oracleDate = new Date('2025-06-21T05:00:00.000Z');
    const compromiso = parseFechaCompromiso(oracleDate);
    expect(diffDiasEnteros(compromiso)).toBe(1);
  });

  test('diffDias === 5 → CINCO_DIAS_ANTES', () => {
    const result = resolverEscenarioEnvio('2025-06-25', null);
    expect(result?.escenario).toBe(ESCENARIO.CINCO_DIAS_ANTES);
    expect(result?.diffDias).toBe(5);
  });

  test('diffDias === 1 → UN_DIA_ANTES', () => {
    const result = resolverEscenarioEnvio('2025-06-21', null);
    expect(result?.escenario).toBe(ESCENARIO.UN_DIA_ANTES);
    expect(result?.diffDias).toBe(1);
  });

  test('diffDias === 0 → VENCE_HOY', () => {
    const result = resolverEscenarioEnvio('2025-06-20', null);
    expect(result?.escenario).toBe(ESCENARIO.VENCE_HOY);
    expect(result?.diffDias).toBe(0);
  });

  test('diffDias === -15 → QUINCE_DIAS_DESPUES', () => {
    const result = resolverEscenarioEnvio('2025-06-05', null);
    expect(result?.escenario).toBe(ESCENARIO.QUINCE_DIAS_DESPUES);
    expect(result?.diffDias).toBe(-15);
  });

  test('diffDias === 2 → null', () => {
    expect(resolverEscenarioEnvio('2025-06-22', null)).toBeNull();
  });

  test('atraso crónico sin historial → RECORDATORIO_INICIAL_ATRASADO', () => {
    const result = resolverEscenarioEnvio('2025-04-20', null);
    expect(result?.escenario).toBe(ESCENARIO.RECORDATORIO_INICIAL_ATRASADO);
  });

  test('ultima_fecha_envio hace exactamente 1 mes → RECORDATORIO_MENSUAL_VENCIDO', () => {
    const result = resolverEscenarioEnvio('2025-01-10', '2025-05-20');
    expect(result?.escenario).toBe(ESCENARIO.RECORDATORIO_MENSUAL_VENCIDO);
  });

  test('formato DD/MM/YYYY desde Oracle como texto', () => {
    const result = resolverEscenarioEnvio('21/06/2025', null);
    expect(result?.escenario).toBe(ESCENARIO.UN_DIA_ANTES);
  });
});
