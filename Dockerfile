# Etapa 1: compila o front-end (React)
FROM node:20-alpine AS front
WORKDIR /front
COPY frontend/package*.json ./
RUN npm ci
COPY frontend ./
RUN npm run build

# Etapa 2: compila o back-end (TypeScript)
FROM node:20-alpine AS back
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci
COPY backend ./
RUN npm run build

# Etapa 3: imagem final (só o necessário para rodar)
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY --from=back /app/dist ./dist
COPY --from=front /front/dist ./public
RUN mkdir -p uploads
EXPOSE 3000
CMD ["node", "dist/index.js"]
