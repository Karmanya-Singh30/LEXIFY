# Step 1: Build
FROM node:18-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Step 2: Run
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy only necessary runtime files
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# If you DO have these files, uncomment them:
# COPY --from=builder /app/next.config.js ./
# COPY --from=builder /app/.env* ./

EXPOSE 8080
ENV PORT 8080

CMD ["npm", "start"]
