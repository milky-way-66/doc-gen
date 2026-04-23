# Analysis Guide

Rules and tips for Phase 1 — Source Analysis. Sub-agents must read this before writing any output file.

For the exact format to write, see the schema files:

| Step | Output File | Schema |
|------|------------|--------|
| 1.1 | `_work/analysis/00-architecture.md` | [../schemas/analysis-architecture.md](../schemas/analysis-architecture.md) |
| 1.2a | `_work/analysis/01-screens.md` | [../schemas/analysis-screens.md](../schemas/analysis-screens.md) |
| 1.2b | `_work/analysis/02-apis.md` | [../schemas/analysis-apis.md](../schemas/analysis-apis.md) |
| 1.2c | `_work/analysis/03-database.md` | [../schemas/analysis-database.md](../schemas/analysis-database.md) |
| 1.3 | `_work/analysis/04-features.md` | [../schemas/analysis-features.md](../schemas/analysis-features.md) |
| 1.4 | `_work/analysis/features/f-XX-slug.md` | [../schemas/analysis-feature-detail.md](../schemas/analysis-feature-detail.md) |

---

## General Rules

- **Facts only.** Write what you observe in the source code. Do not invent, assume, or fill in gaps with guesses.
- **Mark unknowns explicitly.** When something cannot be determined, write: `Unknown — not found in source.` Do not leave fields blank.
- **Use relative source paths.** When referencing a specific file or line, use a path relative to `<source_path>` (e.g., `src/controllers/auth.ts:42`). This makes references stable regardless of where the project is cloned.
- **Keep summary tables scannable.** One line per item. Put detail in the deep-dive files (`features/f-XX.md`), not in the discovery files.
- **Log gaps.** If something is missing that downstream phases need, add a note to `_work/progress.md` under "Gaps & Assumptions".

---

## Bottom-Up Analysis Order

Follow this order strictly — each step depends on the previous:

```
1.1 Architecture Overview        ← understand the whole system first
      ↓
1.2 Discovery (parallel)         ← enumerate all screens, APIs, entities
      ↓
1.3 Feature Grouping + Dep Graph ← group into features, map dependencies
      ↓
1.4 Feature Deep Dives           ← detail each feature in dependency order
```

Never start a later step before its prerequisite is written to disk.

---

## Step-by-Step Tips

### Step 1.1 — Architecture Overview

**Where to look (in priority order):**
1. `README.md` (root, then sub-directories)
2. Package manifest: `package.json`, `requirements.txt`, `go.mod`, `Cargo.toml`, `pom.xml`, `build.gradle`, `pubspec.yaml`
3. Top-level directory listing (one level only — do not recurse yet)
4. `Dockerfile`, `docker-compose.yml`, `.dockerignore`
5. CI config: `.github/workflows/`, `.gitlab-ci.yml`, `Jenkinsfile`
6. Environment config: `.env.example`, `config/`, `app.config.*`

**Common traps:**
- Monorepos have multiple `package.json` files — read all of them to understand sub-packages.
- The root `README` may be outdated. Cross-check with actual directory structure.
- `docker-compose.yml` often reveals services (databases, caches, queues) not obvious from the app code.

### Step 1.2 — Discovery

**Screens — where to look by framework:**

| Framework | Look in |
|-----------|---------|
| Next.js (pages router) | `pages/` |
| Next.js (app router) | `app/` — every `page.tsx` is a screen |
| Nuxt | `pages/` |
| React + React Router | router config file, look for `<Route>` components |
| Vue + Vue Router | `src/router/index.ts` or `routes.ts` |
| Angular | `app-routing.module.ts` |
| Flutter | `MaterialApp routes:` or `GoRouter` config |
| React Native | `NavigationContainer` and `Stack.Navigator` in App.tsx |

**APIs — where to look by framework:**

| Framework | Look in |
|-----------|---------|
| Express / Fastify | `routes/`, `app.ts` router setup |
| NestJS | `*.controller.ts` files |
| Django | `urls.py` files |
| FastAPI | `@app.get`, `@app.post` decorators |
| Spring Boot | `@RestController` classes |
| Rails | `config/routes.rb` |
| Laravel | `routes/api.php` |

**Database — where to look by ORM:**

| ORM | Look in |
|-----|---------|
| Prisma | `prisma/schema.prisma` |
| TypeORM | `*.entity.ts` files |
| Sequelize | `models/` directory |
| SQLAlchemy | `models.py` or `db/models/` |
| ActiveRecord (Rails) | `app/models/` |
| Mongoose | `*.model.ts` or `schemas/` |
| GORM | `*.go` files with `gorm.Model` embedding |

### Step 1.3 — Feature Grouping

**What makes a good feature boundary:**
- A feature represents a **user-facing capability** (something a user can do), not a technical layer.
- A feature owns its screens, APIs, and entities end-to-end.
- Features should be roughly equal in size. If one "feature" has 15 screens, split it. If one has half a screen, merge it.
- Good examples: "Authentication", "User Profile", "Product Catalog", "Cart & Checkout", "Order History", "Admin — User Management".
- Bad examples: "Database layer", "Middleware", "Utilities" (these are technical, not user-facing).

**Dependency rule:**
Feature A depends on Feature B if A's screens call B's APIs, or A's entities have foreign keys into B's entities, or A's UI reads data owned by B.

Authentication is almost always a dependency of every other feature — put it in Batch 1.

### Step 1.4 — Feature Deep Dives

**User flow writing tips:**
- Number every step. Start at the user's first action (navigation or page load), end at the achieved goal (success state).
- Stay at intent level, not UI-click level.
  - Bad: "User clicks the blue Submit button in the bottom right corner of the form"
  - Good: "User submits the login form"
- Include both the happy path and the most common error path in the main flow. Put alternative flows as separate numbered lists.

**Validation rules — where to find them:**
- Frontend: form library schemas (`zod`, `yup`, `joi`, `vee-validate`, `react-hook-form` resolver)
- Backend: request validators (`class-validator` DTOs, `express-validator`, Pydantic models, Laravel Form Requests)
- Database: column constraints in migrations or ORM entity decorators
- Check all three — they should match. Note any discrepancies.

**Business rules — where to find them:**
- Service layer (`*.service.ts`, `services/`, `use_cases/`)
- Controller pre-conditions (guards, middleware, before-action filters)
- Comments marked `// business rule:` or `// NOTE:`
- State machine definitions (status transitions)
