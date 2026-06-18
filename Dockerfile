# ── Stage 1: build frontend ──────────────────────────────────────────────────
FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --include=dev

COPY . .
RUN npm run build

# ── Stage 2: production server ────────────────────────────────────────────────
FROM node:24-alpine AS runner

RUN addgroup -S orrico && adduser -S orrico -G orrico

WORKDIR /app

# Only production deps
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy server code and built frontend
COPY --from=builder /app/dist ./dist
COPY server ./server

# Non-root user
USER orrico

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:4000/api/health || exit 1

CMD ["node", "server/index.js"]
