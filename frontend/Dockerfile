FROM node:20-alpine AS builder

WORKDIR /app

COPY frontend/package.json pnpm-lock.yaml ./ 
COPY frontend ./

RUN npm install -g pnpm \
    && pnpm install --filter frontend --frozen-lockfile

RUN pnpm build --filter frontend

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
