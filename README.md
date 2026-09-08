# AILO Monorepo

Monorepo for the AILO website and backend.

## Structure

- `apps/web`: canonical static AILO homepage (`index.html`) and logo assets.
- `apps/backend`: TypeScript Next.js backend with MongoDB and API routes.
- `AILO_Master_Technical_Specification .md`: project technical specification.

## Commands

Run commands from the repository root:

```powershell
npm install
npm run dev
npm run lint
npm run typecheck
npm run build
```

## Start on Windows

Double-click `start.bat`, or run this from PowerShell:

```powershell
.\start.ps1
```

The launcher checks Node.js, installs workspace dependencies, creates `apps/backend/.env.local` from the template, and starts the development server. For production mode:

```powershell
.\start.ps1 -Production
```

The backend runs at `http://localhost:3000`. Copy `apps/backend/.env.example` to `apps/backend/.env.local` and configure MongoDB before using database-backed routes.

## Backend routes

Public: `/research`, `/projects`, `/team`, `/news`, `/labs` (with `/labs/[slug]/booking` for lab/device reservations). Admin (protected, login at `/admin/login`): `/admin/dashboard`, `/admin/news`, `/admin/research`, `/admin/projects`, `/admin/team`, `/admin/labs`, `/admin/labs/devices`, `/admin/bookings`, `/admin/settings`, `/admin/users` (super_admin only), `/admin/chatbot`.

Seed data before first run:

```powershell
npm run seed:admin --workspace apps/backend
npm run seed:sample --workspace apps/backend
```

`seed:admin` creates one super_admin account from `ADMIN_EMAIL`/`ADMIN_PASSWORD` in `.env` and prints the credentials. `seed:sample` inserts a few sample Research/Project/Team/Lab/Device/SiteSettings documents so the public pages aren't empty.

Not yet wired to real external services (see TODOs in code): SMTP email (set `APP_EMAIL`/`APP_PASSWORD` for Gmail App Password), AI-generated news copy, and RAG chatbot embeddings — these currently use local/template fallbacks that keep the data flow real without an external API key.
