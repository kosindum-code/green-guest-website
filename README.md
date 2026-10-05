# Green Guest Website

A responsive guesthouse website for Green Guest, with accommodation details, a photo gallery, and contact and booking information.

## Requirements

- Node.js 20 or newer
- pnpm 9 or newer

## Run locally

```bash
pnpm install
pnpm --filter @workspace/green-guest run dev
```

Vite prints the local development URL when it starts.

## Build

```bash
pnpm run build
```

The website is built from `artifacts/green-guest` into `artifacts/green-guest/dist/public`.

## Deployment

The repository includes a Netlify configuration. Connect the repository to Netlify; its build command and publish directory are defined in `netlify.toml`.

## Project structure

- `artifacts/green-guest` — the guesthouse website (React, TypeScript, and Vite)
- `artifacts/api-server` — API server workspace
- `artifacts/mockup-sandbox` — UI mockup workspace
- `lib` — shared API clients, API schemas, and database package
- `scripts` — workspace scripts

This is a pnpm monorepo. Install dependencies from the repository root so workspace packages resolve correctly.
