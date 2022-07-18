FROM node:10

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

RUN mkdir src
COPY src ./src

CMD [ "node", "src/index.js" ]
