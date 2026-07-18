# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --ignore-scripts

# Copy source code
COPY . .

# Build for web with environment variables
ARG EXPO_PUBLIC_API_URL
ARG EXPO_PUBLIC_CDN_URL
ARG EXPO_PUBLIC_WEBPUSH_VAPID_KEY
ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL
ENV EXPO_PUBLIC_CDN_URL=$EXPO_PUBLIC_CDN_URL
ENV EXPO_PUBLIC_WEBPUSH_VAPID_KEY=$EXPO_PUBLIC_WEBPUSH_VAPID_KEY
RUN npx expo export -p web

# Stage 2: Serve
FROM node:20-alpine AS runner

WORKDIR /app

# Install serve globally
RUN npm install -g serve

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 8080

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget -q --spider http://localhost:8080/ || exit 1

# Serve the 'dist' folder on port 8080
CMD ["serve", "-s", "dist", "-l", "8080"]
