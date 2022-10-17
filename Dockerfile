# syntax=docker/dockerfile:1

FROM node:16-alpine

WORKDIR /app

COPY . .

RUN corepack enable && yarn && yarn build

EXPOSE 5000

CMD [ "node", "build/serve.js" ]