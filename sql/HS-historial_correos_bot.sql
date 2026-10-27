-- Tabla de historial de envíos del bot hospital-seguro
-- Ejecutar con el usuario Oracle que usa el bot (ej. BDLIGA)
-- El guion en el nombre requiere comillas dobles en Oracle.

CREATE TABLE "HS-historial_correos_bot" (
    id            NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    num_evento    VARCHAR2(50),
    item          VARCHAR2(50),
    paciente      VARCHAR2(500),
    destinatario  VARCHAR2(320) NOT NULL,
    fecha_envio   TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
    escenario     VARCHAR2(50) NOT NULL,
    message_id    VARCHAR2(255),
    modo_prueba   CHAR(1) DEFAULT 'N' NOT NULL
        CHECK (modo_prueba IN ('S', 'N'))
);

CREATE INDEX idx_hs_hist_correos_fecha ON "HS-historial_correos_bot" (fecha_envio DESC);
CREATE INDEX idx_hs_hist_evento_item ON "HS-historial_correos_bot" (num_evento, item);

COMMENT ON TABLE "HS-historial_correos_bot" IS 'Registro de correos enviados por bot-hospital-seguro';

-- Si la tabla ya existía sin columna item:
-- ALTER TABLE "HS-historial_correos_bot" ADD item VARCHAR2(50);
-- CREATE INDEX idx_hs_hist_evento_item ON "HS-historial_correos_bot" (num_evento, item);
