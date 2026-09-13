# syntax=docker/dockerfile:1

# Node 22+ is required: the content layer uses the built-in node:sqlite module,
# so there is no native module to compile here.
ARG NODE_VERSION=24-alpine

# --- build ------------------------------------------------------------------
FROM node:${NODE_VERSION} AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Canonical URLs, hreflang, the sitemap and the share cards are all derived from
# this, and Astro bakes it in at build time — a domain change means a rebuild.
ARG SITE_URL=https://vonostudio.com
ENV SITE_URL=${SITE_URL}
RUN npm run build

# --- production dependencies ------------------------------------------------
FROM node:${NODE_VERSION} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# --- runtime ----------------------------------------------------------------
FROM node:${NODE_VERSION}
WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8081 \
    CONTENT_DB=/data/content.db

COPY --from=deps  /app/node_modules ./node_modules
COPY --from=build /app/dist         ./dist
COPY package.json ./
COPY scripts ./scripts
COPY seed    ./seed

# The content database lives on a volume; the image only carries the seed data
# used to create it the first time.
RUN mkdir -p /data && chown node:node /data
VOLUME ["/data"]
USER node

EXPOSE 8081

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/robots.txt" >/dev/null || exit 1

# On an empty volume, build the database from seed/ before starting. Kept inline
# rather than in a shell script so no file permission or CRLF issue can creep in
# between a Windows checkout and the Linux image.
CMD ["sh", "-c", "[ -f \"$CONTENT_DB\" ] || node scripts/seed.mjs; exec node ./dist/server/entry.mjs"]
