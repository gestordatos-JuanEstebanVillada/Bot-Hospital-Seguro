const { ESCENARIO, ZONA_HORARIA } = require('../src/utils/fechas');

/** Mediodía en Bogotá para evitar bordes de zona al fijar el reloj del sistema. */
const HOY_SIMULADO = new Date('2025-06-20T12:00:00-05:00');

describe('resolverEscenarioEnvio (America/Bogota)', () => {
  let resolverEscenarioEnvio;

  beforeEach(() => {
    jest.useFakeTimers({ now: HOY_SIMULADO });
    jest.setSystemTime(HOY_SIMULADO);
    jest.resetModules();
    ({ resolverEscenarioEnvio } = require('../src/utils/fechas'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('fecha fija de referencia en zona configurada', () => {
    const { hoyInicioDia } = require('../src/utils/fechas');
    expect(hoyInicioDia().format('YYYY-MM-DD')).toBe('2025-06-20');
    expect(ZONA_HORARIA).toBe('America/Bogota');
  });

  test('exactamente 5 días antes del compromiso → CINCO_DIAS_ANTES', () => {
    const result = resolverEscenarioEnvio('2025-06-25', null);
    expect(result).not.toBeNull();
    expect(result.escenario).toBe(ESCENARIO.CINCO_DIAS_ANTES);
  });

  test('exactamente 1 día antes del compromiso → UN_DIA_ANTES', () => {
    const result = resolverEscenarioEnvio('2025-06-21', null);
    expect(result).not.toBeNull();
    expect(result.escenario).toBe(ESCENARIO.UN_DIA_ANTES);
  });

  test('exactamente 15 días después del vencimiento → QUINCE_DIAS_DESPUES', () => {
    const result = resolverEscenarioEnvio('2025-06-05', null);
    expect(result).not.toBeNull();
    expect(result.escenario).toBe(ESCENARIO.QUINCE_DIAS_DESPUES);
  });

  test('mismo día del compromiso → null', () => {
    expect(resolverEscenarioEnvio('2025-06-20', null)).toBeNull();
  });

  test('2 días antes (no es escenario 1 ni 5) → null', () => {
    expect(resolverEscenarioEnvio('2025-06-22', null)).toBeNull();
  });

  test('14 días después del vencimiento → null', () => {
    expect(resolverEscenarioEnvio('2025-06-06', null)).toBeNull();
  });

  test('16 días después del vencimiento → null', () => {
    expect(resolverEscenarioEnvio('2025-06-04', null)).toBeNull();
  });

  test('6 días antes del compromiso → null', () => {
    expect(resolverEscenarioEnvio('2025-06-26', null)).toBeNull();
  });

  test('fecha inválida → null', () => {
    expect(resolverEscenarioEnvio('no-es-fecha', null)).toBeNull();
    expect(resolverEscenarioEnvio(null, null)).toBeNull();
  });

  test('formato DD/MM/YYYY desde Oracle como texto', () => {
    const result = resolverEscenarioEnvio('21/06/2025', null);
    expect(result?.escenario).toBe(ESCENARIO.UN_DIA_ANTES);
  });

  test('atraso crónico sin historial (2+ meses) → RECORDATORIO_INICIAL_ATRASADO', () => {
    const result = resolverEscenarioEnvio('2025-04-20', null);
    expect(result).not.toBeNull();
    expect(result.escenario).toBe(ESCENARIO.RECORDATORIO_INICIAL_ATRASADO);
    expect(result.mesesAtraso).toBeGreaterThanOrEqual(2);
  });

  test('ultima_fecha_envio hace exactamente 1 mes → RECORDATORIO_MENSUAL_VENCIDO', () => {
    const result = resolverEscenarioEnvio('2025-01-10', '2025-05-20');
    expect(result).not.toBeNull();
    expect(result.escenario).toBe(ESCENARIO.RECORDATORIO_MENSUAL_VENCIDO);
  });

  test('atraso crónico con historial pero sin cumplir mes desde ultimo envío → null', () => {
    expect(resolverEscenarioEnvio('2025-04-20', '2025-06-10')).toBeNull();
  });

  test('mes corto: ultimo envío 31 ene → recordatorio 28/29 feb (año bisiesto)', () => {
    jest.setSystemTime(new Date('2024-02-29T12:00:00-05:00'));
    jest.resetModules();
    ({ resolverEscenarioEnvio } = require('../src/utils/fechas'));
    const result = resolverEscenarioEnvio('2023-10-01', '2024-01-31');
    expect(result?.escenario).toBe(ESCENARIO.RECORDATORIO_MENSUAL_VENCIDO);
  });
});
