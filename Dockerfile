# FROM node:14.15.0-alpine3.10 as base
FROM node
WORKDIR /app
COPY package.json .
RUN npm install
EXPOSE 8080
COPY . .
CMD [ "npm", "start start-server" ]