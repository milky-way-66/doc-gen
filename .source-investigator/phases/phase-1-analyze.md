# Phase 1 — Source Analysis (Bottom-Up)

**Variables required by the adapter before executing this phase:**
- `{source_path}` — absolute path to source code root
- `{output_path}` — absolute path to output directory
- `{investigator_root}` — absolute path to `.source-investigator/`

**Skip entire phase if** all Phase 1 steps are `[x]` in `{output_path}/_work/progress.md` (unless `--force`).

**Principle:** general before specific. Understand the whole system before any single feature. Map relationships before detailing individual items.

---

## Step 1.1 — Architecture Overview

**Skip if** step `1.1` is `[x]` in progress.md.
**Worker type:** Explore
**Runs:** serial (must complete before step 1.2)

**Task:**

> Read the source code at `{source_path}`. Examine in order:
> all README files (root and sub-directories), package manifests
> (package.json, requirements.txt, go.mod, Cargo.toml, pom.xml,
> build.gradle, pubspec.yaml — whichever exist), top-level directory
> listing (one level deep), Dockerfile and docker-compose files,
> CI config (.github/workflows/, .gitlab-ci.yml), environment example
> files (.env.example, config/).
>
> Identify and document:
> - Project name and one-paragraph purpose
> - Programming language(s) and primary framework(s)
> - Project type: web-app / REST API / mobile / CLI / library / monorepo
> - Architectural layers: which directories map to frontend, backend, database, infrastructure, workers, etc.
> - External service integrations: payment gateways, auth providers, storage, email, maps, queues, etc.
> - Notable architectural patterns: monolith, microservices, BFF, event-driven, etc.
>
> Write findings to `{output_path}/_work/analysis/00-architecture.md`
> following the schema in `{investigator_root}/schemas/analysis-architecture.md`.

**After completion:** mark step `1.1` `[x]` in progress.md.

---

## Step 1.2 — Discovery

**Skip any sub-step already `[x]`.** Remaining sub-steps run in parallel.
**Worker type:** Explore (one worker per sub-step)

### Step 1.2a — Screen / UI Discovery

**Task:**

> Read `{output_path}/_work/analysis/00-architecture.md` to understand
> the project type and directory structure.
>
> Search `{source_path}` for all user-facing screens, pages, views, and routes.
> Look in: `pages/`, `views/`, `screens/`, `app/` (Next.js / Nuxt app-router),
> `src/routes/`, top-level `components/`, router config files
> (react-router, vue-router, angular routes, flutter routes).
>
> For each screen record: a short ID (S-01, S-02...), name, route/path,
> area (auth, dashboard, settings, admin, etc.), user role, and one-sentence purpose.
> Note the routing approach and any route guards.
>
> Write to `{output_path}/_work/analysis/01-screens.md`
> following the schema in `{investigator_root}/schemas/analysis-screens.md`.

### Step 1.2b — API Discovery

**Task:**

> Read `{output_path}/_work/analysis/00-architecture.md`.
>
> Search `{source_path}` for all API endpoints. Look in:
> `routes/`, `controllers/`, `api/`, `handlers/`, `resolvers/`,
> OpenAPI/Swagger spec files (openapi.yaml, swagger.json), gRPC proto files.
>
> For each endpoint record: method, path, feature area,
> auth required (yes/no), and one-sentence purpose.
> Note base URL pattern, auth mechanism, and response format conventions.
>
> Write to `{output_path}/_work/analysis/02-apis.md`
> following the schema in `{investigator_root}/schemas/analysis-apis.md`.

### Step 1.2c — Database / Entity Discovery

**Task:**

> Read `{output_path}/_work/analysis/00-architecture.md`.
>
> Search `{source_path}` for all data models, entities, and schemas.
> Look in: `models/`, `entities/`, `migrations/`, `prisma/schema.prisma`,
> `*.sql` migration files, TypeORM entities, Mongoose schemas,
> SQLAlchemy models, ActiveRecord models.
>
> For each entity record: name, table/collection name, one-sentence purpose,
> key fields (name + type), and relationships. Note the DBMS, ORM,
> and data patterns (soft delete, audit timestamps, UUID vs integer PKs).
>
> Write to `{output_path}/_work/analysis/03-database.md`
> following the schema in `{investigator_root}/schemas/analysis-database.md`.

**After all sub-steps complete:** mark each finished step `[x]` in progress.md.

---

## Step 1.3 — Feature List & Dependency Graph

**Skip if** step `1.3` is `[x]`.
**Worker type:** general-purpose
**Runs:** serial (needs all 1.2 outputs)

**Task:**

> Read all four files in `{output_path}/_work/analysis/`:
> `00-architecture.md`, `01-screens.md`, `02-apis.md`, `03-database.md`.
>
> Group screens, APIs, and entities into logical **features** —
> business capabilities a user can exercise
> (e.g., "User Authentication", "Product Catalog", "Order Management").
>
> For each feature define:
> - **ID**: F-01, F-02... (stable, never reuse)
> - **Name**: short noun phrase
> - **Description**: one sentence — what user goal does this feature serve?
> - **Owned screens**: IDs from 01-screens.md
> - **Owned APIs**: method + path from 02-apis.md
> - **Owned entities**: names from 03-database.md
> - **Depends on**: other feature IDs this feature cannot work without
>
> Determine **execution batches** for step 1.4:
> - Batch 1: features with no dependencies
> - Batch 2: features whose only dependencies are in Batch 1
> - Continue until all features are assigned a batch
>
> Write the feature register and batch assignments to
> `{output_path}/_work/analysis/04-features.md`
> following the schema in `{investigator_root}/schemas/analysis-features.md`.
>
> Write a Mermaid dependency diagram to
> `{output_path}/_work/dependency-graph.md`.
>
> Also append one checkbox line per feature to the Phase 1 section
> of `{output_path}/_work/progress.md`:
> `- [ ] 1.4 F-01 <Feature Name>`

**After completion:** mark step `1.3` `[x]` in progress.md.

---

## Step 1.4 — Feature Deep Dives

**Track each feature individually** as `1.4 F-XX`. Skip features already `[x]`.
**Worker type:** Explore (one worker per feature)
**Runs:** parallel within each batch; batches run in dependency order

Read `{output_path}/_work/analysis/04-features.md` to get features and batches.
Process Batch 1 fully before starting Batch 2, and so on.

**Task per feature** (substitute `<F-XX>`, `<Feature Name>`, `<slug>`):

> Deep-dive feature `<F-XX> — <Feature Name>` in `{source_path}`.
>
> First read `{output_path}/_work/analysis/04-features.md` to find
> which screens, APIs, and entities belong to this feature.
> Then read those specific source files.
>
> Document the following:
>
> **Screens** (for each screen owned by this feature):
> - User flow: numbered steps from page load to task completion
> - UI actions: all interactive elements with triggers and outcomes
> - Validation rules: field-level and form-level
> - Error states: what errors can occur and how they are displayed
>
> **API Endpoints** (for each endpoint owned by this feature):
> - Request: path params, query params, headers, body fields with types
> - Response: success schema, all error codes and messages
> - Business rules: what logic is enforced
>   (uniqueness checks, ownership, state machines, rate limits, etc.)
>
> **Entities** (for each entity owned by this feature):
> - All fields: name, data type, nullable, default, constraints
> - Business meaning of each field
> - All relationships and their cardinality
>
> **Integration points**: where this feature calls another feature's API,
> reads another feature's entity, or emits/consumes events.
>
> Write findings to `{output_path}/_work/analysis/features/f-XX-<slug>.md`
> following the schema in `{investigator_root}/schemas/analysis-feature-detail.md`.

**After each batch completes:** mark each feature `[x]` in progress.md, then start the next batch.
