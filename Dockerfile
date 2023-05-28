# syntax=docker/dockerfile:1

FROM alpine:3.17

WORKDIR /app

COPY . .

RUN apk add --no-cache libc6-compat nodejs-current nginx && corepack enable && pnpm install && pnpm build && cp -f nginx.conf /etc/nginx

EXPOSE 5000 80

CMD nginx && echo 'Nginx: http://localhost:80' && node apps/server/build/serve.js
