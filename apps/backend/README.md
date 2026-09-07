# AILO Backend

TypeScript backend for AILO, built with Next.js App Router and MongoDB via Mongoose.

## Run locally

1. Copy `.env.example` to `.env.local`.
2. Set `MONGODB_URI` to a MongoDB Atlas connection string.
3. Install dependencies with `npm install`.
4. Start the development server with `npm run dev`.

The service runs at `http://localhost:3000` by default.

## API routes

- `GET /api/health`: service status and environment readiness.
- `GET /api/settings`: global site settings from MongoDB.
- `GET /api/news`: published news with pagination.
- `POST /api/news`: create a draft or published news item. Admin authentication will be added before production use.
- `POST /api/contact`: validate and store a public contact message.

## Checks

- `npm run typecheck`
- `npm run lint`
- `npm run build`

Database-backed routes return `503` until `MONGODB_URI` is configured and reachable. Never commit `.env.local` or real credentials.
