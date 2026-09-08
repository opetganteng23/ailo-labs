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
