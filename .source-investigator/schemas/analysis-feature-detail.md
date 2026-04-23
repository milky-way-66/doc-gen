# Schema: features/f-XX-slug.md

Output file for Step 1.4 — Feature Deep Dive (one file per feature).

Replace `F-XX`, `<Feature Name>`, and `<slug>` with the actual feature values.
Filename: `f-01-authentication.md`, `f-02-user-profile.md`, etc.

---

```markdown
# Feature: F-XX — <Feature Name>

**Analyzed:** <ISO datetime>
**Depends On:** F-YY, F-ZZ  *(or "None")*

---

## Screens

<!-- Repeat this block for each screen owned by this feature -->

### S-XX — <Screen Name>

**Route:** `/path`
**User Role:** authenticated / guest / admin

#### User Flow

1. User navigates to `/path`
2. System fetches <data> via `GET /api/...`
3. Screen renders <list / form / dashboard>
4. User performs <action>
5. System calls `POST /api/...`
6. On success: <redirect / toast / state update>
7. On error: <inline message / modal>

#### UI Actions

| Element | Type | Trigger | Outcome |
|---------|------|---------|---------|
| Submit button | button | click | Calls POST /api/..., shows loading spinner |
| Email field | text input | blur | Validates format; shows inline error if invalid |
| Cancel link | link | click | Navigates back without saving |

#### Validation Rules

| Field | Rule | Error Message |
|-------|------|--------------|
| email | Required, valid email format | "Please enter a valid email address" |
| password | Required, min 8 characters | "Password must be at least 8 characters" |

#### Error States

| Trigger | How Displayed |
|---------|--------------|
| 401 from API | Banner: "Invalid email or password" |
| 500 from API | Toast: "Something went wrong. Please try again." |
| Network timeout | Banner: "Connection error. Check your internet." |

---

## API Endpoints

<!-- Repeat this block for each endpoint owned by this feature -->

### <METHOD> <path>

**Business Rules:**
1. <Rule 1 — e.g., "Account must have status = 'active'">
2. <Rule 2 — e.g., "Failed attempts > 5 within 15 min locks account for 30 min">

**Request:**

*Path Parameters:*
| Param | Type | Description |
|-------|------|-------------|
| id | UUID | Resource identifier |

*Query Parameters:*
| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| page | integer | No | 1 | Page number |

*Body:*
| Field | Type | Required | Validation | Description |
|-------|------|----------|-----------|-------------|
| email | string | Yes | Valid email | Login identifier |
| password | string | Yes | Min 8 chars | Plain text; hashed server-side |

**Response (200):**
```json
{
  "access_token": "string",
  "expires_in": 900
}
```

**Error Codes:**

| HTTP | Code | Condition |
|------|------|-----------|
| 401 | AUTH_INVALID | Wrong credentials |
| 422 | VALIDATION_ERROR | Body fails validation |
| 429 | AUTH_LOCKED | Account locked after too many attempts |
| 500 | SERVER_ERROR | Unexpected server error |

---

## Entities

<!-- Repeat this block for each entity owned by this feature -->

### <EntityName>

| Field | Type | Nullable | Default | Constraints | Business Meaning |
|-------|------|----------|---------|-------------|-----------------|
| id | UUID | No | gen_random_uuid() | PK | Unique identifier |
| email | VARCHAR(255) | No | — | UNIQUE, NOT NULL | Login identifier; must be unique across all users |
| password_hash | VARCHAR(255) | No | — | NOT NULL | bcrypt hash — never returned in API responses |
| role | ENUM | No | 'user' | NOT NULL | Access level: 'user' or 'admin' |
| status | ENUM | No | 'active' | NOT NULL | Lifecycle: 'active', 'suspended', 'pending_verification' |
| created_at | TIMESTAMPTZ | No | NOW() | NOT NULL | Record creation time |
| deleted_at | TIMESTAMPTZ | Yes | NULL | — | Soft delete — NULL means the record is active |

**Relationships:**
- `hasMany Session` via `sessions.user_id`
- `hasMany Order` via `orders.user_id`

---

## Integration Points

<!-- Describe how this feature interacts with other features -->

- Calls **F-03 Product Catalog** `GET /api/v1/products` to populate the product selector on the Order screen
- Reads `User.role` from **F-01 Authentication** entity to conditionally show admin controls
- Emits `order.created` domain event consumed by **F-05 Notifications**
```
