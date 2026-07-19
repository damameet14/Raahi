FROM node:20-alpine

WORKDIR /application

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

EXPOSE 5174

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
