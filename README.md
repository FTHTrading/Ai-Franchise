# Ai-Franchise

![Platform](https://img.shields.io/badge/Platform-AI%20Franchise-0f172a?style=for-the-badge)
![API](https://img.shields.io/badge/API-Fastify-0ea5e9?style=for-the-badge)
![Web](https://img.shields.io/badge/Web-Next.js%2014-16a34a?style=for-the-badge)
![Queue](https://img.shields.io/badge/Queue-BullMQ-f97316?style=for-the-badge)
![DB](https://img.shields.io/badge/Database-PostgreSQL-334155?style=for-the-badge)

Production-grade, multi-tenant AI franchise operating system for lead capture, conversational automation, workflow orchestration, and client portal delivery.

## Table of Contents

1. [System Color Map](#system-color-map)
2. [Engineered Architecture](#engineered-architecture)
3. [Flow Charts](#flow-charts)
4. [Monorepo Layout](#monorepo-layout)
5. [Quick Start](#quick-start)
6. [Service URLs](#service-urls)
7. [GitHub Pages](#github-pages)
8. [Production Notes](#production-notes)
9. [License](#license)

## System Color Map

- Blue lane: HTTP/API transport and integration boundaries
- Green lane: User-facing web surfaces (Agency, Client, Landing)
- Orange lane: Async automation and workflow workers
- Slate lane: Persistence and infrastructure (PostgreSQL, Redis, storage)

## Engineered Architecture

```mermaid
flowchart LR
      A[Agency Dashboard\nNext.js :3000]:::web
      B[Client Portal\nNext.js :3002]:::web
      C[Landing Site\nNext.js :3003]:::web
      D[Fastify API\n:3001]:::api
      E[(PostgreSQL)]:::data
      F[(Redis)]:::data
      G[Worker Runtime\nBullMQ]:::worker
      H[OpenAI]:::ext
      I[Telnyx SMS]:::ext
      J[Resend Email]:::ext
      K[Stripe Billing]:::ext

      A --> D
      B --> D
      C --> A
      D --> E
      D --> F
      G --> E
      G --> F
      G --> H
      G --> I
      G --> J
      D --> K

      classDef web fill:#DCFCE7,stroke:#16A34A,color:#14532D;
      classDef api fill:#E0F2FE,stroke:#0284C7,color:#0C4A6E;
      classDef worker fill:#FFEDD5,stroke:#EA580C,color:#7C2D12;
      classDef data fill:#E2E8F0,stroke:#334155,color:#0F172A;
      classDef ext fill:#F8FAFC,stroke:#64748B,color:#1E293B;
```

## Flow Charts

### Lead Intake to AI Follow-Up

```mermaid
flowchart TD
      S[Lead Submitted] --> V{Valid Payload?}
      V -- No --> X[Reject + Log]
      V -- Yes --> C[Create Lead + Conversation]
      C --> Q[Enqueue: workflow + lead-score]
      Q --> W[Worker Executes Steps]
      W --> R[Generate AI Reply]
      R --> T[Send SMS / Email]
      T --> U[Update Metrics + Status]
```

### Billing and Subscription Control

```mermaid
sequenceDiagram
      participant User as Agency Owner
      participant Web as Dashboard
      participant API as Billing API
      participant Stripe as Stripe
      User->>Web: Select plan
      Web->>API: Create checkout session
      API->>Stripe: Create session
      Stripe-->>Web: Hosted checkout URL
      User->>Stripe: Complete payment
      Stripe->>API: Webhook event
      API->>API: Update billing account
      API-->>Web: Active plan visible
```

## Monorepo Layout

```text
apps/
   api/       Fastify REST API
   web/       Agency dashboard
   client/    Client portal
   landing/   Marketing site
   worker/    BullMQ workers

packages/
   db/            Prisma schema + seed
   core/          Domain services
   workflows/     Automation runtime
   integrations/  OpenAI/Telnyx/Resend/Stripe adapters
   auth/          RBAC and auth helpers
   ui/            Shared React components
   types/         Shared type contracts
   config/        Environment validation
```

## Quick Start

```bash
pnpm install
cp .env.example .env
docker compose up postgres redis -d
pnpm db:push
pnpm db:seed
pnpm dev
```

## Service URLs

- Agency Dashboard: http://localhost:3000
- API: http://localhost:3001
- Client Portal: http://localhost:3002
- Landing Site: http://localhost:3003

## GitHub Pages

This repo includes a Pages-ready site under `docs/` plus a deployment workflow in `.github/workflows/deploy-pages.yml`.

After first push to `main`, enable Pages in repository settings:

1. Settings -> Pages
2. Source: GitHub Actions
3. Merge/push to `main` to publish automatically

## Production Notes

- Keep secrets in GitHub Actions secrets and `.env` files, never in source control.
- Run `pnpm type-check` and `pnpm build` in CI before deploy.
- Use managed PostgreSQL/Redis in production and configure backups/alerts.

## License

Private - All rights reserved.
