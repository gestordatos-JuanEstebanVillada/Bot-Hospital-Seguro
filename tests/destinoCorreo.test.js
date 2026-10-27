const {
  obtenerDestinoModoPrueba,
  resolverDestino,
  MENSAJE_CORREO_PRUEBA_OBLIGATORIO,
} = require('../src/utils/destinoCorreo');

describe('destinoCorreo — bloqueo en modo prueba', () => {
  const original = process.env.CORREO_PRUEBA;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.CORREO_PRUEBA;
    } else {
      process.env.CORREO_PRUEBA = original;
    }
  });

  test('modo prueba sin CORREO_PRUEBA lanza error (no envía a jefes por mapa)', () => {
    delete process.env.CORREO_PRUEBA;
    expect(() => obtenerDestinoModoPrueba()).toThrow(MENSAJE_CORREO_PRUEBA_OBLIGATORIO);
  });

  test('modo prueba ignora correosUsuarios y usa solo CORREO_PRUEBA', () => {
    process.env.CORREO_PRUEBA = 'gestor.datos@laliga.org.co';
    const destino = resolverDestino({
      modoPrueba: true,
      destinoMapeado: 'jefe@empresa.com',
    });
    expect(destino).toBe('gestor.datos@laliga.org.co');
  });

  test('producción usa destino mapeado', () => {
    process.env.CORREO_PRUEBA = 'gestor.datos@laliga.org.co';
    const destino = resolverDestino({
      modoPrueba: false,
      destinoMapeado: 'usuario.real@laliga.org.co',
    });
    expect(destino).toBe('usuario.real@laliga.org.co');
  });
});
