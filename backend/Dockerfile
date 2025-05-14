# syntax=docker/dockerfile:1

ARG NODE_VERSION=22.13.1
ARG PNPM_VERSION=10.8.0

FROM node:${NODE_VERSION}-alpine AS base

RUN --mount=type=cache,target=/root/.npm \
    npm install -g pnpm@${PNPM_VERSION}

WORKDIR /usr/src/app
EXPOSE 4000

FROM base AS dev
RUN --mount=type=bind,source=backend/package.json,target=package.json \
    --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
    --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install

USER node
COPY ./backend .
CMD ["pnpm", "run", "dev"]
