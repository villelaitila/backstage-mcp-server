# Changelog

## [Unreleased]

### Fixed (Catalog API correctness — verified against `@backstage/catalog-client` and a live Backstage)

- **`get_entities_by_query` endpoint**: was `POST /entities/query` (does not exist). Now `GET /entities/by-query` with `orderField` repeated query params.
- **`get_entity_facets` endpoint**: was `POST /entities/facets` (does not exist). Now `GET /entity-facets` with repeated `facet` query params.
- **`get_location_by_ref` endpoint**: was `GET /locations/by-ref/{ref}` (does not exist). Now mirrors `@backstage/catalog-client`: lists `/locations` and filters client-side by stringified ref (`${type}:${target}`).
- **`get_location_by_entity` path**: was a single percent-encoded compound ref. Now uses the canonical split form `/locations/by-entity/{kind}/{namespace}/{name}`.
- **`get_entity_ancestors` path**: was a single percent-encoded compound ref. Now split into `/entities/by-name/{kind}/{namespace}/{name}/ancestry`.
- **`get_entities` response shape**: real Backstage returns a bare `Entity[]`. Wrapper now normalizes into `{ items: Entity[] }` so JSON:API formatter and other consumers stop seeing empty data.
- **`validate_entity` request body**: was `{ entity, locationRef }` (rejected by Backstage with HTTP 400). Now `{ entity, location }` per OpenAPI spec.
- **`add_location` `dryRun` parameter**: was sent in body and silently ignored by Backstage (so dryRun never worked). Now sent as `?dryRun=true` query parameter, matching `@backstage/catalog-client`.
- **`get_entities_by_refs` parameters**: now forwards `fields` (response projection) and `filter` (per-call filter); large `entityRefs` lists auto-chunk into batches of ≤1000 / ≤90 KiB to avoid 413 / proxy URL-length errors. Null items are normalized to `undefined`.
- **`format=jsonapi` query-param leak**: the MCP-side response-shape flag for `get_entities` no longer leaks into the Backstage query string (which used to trigger HTTP 400).

### Changed (breaking)

- **Filter input semantics**: outer `filter` array is now **AND across keys** (joined into a single `filter=` token with commas), `values` array is **OR within a key**. Previously the wrapper produced OR everywhere — but produced through axios's default array serializer, which also encoded the wrong wire shape (`filter[0][key]=...`), so practically no caller relied on the old behavior. The new form matches canonical Backstage syntax.
- **Filter URL encoding**: a custom axios `paramsSerializer` now produces canonical Backstage form (`filter=key=value`) instead of axios's default bracket notation.
- **Empty filter `values: []`**: now rejected by Zod (`.min(1)`) — was previously a silent no-op token.

### Added

- **Shared `entityFilterSchema`** in `src/types/filter.schema.ts`, used by `get_entities`, `get_entities_by_query`, and `get_entity_facets`.
- **`add_location.dryRun` tool parameter** (`z.boolean().optional()`) — actually reaches Backstage now.
- **`get_entities_by_refs.fields` tool parameter** for response projection.
- **API probe script** (`scripts/probe-backstage-api.mjs`) that records actual Backstage wire behavior; used to validate every fix in this batch against a live instance.

### Fixed

- **Authentication and Security**: Implemented comprehensive authentication system with AuthManager supporting multiple auth methods (Bearer, OAuth, API keys, Service accounts), automatic token refresh, rate limiting, security auditing, and input sanitization. Added security interceptors to API client and audit logging for all operations.
- **Response Format Optimization**: Added FormattedTextResponse and MultiContentResponse utilities with specific formatters for entities, entity lists, and locations. Updated key tools to use formatted responses for better LLM interaction while maintaining JSON fallback.
- **Error Handling**: Added comprehensive error handling to all 13 tools with try-catch blocks, proper error logging, and MCP-formatted error responses using ApiStatus.ERROR.
- **README Documentation**: Created comprehensive README with project description, installation steps, configuration guide, usage examples, API reference, and development instructions. All markdown linting issues resolved.
- **Zod Schema Definitions**: Replaced all `z.custom<Type>()` with proper Zod object schemas for tool parameters, enabling MCP server to register tools successfully.
- **Configuration Management**: Added environment variable support for `BACKSTAGE_BASE_URL` and `BACKSTAGE_TOKEN` with validation.
- **Tool Export Completeness**: Added missing export for `GetEntityFacetsTool` in `tools/index.ts`.
- **Path Resolution Issues**: Fixed tool loading paths for production builds, including ES module URL handling and correct directory resolution.
- **Test Suite Failures**: Fixed test mocking to properly test tool loading logic without filesystem dependencies.
- **TypeScript Configuration**: Added `isolatedModules: true` to tsconfig.json to resolve ts-jest warnings.
- **Linting Configuration**: Created `.eslintrc.json` with TypeScript support and fixed linting issues.

### Changed

- Updated tool metadata storage to use a global Map instead of Reflect metadata for better compatibility.
- Modified tool factory to properly extract tool classes from ES modules.
- Refactored test suite to use inheritance-based mocking for better isolation.

### Technical

- All tools now use proper Zod schemas matching Backstage CatalogAPI types.
- Server validates required environment variables on startup.
- Tool loading works in both development and production environments.
