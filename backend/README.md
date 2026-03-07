# Backend

Fastify + Prisma backend for Vidiony.

## Use pnpm

Install dependencies from the repository root:

```bash
pnpm install
```

Run the backend only:

```bash
pnpm --filter vidion-backend dev
```

Database commands:

```bash
pnpm --filter vidion-backend db:generate
pnpm --filter vidion-backend db:push
pnpm --filter vidion-backend db:migrate
pnpm --filter vidion-backend db:studio
```

Production build:

```bash
pnpm --filter vidion-backend build
pnpm --filter vidion-backend start
```
