# === Build ===
FROM node:16-alpine as build
WORKDIR /app

RUN apk add --no-cache git

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn run build:server

# === Run ===
FROM node:16-alpine
WORKDIR /app
COPY --from=build /app /app

ENV PORT=80
EXPOSE 80
CMD node dist/server/index.js
