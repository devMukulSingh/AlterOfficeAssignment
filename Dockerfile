FROM node:lts-alpine

WORKDIR /app

COPY . /app/

RUN bun install

EXPOSE 3000

CMD [ "bun","run","start" ]
