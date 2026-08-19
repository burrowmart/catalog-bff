# catalog-bff

## Architecture

`catalog-bff` is a thin pass-through REST aggregation BFF over
`catalog-service` — it holds **no domain logic and no datastore**.

- `GET /catalog` forwards every query param it received (page, limit, and any
  search/filter params) verbatim to `catalog-service`'s list endpoint and
  reshapes nothing.
- Forwards the caller's own Cognito credential downstream — catalog-service
  independently verifies the JWT on every route (global guard).

### Request flow

```
Client → GET /catalog?page=2&limit=20&q=widget
         ↓
CatalogController  (forwards auth header)
         ↓
CatalogService     (pass-through: forwards the whole query string)
         ↓
catalog-service GET /catalog?page=2&limit=20&q=widget
```

---

## Running locally

```bash
cd ../contracts && npm install && npm run build && cd -
npm install
cp .env.example .env
npm run start:dev
# http://localhost:3000, Swagger at /api
```

### Tests

```bash
npm test          # unit — CatalogService with catalog-service HTTP calls mocked
npm run test:e2e  # e2e — real HTTP against an in-process catalog-service stub
```
