# Bot hospital-seguro — Oracle oracledb Thin + cron + Express admin
FROM node:20-slim

# Zona horaria Colombia (cron 8:00 AM y fechas dayjs alineadas al SO)
ENV TZ=America/Bogota
ENV NODE_ENV=production

RUN apt-get update \
  && apt-get install -y --no-install-recommends tzdata ca-certificates \
  && ln -snf /usr/share/zoneinfo/$TZ /etc/localtime \
  && echo $TZ > /etc/timezone \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Capa de dependencias (cache de build)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Código de la aplicación
COPY . .

EXPOSE 3000

USER node

CMD ["npm", "start"]
