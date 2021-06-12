# === Build ===
FROM node:15-alpine as build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --only=prod

COPY . .
RUN npx -p typescript@4 tsc server/index.ts

# === Run ===
FROM node:15-alpine
WORKDIR /app
COPY --from=build /app /app

ENV PORT=80
EXPOSE 80
CMD node server/index.js
