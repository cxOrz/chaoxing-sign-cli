# syntax=docker/dockerfile:1

FROM node:16-alpine

WORKDIR /app

COPY ["package.json", "yarn.lock", "./"]

RUN corepack enable && yarn && yarn build

COPY . .

EXPOSE 5000

CMD [ "node", "build/serve.js" ]