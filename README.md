# SkillBridge Client

React and TypeScript frontend for SkillBridge — role-based portals for
participants (job seekers), verified providers (companies), university
supervisors, and administrators, plus anonymous public evidence-share pages.
Communicates with the ASP.NET Core API through `/api`.

## Commands

- `npm ci` — install exact dependencies
- `npm run dev` — Vite dev server at `http://localhost:5173`; proxies `/api` to the local API at `http://localhost:8081`
- `npm run build` — type-check + production bundle
- `npm run lint` / `npm test` — ESLint and Vitest suites

## Configuration

No environment variables are required for local development (the dev proxy
targets the local API on port 8081). For deployed builds set:

- `VITE_API_URL` — public API origin (e.g. `https://api.example.com`). When
  unset, production builds fall back to same-origin `/api`.

Authentication uses bearer JWTs stored in `sessionStorage` by default
(`skillbridge_auth`), with a one-time migration from legacy `localStorage`
values. Sessions auto-expire client-side, sync across tabs, and the
server-side logout flow revokes the active token family.

## Testing notes

Vitest covers domain logic (role normalization, JWT expiry parsing, project
matching/labels, notification link safety). Run everything from this folder:

```powershell
npm run lint && npm run build && npm test
```

See the API repository README for backend setup, migrations, Docker/deployment,
and manual test journeys per role.
