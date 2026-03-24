FROM node:20-alpine

WORKDIR /app

# Install dependencies first (cache layer)
COPY package*.json ./
RUN npm install
RUN npm i -g @nestjs/cli

# Copy source files
COPY . .

EXPOSE 3000

ENV WATCHPACK_POLLING=true

CMD ["npm", "run", "start:dev"]