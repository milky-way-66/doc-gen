# Schema: 02-apis.md

Output file for Step 1.2b — API Discovery.

---

```markdown
# API Discovery

**Analyzed:** <ISO datetime>

## Summary

| Field | Value |
|-------|-------|
| Total Endpoints | N |
| Base URL Pattern | /api/v1 |
| Auth Mechanism | JWT Bearer / Session / API Key |
| Response Format | JSON |
| Pagination Style | cursor / offset-limit / page-based / none |
| Error Format | `{ "error": "string", "code": "string" }` |

## Endpoint Inventory

| Method | Path | Feature Area | Auth | Purpose |
|--------|------|-------------|------|---------|
| POST | /api/v1/auth/login | Authentication | No | Authenticate user, return JWT |
| GET | /api/v1/users/me | User Profile | Yes | Fetch authenticated user profile |

## Notes

<Describe versioning strategy, rate limiting headers, request ID conventions, file upload endpoints, WebSocket routes, GraphQL resolvers, or other non-standard patterns.>
```
