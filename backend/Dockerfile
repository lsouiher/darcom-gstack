# syntax=docker/dockerfile:1

FROM node:lts-alpine
WORKDIR /darywin/backend
COPY ./backend ./
COPY ./packages /darywin/packages
RUN npm install

CMD [ "npm", "run", "start:setup"]
EXPOSE 4004
