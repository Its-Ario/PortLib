FROM node:20-alpine AS builder

WORKDIR /app

COPY pnpm-lock.yaml package.json ./

COPY frontend/package.json ./frontend/

RUN npm install -g pnpm \
    && pnpm install --filter frontend --frozen-lockfile

COPY frontend ./frontend/

RUN pnpm build --filter frontend

FROM nginx:alpine

COPY --from=builder /app/frontend/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
