# Container image for testify-backend.
#
# MUST be built for linux/arm64. The instance is Graviton (t4g.small); an amd64
# image pulls fine and then fails to start with "exec format error".
#
#   docker build --platform linux/arm64 -t testifyhub:<sha> .
#
# CI does this automatically on merge to main (.github/workflows/deploy.yml) on
# an arm64 runner, so no emulation is involved. Locally, the infrastructure
# repository's ./scripts/deploy.sh does the same.
#
# Every comment below marks something that actually broke in production or in a
# smoke test. None of them are hypothetical.

# ---------------------------------------------------------------------------
# Build stage
# ---------------------------------------------------------------------------
# Debian slim, NOT Alpine: bcrypt is a native module and its prebuilt binaries
# target glibc. Alpine's musl forces a source build that frequently fails.
FROM node:22-bookworm-slim AS build
WORKDIR /app

# Toolchain for native modules (bcrypt) when no prebuilt binary matches.
RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 make g++ ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# `npm install`, not `npm ci`, because the repo has no package-lock.json.
# COMMIT A LOCKFILE and switch this to `npm ci` — without one, every build
# resolves different versions and is not reproducible.
COPY package.json ./
RUN npm install --no-audit --no-fund

# package.json pins typescript to "*", which resolves to 7.x today. That
# version removed `moduleResolution: node10` and `baseUrl`, both still used by
# tsconfig.json, so the build fails outright. Meanwhile 5.9 rejects
# `ignoreDeprecations: "6.0"`. Only 6.0.x compiles this config.
#
# Pinning here is a workaround. The real fix is in the app repo: pin typescript
# in devDependencies and commit the lockfile, or this breaks again on the next
# TypeScript release.
RUN npm install --no-audit --no-fund typescript@6.0.3

COPY tsconfig.json ./
COPY src ./src
COPY winston-papertrail.d.ts ./

# Called directly rather than through npx, which resolved a different copy.
RUN ./node_modules/typescript/bin/tsc -p tsconfig.json

# ---------------------------------------------------------------------------
# Runtime stage
# ---------------------------------------------------------------------------
FROM node:22-bookworm-slim AS runtime
WORKDIR /app

# curl is used by the container health check and by the deploy script's gate.
RUN apt-get update && apt-get install -y --no-install-recommends \
      curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force

COPY --from=build /app/dist ./dist

# swagger-jsdoc globs './src/**/*.ts' at RUNTIME (src/config/swagger/swagger.ts),
# so the TypeScript sources must be present in the runtime image or the spec
# build throws on startup. Point swagger at ./dist/**/*.js instead and this
# whole COPY can go, which would meaningfully shrink the image.
COPY src ./src

# Migrations ship in the image but are deliberately NOT run at start-up.
COPY migrations ./migrations
COPY database.json ./

# Runs as root today. Adding a non-root user is a straightforward improvement:
#   RUN useradd -r -u 10001 app && chown -R app /app
#   USER app
# Left out only because the container binds no privileged port inside itself
# (the host maps 80 → 8080).

EXPOSE 8080

# Docker-level health check. The infrastructure has its own watchdog, but this
# makes `docker ps` honest and lets the restart policy react on its own.
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -fsS http://localhost:8080/api/v1/healthcheck/ping || exit 1

# NOT `npm start`. That triggers package.json's `prestart` hook, which runs
# `db-migrate up` inside the app container. Design doc §8.4 requirement 9: if
# migrations run on container start, a failed migration crash-loops the
# container, and rolling back to the previous image leaves old code facing a
# new schema. The deploy script runs migrations separately, before this starts.
CMD ["node", "dist/index.js"]
