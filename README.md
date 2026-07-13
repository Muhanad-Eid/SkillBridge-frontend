# SkillBridge Client

React and TypeScript frontend for SkillBridge. The application contains separate
public, job seeker, company, and admin experiences and communicates with the
ASP.NET Core API through `/api`.

## Commands

- `npm run dev` starts the local Vite server.
- `npm run build` creates the production bundle.
- `npm run lint` checks the source code.
- `npm test` runs the unit tests.

During local development, Vite proxies `/api` to `http://localhost:8080`.
Set `VITE_API_URL` only when the frontend and API are deployed at different
public origins.
