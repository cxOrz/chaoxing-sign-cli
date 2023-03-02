# syntax=docker/dockerfile:1

FROM node:lts-alpine

WORKDIR /app

COPY . .

RUN apk add --no-cache libc6-compat && corepack enable && pnpm install && pnpm build

EXPOSE 5000

CMD [ "node", "apps/server/build/serve.js" ]
