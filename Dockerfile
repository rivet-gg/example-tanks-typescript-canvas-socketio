# === Build ===
FROM node:15-alpine as build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --only=prod

COPY . .
RUN npm run build-server

# === Run ===
FROM node:15-alpine
WORKDIR /app
COPY --from=build /app /app

ENV PORT=80
EXPOSE 80
CMD node dist/index.js
