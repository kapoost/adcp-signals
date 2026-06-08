# syntax=docker/dockerfile:1.7
# Bun-native AdCP signal-provider agent (Cats variant).
# Monorepo: copies core + cats workspaces. Vanilla stays out — it's a
# spec conformance reference, not deployed.

FROM oven/bun:1.3.14-alpine AS install
WORKDIR /app

# Bun workspace resolution at install time pins @signals/core to the
# real on-disk shape of /app/core — so the full sources (not just
# package.json) need to be present BEFORE `bun install`. Otherwise the
# cached resolution captures an empty workspace member and the runtime
# stage gets "Cannot find module '@signals/core'" on Bun startup.
COPY package.json bun.lock tsconfig.json ./
COPY core ./core
COPY cats ./cats
# Vanilla's manifest only — workspaces[] requires every listed member
# to exist, but vanilla's source is reference-only and not deployed.
COPY vanilla/package.json ./vanilla/

RUN bun install --frozen-lockfile --production

FROM oven/bun:1.3.14-alpine AS runtime
WORKDIR /app

# Non-root user (defense in depth).
RUN addgroup -S adcp && adduser -S -G adcp -u 10001 adcp

# Whole resolved workspace from install stage — node_modules carries
# the Bun-cached resolution that points at /app/core for @signals/core,
# and core/ + cats/ are already in place at the expected paths.
COPY --from=install --chown=adcp:adcp /app /app

USER adcp

ENV PORT=3011 \
    NODE_ENV=production

EXPOSE 3011

CMD ["bun", "run", "cats/src/index.ts"]
