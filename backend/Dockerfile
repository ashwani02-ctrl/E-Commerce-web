FROM node:22-slim
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 5000
CMD ["npx", "tsx", "src/server.ts"]