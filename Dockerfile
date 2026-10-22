# Reemplaza el build de Nixpacks (que fijaba un Node viejo) replicando los comandos
# configurados en Coolify: install "npm install", build "npm run build", start "npm start".
# Node fijado a una versión con el parche de CVE-2026-111497 (Brotli). No bajar de aquí.
FROM node:22.23.4-bookworm-slim

# Mismas variables que inyecta Nixpacks en el build y en runtime.
ENV NODE_ENV=production \
    NPM_CONFIG_PRODUCTION=false \
    CI=true \
    PATH=/app/node_modules/.bin:$PATH

# Mismo directorio que Nixpacks: la sqlite por defecto vive en /app/.tmp/data.db
# y las subidas en /app/public/uploads.
WORKDIR /app
COPY . .

RUN npm install
RUN npm run build

EXPOSE 1337
CMD ["npm", "start"]
