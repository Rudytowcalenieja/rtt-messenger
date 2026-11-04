FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY server.js ./
RUN mkdir -p icons && chown -R node:node /app

USER node

EXPOSE 3000
CMD ["node", "server.js"]
