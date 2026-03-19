FROM node:20-alpine

WORKDIR /app

# Install dependencies first (cache layer)
COPY package*.json ./
RUN npm install

# Copy source files
COPY . .

EXPOSE 3000

ENV WATCHPACK_POLLING=true

CMD ["npm", "run", "dev"]