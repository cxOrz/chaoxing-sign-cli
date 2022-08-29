# syntax=docker/dockerfile:1

FROM node:16-alpine

WORKDIR /app

COPY ["package.json", "yarn.lock", "./"]

RUN corepack enable && yarn

COPY . .

EXPOSE 5000

CMD [ "node", "-r", "ts-node/register", "src/serve.ts" ]