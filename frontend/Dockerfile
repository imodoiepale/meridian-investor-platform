FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm ci
COPY . .
RUN npm run build

FROM caddy:2-alpine
COPY --from=builder /app/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile
EXPOSE 80
