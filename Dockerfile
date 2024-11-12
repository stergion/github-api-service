# Stage 1
FROM node:22-alpine AS staging
WORKDIR /app
COPY package*.json ./

# Stage 2
FROM staging AS builder
WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build

# Stage 3
FROM staging AS production
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist

RUN npm ci --only=production

USER node

EXPOSE 3000

CMD ["node", "dist/app.js"]