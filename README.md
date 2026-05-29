# ChemVault

ChemVault is a Cloudflare Pages-ready chemistry portal. The current frontend still works as a static site, and the project now includes a dynamic backend route using Cloudflare Pages Functions plus a D1 database.

## Dynamic Backend Route

The API entrypoint is `functions/api/[[path]].js`.

Available routes:

- `GET /api/health` reports whether the backend is using D1 or fallback data.
- `GET /api/records?q=graphene&type=material&limit=24` lists searchable records.
- `GET /api/records/:type/:id` returns one record.
- `POST /api/enrich` checks local D1 first, then pulls PubChem/PubMed data only when no local record exists.
- `GET /api/facets` returns type, domain and tag facets.

The Function is intentionally defensive:

- If `env.DB` exists, records are queried from Cloudflare D1.
- If `env.DB` is missing, the API returns local fallback examples.
- If a D1 query fails, the API still returns fallback data with a warning in `meta.warning`.
- Search results include `imageUrl`; PubChem imports use structure images and other records use generated ChemVault thumbnails.
- Academic enrichment validates source host, identifier and title before adding accepted records to D1.

The frontend helper is `scripts/api.js` and exposes `window.CHEMVAULT_API`:

```js
const results = await window.CHEMVAULT_API.searchRecords({ q: "graphene oxide" });
const imported = await window.CHEMVAULT_API.enrichRecords({ q: "unknown compound" });
const record = await window.CHEMVAULT_API.getRecord("reagent", "nabh4");
```

If the site is opened without Cloudflare Functions, the helper falls back to the existing browser-side ChemVault records so pages do not break.

## D1 Setup

Create the database, then replace the placeholder `database_id` in `wrangler.toml`:

```sh
wrangler d1 create chemvault
```

Apply the schema and seed data:

```sh
wrangler d1 execute chemvault --file=schema.sql
npm run d1:seed
```

`npm run d1:seed` rebuilds `seed.sql` from the local ChemVault data files before importing it. The generated seed currently includes the full local index, not just a sample subset. Each seeded record includes `image_url` so direct search results can render thumbnails immediately.

If your D1 database was created before record images were added, run the image-column migration once:

```sh
npm run d1:migrate:images
```

The Function also attempts to add the `image_url` column automatically when D1 is available, so existing deployments do not break if the migration has not been run yet.

For local Pages Functions development:

```sh
npm run dev
```

## Deploy To Cloudflare Pages

This project uses Cloudflare Pages Functions in the `functions/` directory, so deploy it as a Pages project.

Use this command for direct deploys:

```sh
npm run deploy
```

In the Cloudflare dashboard, use these settings:

- Project type: Pages, not Workers.
- Production branch: `main`.
- Framework preset: None.
- Build command: leave blank.
- Build output directory: `.`

Do not use `wrangler deploy` for this repo. That command deploys a Worker and expects Workers Static Assets configuration such as `[assets] directory = "./dist"`, which does not apply to Pages Functions.

If the live site still shows the older dark/cyberpunk theme, check that Cloudflare is not deploying the `cloudflare/workers-autoconfig` branch. That branch was generated for Workers configuration; the Pages + D1 site is on `main`.

Search result images are covered by `_headers`. PubChem structure images need `img-src` access to `pubchem.ncbi.nlm.nih.gov`; without that CSP rule, records such as `methanol` can have valid database `image_url` values but still show blank thumbnails in the browser.

## Files Added For The Backend

- `functions/api/[[path]].js` Cloudflare Pages Function API router.
- `schema.sql` D1 `records` table and indexes.
- `seed.sql` starter ChemVault records.
- `wrangler.toml` Pages and D1 binding configuration.
- `scripts/api.js` frontend API client with browser fallback.
