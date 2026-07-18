FROM node:20-slim

# Chromium dependencies for puppeteer / whatsapp-web.js
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 \
    libatk1.0-0 libcups2 libdrm2 libgbm1 libgtk-3-0 libnspr4 libnss3 \
    libx11-6 libxcomposite1 libxdamage1 libxrandr2 libxkbcommon0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /application

COPY package.json .
RUN npm install

COPY . .

CMD ["npm", "start"]
