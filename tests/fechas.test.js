const { ESCENARIO, ZONA_HORARIA } = require('../src/utils/fechas');

const HOY_SIMULADO = new Date('2025-06-20T12:00:00-05:00');

describe('resolverEscenarioEnvio — solo 5d, 1d, hoy (America/Bogota)', () => {
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

  test('referencia de hoy simulado', () => {
    const { hoyInicioDia } = require('../src/utils/fechas');
    expect(hoyInicioDia().format('YYYY-MM-DD')).toBe('2025-06-20');
    expect(ZONA_HORARIA).toBe('America/Bogota');
  });

  test('diffDias === 5 → CINCO_DIAS_ANTES', () => {
    const result = resolverEscenarioEnvio('2025-06-25');
    expect(result?.escenario).toBe(ESCENARIO.CINCO_DIAS_ANTES);
    expect(result?.diffDias).toBe(5);
  });

  test('diffDias === 1 → UN_DIA_ANTES', () => {
    const result = resolverEscenarioEnvio('2025-06-21');
    expect(result?.escenario).toBe(ESCENARIO.UN_DIA_ANTES);
    expect(result?.diffDias).toBe(1);
  });

  test('diffDias === 0 → VENCE_HOY', () => {
    const result = resolverEscenarioEnvio('2025-06-20');
    expect(result?.escenario).toBe(ESCENARIO.VENCE_HOY);
    expect(result?.diffDias).toBe(0);
  });

  test('diffDias === 6 → null', () => {
    expect(resolverEscenarioEnvio('2025-06-26')).toBeNull();
  });

  test('diffDias === 3 → null', () => {
    expect(resolverEscenarioEnvio('2025-06-23')).toBeNull();
  });

  test('diffDias === -1 (venció ayer) → null', () => {
    expect(resolverEscenarioEnvio('2025-06-19')).toBeNull();
  });

  test('venció hace un mes → null', () => {
    expect(resolverEscenarioEnvio('2025-05-20')).toBeNull();
  });

  test('formato DD/MM/YYYY', () => {
    const result = resolverEscenarioEnvio('21/06/2025');
    expect(result?.escenario).toBe(ESCENARIO.UN_DIA_ANTES);
  });
});