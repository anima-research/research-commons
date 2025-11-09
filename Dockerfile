# Multi-stage build for Research Commons
FROM node:20-alpine AS base

# Build backend
FROM base AS backend-builder
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
RUN npm ci
COPY src ./src
RUN npm run build

# Build frontend
FROM base AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Production image
FROM base AS production
WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --production

# Copy built backend
COPY --from=backend-builder /app/dist ./dist
COPY --from=backend-builder /app/src/database/schema.sql ./dist/database/

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Copy initialization scripts
COPY create-default-ontologies.ts ./
COPY create-default-rankings.ts ./
COPY create-default-models.ts ./

# Create data directory
RUN mkdir -p /app/data

# Expose port
EXPOSE 3020

# Start command
CMD ["node", "dist/index.js"]

