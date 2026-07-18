FROM node:20-slim

WORKDIR /application

COPY package.json .
RUN npm install

COPY . .

CMD ["npm", "start"]
