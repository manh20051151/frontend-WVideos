# ===== Giai đoạn 1: Build Next.js =====
FROM node:22-alpine AS builder
WORKDIR /app

# NEXT_PUBLIC_* bị "nướng chín" vào bundle client lúc build -> phải truyền qua build arg
ARG NEXT_PUBLIC_API_URL=http://localhost:8081/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ===== Giai đoạn 2: Runtime nhẹ (standalone) =====
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -S app && adduser -S app -G app

# Standalone build chỉ cần server.js + static assets
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

RUN chown -R app:app /app
USER app

EXPOSE 3000
CMD ["node", "server.js"]
