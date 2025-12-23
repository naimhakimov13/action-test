FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache sqlite

COPY package*.json ./
RUN npm ci --production

COPY . .

RUN npm run init-db

ENV NODE_ENV=production

CMD ["node", "src/index.js"]
