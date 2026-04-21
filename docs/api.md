# API Documentation Guide

The backend is a Fastify service that exposes REST endpoints for authentication, videos, search, channels, live features, user actions, and recommendation flows.

## OpenAPI / Swagger

- Swagger UI: `http://localhost:4000/docs`
- OpenAPI JSON: `http://localhost:4000/docs/json`
- OpenAPI YAML: `http://localhost:4000/docs/yaml`

Swagger is configured in:

- `backend/src/plugins/swagger.ts`
- Registration point: `backend/src/app.ts`

## Base URL

For local development:

```text
http://localhost:4000
```

## API Surface (Grouped)

| Group | Prefix | Notes |
|------|--------|-------|
| Health & metrics | `/health`, `/metrics` | Service health and observability |
| Authentication | `/auth/*` | Google OAuth + JWT/session flow |
| Videos | `/videos/*` | Details, stream URLs, adaptive media, comments, rating |
| Search | `/search/*` | Query, filtering, suggestion endpoints |
| Channels | `/channels/*` | Channel details and content tabs |
| Trending | `/trending/*` | Cached category-wise trending feeds |
| Live | `/live/*` | Live stream metadata + WebSocket chat |
| User | `/user/*` | History, subscriptions, playlists |
| YouTube proxy | `/api/yt/*` | Wrapped youtubei.js-backed endpoints |

## Authentication Notes

- Access tokens are typically handled via cookies.
- Protected routes enforce auth using backend decorators (e.g., `fastify.authenticate`).
- Some actions require YouTube-connected account permissions in addition to app auth.

## Example Requests

### 1) Health check

```bash
curl -X GET "http://localhost:4000/health"
```

### 2) Video details

```bash
curl -X GET "http://localhost:4000/videos/dQw4w9WgXcQ"
```

### 3) Search with filters

```bash
curl -G "http://localhost:4000/search" \
  --data-urlencode "q=lofi" \
  --data-urlencode "type=video" \
  --data-urlencode "sort=view_count"
```

## Error Envelope

Most API errors follow a consistent shape:

```json
{
  "success": false,
  "error": {
    "code": "SOME_ERROR_CODE",
    "message": "Human readable error"
  }
}
```

## Related References

- `../backend/README.md` for full route descriptions
- `architecture.md` for system-level API flow context
