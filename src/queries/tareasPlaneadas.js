const SQL_TAREAS_PLANEADAS = `
SELECT
    pac.pachis AS historia,
    pac.pacide AS identificacion,
    pac.pacnom || ' ' || NVL(pac.pacno2, '') || ' ' || pac.pacap1 || ' ' || NVL(pac.pacap2, '') AS paciente,
    obs.eveplasec AS num_evento,
    obs.eveplaite AS item,
    obs.eveplades AS tarea,
    obs.eveplafec AS fecha_compromiso,
    obs.eveplaest AS estado,
    obs.eveplares AS usuario,
    hist.ultima_fecha_envio
FROM hsregeve reg
JOIN hiepiina epi ON reg.regeveepi = epi.epiinaepi
JOIN abpac pac ON epi.epiinahis = pac.pachis
JOIN hsevepla obs ON reg.regevesec = obs.eveplasec
JOIN siide usu ON reg.regeveusu = usu.idecod
LEFT JOIN (
    SELECT
        num_evento,
        item,
        MAX(fecha_envio) AS ultima_fecha_envio
    FROM "HS-historial_correos_bot"
    GROUP BY num_evento, item
) hist
    ON hist.num_evento = TO_CHAR(obs.eveplasec)
   AND NVL(hist.item, '#') = NVL(TO_CHAR(obs.eveplaite), '#')
WHERE reg.regeveest = 'A'
  AND obs.eveplaest = 'PL'
`;

module.exports = { SQL_TAREAS_PLANEADAS };
