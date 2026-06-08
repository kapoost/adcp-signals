# syntax=docker/dockerfile:1.7
# Bun-native AdCP signal-provider agent (Cats variant).
# Monorepo: copies core + cats workspaces. Vanilla stays out — it's a
# spec conformance reference, not deployed.

FROM oven/bun:1.3.14-alpine AS install
WORKDIR /app

# Workspace manifest + member manifests. Need them all before `bun install`
# so the workspace resolver can wire @signals/core ↔ @signals/cats.
COPY package.json bun.lock tsconfig.json ./
COPY core/package.json ./core/
COPY cats/package.json ./cats/

RUN bun install --frozen-lockfile --production

FROM oven/bun:1.3.14-alpine AS runtime
WORKDIR /app

# Non-root user (defense in depth).
RUN addgroup -S adcp && adduser -S -G adcp -u 10001 adcp

# Hoisted node_modules from install stage.
COPY --from=install --chown=adcp:adcp /app/node_modules ./node_modules

# Workspace source: root config + core + cats. Vanilla skipped.
COPY --chown=adcp:adcp package.json bun.lock tsconfig.json ./
COPY --chown=adcp:adcp core ./core
COPY --chown=adcp:adcp cats ./cats

USER adcp

ENV PORT=3011 \
    NODE_ENV=production

EXPOSE 3011

# Bun runs TS directly — no separate build step.
CMD ["bun", "run", "cats/src/index.ts"]
