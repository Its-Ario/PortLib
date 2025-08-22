FROM node:20-bullseye

WORKDIR /app

COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./

COPY backend/package.json ./backend/

RUN npm install -g pnpm \
    && pnpm install --filter backend --frozen-lockfile

COPY backend ./backend/

EXPOSE 3000

CMD ["pnpm", "run", "start:backend"]