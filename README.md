# mineral-bridge-admin-dashboard

React + Vite + TypeScript starter following the structure of `selorg-admin-dashboard` in the Selorg Application reference. Includes a small sample feature demonstrating file and folder conventions.

```sh
npm install
cp .env.example .env
npm run dev
```

Admin: http://localhost:5173. Vite forwards `/api` to `VITE_API_URL`. For deployment, configure the hosting server to proxy `/api` to the service and serve `index.html` for SPA routes.

Features go in `src/modules/<feature>/{pages,components,hooks}`. Services go in `src/services/<feature>/`. Components use `.tsx` and optional `.module.css`; helpers and stores use `.ts`. App providers and routing live in `src/app/`.

Run `npm run typecheck` to check TypeScript. Dependencies must be installed in this repository first.

## Sample files

The sample feature reads `GET /api/samples` from the service. Start the service before using the sample screens. Open `/samples`.
