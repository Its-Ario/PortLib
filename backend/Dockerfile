FROM node:20-alpine

WORKDIR /app

COPY backend/package.json pnpm-lock.yaml ./ 
COPY backend ./

RUN npm install -g pnpm \
    && pnpm install --frozen-lockfile

COPY . .

EXPOSE 3000

CMD ["pnpm", "start"]
