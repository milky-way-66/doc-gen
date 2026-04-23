---
name: gen-doc
description: Analyze a source code repository and generate technical documentation — SRS (Software Requirements Specification) and Basic Design. Runs in three phases with parallel sub-agents and full resume support. Use when asked to document, spec, or generate technical docs from a codebase.
argument-hint: [analyze|srs|design|all] <source_path> [--output <path>] [--force]
effort: xhigh
---

# gen-doc — Technical Documentation Generator

Generate SRS and Basic Design documents from source code using a three-phase pipeline with parallel sub-agents. Progress is saved to disk after every step — runs can be paused and resumed at any point.

## Usage

```
/gen-doc <source_path>                    # full pipeline (default)
/gen-doc all <source_path>               # full pipeline (explicit)
/gen-doc analyze <source_path>           # phase 1 only: analyze source code
/gen-doc srs <source_path>              # phase 2 only: generate SRS
/gen-doc design <source_path>           # phase 3 only: generate Basic Design

Options:
  --output <path>    output directory (default: ./docs/<project-name>)
  --force            re-run the requested phase even if already complete
```

---

## Step 0 — Parse & Validate

Parse `$ARGUMENTS` to extract:

1. **command** — first token if it is one of `analyze`, `srs`, `design`, `all`. If the first token looks like a path (starts with `/`, `./`, `../`, `~`, or a letter+colon on Windows), default command to `all`.
2. **source_path** — the path token (required). Resolve to absolute path.
3. **output_path** — value after `--output` if present; otherwise `./docs/<project-name>` where `<project-name>` is the last path segment of `source_path`.
4. **force** — `true` if `--force` is present, else `false`.
5. **template_path** — `${CLAUDE_SKILL_DIR}/../../.source-investigator/templates` (always derived from shared core location, no user input needed).
6. **investigator_root** — `${CLAUDE_SKILL_DIR}/../../.source-investigator` (shared, tool-agnostic core path).

**Validate before proceeding:**
- `source_path` must exist and be a directory. If not, stop immediately and tell the user with a clear error.
- For command `srs`: verify Phase 1 is fully complete in `progress.md`. If not, stop and say: "Phase 1 (analysis) must complete first. Run: `/gen-doc analyze <source_path>`".
- For command `design`: verify Phase 2 is fully complete. If not, stop and say: "Phase 2 (SRS) must complete first. Run: `/gen-doc srs <source_path>`".

---

## Step 0b — Resume Check & Bootstrap

1. Check if `<output_path>/_work/progress.md` exists.
2. If it exists, read it. Load the `[x]` / `[ ]` status for every step. Tell the user what was found: `"Resuming: Phase 1 complete, Phase 2 at step 2.2b"`.
3. If `--force` is set, reset all steps in the **requested phase** to `[ ]` (preserve other phases).
4. If `progress.md` does not exist (first run), create the directory structure and initialize it with the template below.

**Initialize `<output_path>/_work/progress.md`:**

```markdown
# gen-doc Progress

**Source:** <source_path>
**Output:** <output_path>
**Templates:** <template_path>
**Started:** <ISO datetime>
**Last Updated:** <ISO datetime>

## Phase 1: Source Analysis
- [ ] 1.1  Architecture Overview
- [ ] 1.2a Screen Discovery
- [ ] 1.2b API Discovery
- [ ] 1.2c Database / Entity Discovery
- [ ] 1.3  Feature List & Dependency Graph
- [ ] 1.4  Feature Deep Dives  <!-- one line per feature added after step 1.3 -->

## Phase 2: SRS Generation
- [ ] 2.1  Sections 1–2 (Introduction + Overall Description)
- [ ] 2.2a Section 3 (Use Cases)
- [ ] 2.2b Section 4 (System Features)
- [ ] 2.2c Section 5 (Data Requirements)
- [ ] 2.2d Section 6 (External Interfaces)
- [ ] 2.3a Section 7 (Quality Attributes)
- [ ] 2.3b Section 8 (Internationalization)
- [ ] 2.3c Section 9 (Other Requirements)

## Phase 3: Basic Design Generation
- [ ] 3.1a Screen Map
- [ ] 3.1b API List
- [ ] 3.2a Screen Details
- [ ] 3.2b API Details
- [ ] 3.3  Database Design

## Gaps & Assumptions
<!-- Populated during analysis. Items that could not be determined from source. -->
```

**Rule:** After every step completes, update `progress.md` — mark the step `[x]` and update `**Last Updated**`. Never skip this.

---

## Phase 1 — Source Analysis (Bottom-Up)

**Skip entire phase if** all Phase 1 steps are `[x]` and `--force` not set.

> Analysis rules: `<investigator_root>/guides/guide-analyze.md` — Output schemas are in `<investigator_root>/schemas/`.

**Principle:** general before specific. Understand the whole system before any single feature. Map relationships before detailing individual items.

### Parallel Subagent Execution Contract

When a step says "parallel", execute multiple subagents concurrently:

- Default behavior: if work items are independent (no data dependency), run multi-agent in parallel automatically.
- Launch all independent subagents in one assistant action using multiple `Subagent` tool calls.
- Do not run the second/third/fourth agent only after waiting for the first.
- Partition work by concern or feature area so each subagent owns a distinct slice.
- Enforce **one agent = one part**. Each agent must have exactly one primary focus area.
- After parallel agents finish, run one synthesis pass (or direct file merge) to remove overlap and normalize terminology.
- For very large repos, cap each wave at **max 8 parallel subagents**; continue in additional waves if needed.

Focus examples:
- `Architecture agent` -> architecture only (layers, boundaries, runtime topology)
- `Screen discovery agent` -> screens/routes only
- `API discovery agent` -> endpoints/contracts only
- `Database discovery agent` -> entities/schema only

Output ownership rules:
- Every parallel agent writes to a unique output file (or unique feature-specific file path).
- Do not let two agents write the same file at the same time.
- If an agent discovers data outside its scope, it records a short note in "handoff notes" and continues its own scope.

---

### Step 1.1 — Architecture Overview (parallel + synthesize)

**Skip if** step `1.1` is `[x]`.

Before launching agents, ensure `<output_path>/_work/analysis/_partials/` exists.

Spawn three **Explore** sub-agents in parallel:

**Agent 1.1a — Project Intent & Tooling**:

> Read the source code at `<source_path>`. Examine in order: all README files (root and sub-dirs), package manifests (package.json, requirements.txt, go.mod, Cargo.toml, pom.xml, build.gradle, pubspec.yaml — whichever exist), top-level directory listing (one level deep), Dockerfile and docker-compose files, CI config (.github/workflows/, .gitlab-ci.yml), environment example files (.env.example, config/).
>
> Identify and document:
> - Project name and one-paragraph purpose
> - Programming language(s) and primary framework(s)
> - Project type: web-app / REST API / mobile / CLI / library / monorepo
>
> Write findings to `<output_path>/_work/analysis/_partials/00-architecture-intent.md`.

**Agent 1.1b — Architecture (Layers & Runtime Topology)**:

> Read `<source_path>` and focus on top-level directories and runtime boundaries. Map architectural layers: frontend, backend, database, infrastructure, workers, shared libs, and scripts/tooling. Identify how components communicate (HTTP, events, queues, direct DB access, RPC).
>
> Write findings to `<output_path>/_work/analysis/_partials/00-architecture-layers.md`.

**Agent 1.1c — Integrations & Cross-Cutting Patterns**:

> Read `<source_path>` and focus on external integrations and cross-cutting concerns (auth, logging, monitoring, config loading, background jobs, caching, messaging).
>
> Identify and document:
> - External service integrations: payment gateways, auth providers, storage, email, maps, queues, etc.
> - Notable architectural patterns: monolith, microservices, BFF, event-driven, etc.
>
> Write findings to `<output_path>/_work/analysis/_partials/00-architecture-patterns.md`.

After all three complete, spawn one **general-purpose** synthesis sub-agent:

> Read these partial files:
> - `<output_path>/_work/analysis/_partials/00-architecture-intent.md`
> - `<output_path>/_work/analysis/_partials/00-architecture-layers.md`
> - `<output_path>/_work/analysis/_partials/00-architecture-patterns.md`
>
> Merge and normalize them into `<output_path>/_work/analysis/00-architecture.md` following `<investigator_root>/schemas/analysis-architecture.md`. Remove duplicates and keep only evidence-backed statements.

Wait for synthesis completion. Mark step `1.1` `[x]` in `progress.md`.

---

### Step 1.2 — Discovery (parallel)

**Skip any step already `[x]`.** Spawn remaining discovery agents in parallel (all at once, not sequentially).

**Agent 1.2a — Screen / UI Discovery** *(skip if `1.2a` is `[x]`)*:

> Read `<output_path>/_work/analysis/00-architecture.md` to understand the project type and directory structure.
>
> Search `<source_path>` for all user-facing screens, pages, views, and routes. Look in: `pages/`, `views/`, `screens/`, `app/` (Next.js / Nuxt app-router), `src/routes/`, top-level `components/`, router config files (react-router, vue-router, angular routes, flutter routes).
>
> For each screen record: a short ID (S-01, S-02...), name, route/path, what area it belongs to (auth, dashboard, settings, admin, etc.), and one-sentence purpose. Note the routing approach and any route guards.
>
> Write to `<output_path>/_work/analysis/01-screens.md` following the schema in `<investigator_root>/schemas/analysis-screens.md`.

**Agent 1.2b — API Discovery** *(skip if `1.2b` is `[x]`)*:

> Read `<output_path>/_work/analysis/00-architecture.md`.
>
> Search `<source_path>` for all API endpoints. Look in: `routes/`, `controllers/`, `api/`, `handlers/`, `resolvers/`, OpenAPI/Swagger spec files (openapi.yaml, swagger.json), gRPC proto files.
>
> For each endpoint record: method (GET/POST/etc.), path, feature area, whether auth is required, and one-sentence purpose. Note the base URL pattern, auth mechanism (JWT, session, API key, OAuth), and response format conventions.
>
> Write to `<output_path>/_work/analysis/02-apis.md` following the schema in `<investigator_root>/schemas/analysis-apis.md`.

**Agent 1.2c — Database / Entity Discovery** *(skip if `1.2c` is `[x]`)*:

> Read `<output_path>/_work/analysis/00-architecture.md`.
>
> Search `<source_path>` for all data models, entities, and schemas. Look in: `models/`, `entities/`, `migrations/`, `prisma/schema.prisma`, `*.sql` migration files, TypeORM entities, Mongoose schemas, SQLAlchemy models, ActiveRecord models.
>
> For each entity record: name, table/collection name, one-sentence purpose, key fields (name + type), and relationships (hasMany, belongsTo, manyToMany). Note the DBMS, ORM, and any data patterns (soft delete, audit timestamps, UUID vs. integer PKs).
>
> Write to `<output_path>/_work/analysis/03-database.md` following the schema in `<investigator_root>/schemas/analysis-database.md`.

Wait for all running agents to complete. Mark each finished step `[x]` in `progress.md`.

---

### Step 1.3 — Feature List & Dependency Graph (serial)

**Skip if** `1.3` is `[x]`.

Spawn one **general-purpose** sub-agent:

> Read all four files in `<output_path>/_work/analysis/`: `00-architecture.md`, `01-screens.md`, `02-apis.md`, `03-database.md`.
>
> Group screens, APIs, and entities into logical **features** — business capabilities that a user or actor can exercise. Examples: "User Authentication", "Product Catalog", "Order Management", "Admin Dashboard".
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
> Determine **execution batches** for Phase 1.4:
> - Batch 1: features with no dependencies
> - Batch 2: features whose only dependencies are in Batch 1
> - Continue until all features are assigned a batch
>
> Write the complete feature register and batch assignments to `<output_path>/_work/analysis/04-features.md` following the schema in `<investigator_root>/schemas/analysis-features.md`.
>
> Write a Mermaid dependency diagram to `<output_path>/_work/dependency-graph.md`.
>
> Also update `<output_path>/_work/progress.md` Phase 1 section: add one checkbox line per feature under `1.4`:
> `- [ ] 1.4 F-01 <Feature Name>`

Wait for completion. Mark step `1.3` `[x]`.

---

### Step 1.4 — Feature Deep Dives (parallel, batched by dependency order)

**Track each feature individually** as `1.4 F-XX`. Skip features already `[x]`.

Read `<output_path>/_work/analysis/04-features.md` to get features and batches.

**For each batch (process batches in order):** spawn one **Explore** sub-agent **per feature** in that batch simultaneously (single assistant action with multiple subagent calls). Wait for the full batch to complete before starting the next batch.

Each sub-agent receives this task (fill in the feature-specific values):

> Deep-dive feature `<F-XX> — <Feature Name>` in `<source_path>`.
>
> First read `<output_path>/_work/analysis/04-features.md` to find which screens, APIs, and entities belong to this feature. Then read those specific source files.
>
> Document the following:
>
> **Screens** (for each screen owned by this feature):
> - User flow: numbered steps from page load to task completion
> - UI actions: all interactive elements (buttons, forms, dropdowns, modals) with their triggers and outcomes
> - Validation rules: field-level and form-level
> - Error states: what errors can occur, how they are displayed
>
> **API Endpoints** (for each endpoint owned by this feature):
> - Request: path params, query params, headers, body fields with types
> - Response: success schema, all error codes and messages
> - Business rules: what logic is enforced (uniqueness, ownership checks, state machines, etc.)
>
> **Entities** (for each entity owned by this feature):
> - All fields: name, data type, nullable, default, constraints
> - Business meaning of each field
> - All relationships and their cardinality
>
> **Integration points**: where this feature calls another feature's API, reads another feature's entity, or emits/consumes events.
>
> Write findings to `<output_path>/_work/analysis/features/f-XX-<slug>.md` following the schema in `<investigator_root>/schemas/analysis-feature-detail.md`.

After each batch completes, mark each feature's step `[x]` in `progress.md`, then start the next batch.

---

## Phase 2 — SRS Generation

**Skip entire phase if** all Phase 2 steps are `[x]` and `--force` not set.
**Prerequisite:** Phase 1 must be fully complete (all `[x]`). Enforce this check.

> Guidance for writing quality SRS content: `<investigator_root>/guides/guide-srs.md`
> Templates location: `<template_path>/srs/`
> Input: `<output_path>/_work/analysis/`
>
> **Golden rule:** Only document what is evidenced in the source code and analysis. Do not invent requirements. When something cannot be determined, write "TBD — not determinable from source" and add it to the Gaps section of `progress.md`.

---

### Step 2.1 — Foundation (serial)

**Skip if** `2.1` is `[x]`.

Spawn one **general-purpose** sub-agent:

> Using the analysis files in `<output_path>/_work/analysis/`, generate SRS sections 1 and 2.
>
> **Section 1 — Introduction:** product name and one-paragraph purpose (from 00-architecture.md), document version (1.0 Draft), intended audience (developers, PMs, QA, business analysts), scope (what the system does and does not do), definitions/acronyms for all technical terms and abbreviations used in the codebase.
>
> **Section 2 — Overall Description:** product perspective (standalone or part of a larger ecosystem), user classes (derive from screen ownership and API roles — admin, customer, API consumer, etc.) with their technical sophistication, operating environment (OS, browser targets, runtime versions from config), design constraints (framework choices, third-party lock-in), assumptions and dependencies.
>
> Templates: `<template_path>/srs/1-introduction.md`, `<template_path>/srs/2-overall-description.md`.
> Output: `<output_path>/srs/01-introduction.md`, `<output_path>/srs/02-overall-description.md`.
> Refer to `<investigator_root>/guides/guide-srs.md` for writing guidance.

Wait for completion. Mark `2.1` `[x]`.

---

### Step 2.2 — Core Sections (parallel)

**Skip steps already `[x]`.** Spawn remaining agents in parallel in one assistant action (multiple subagent calls).

**Agent 2.2a — Use Cases** *(skip if `[x]`)*:
> Using feature deep dives in `<output_path>/_work/analysis/features/` and `01-screens.md`, generate the use case index at `<output_path>/srs/03-use-cases.md` and one detail file per use case at `<output_path>/srs/03-use-cases/uc-XX-<slug>.md`.
>
> One use case = one user goal (e.g., "Register Account", "Place Order", "Export Report"). Derive from screen user flows. Include use case diagram (Mermaid), actor list, preconditions, main flow, alternative flows, error flows, and postconditions.
>
> Templates: `<template_path>/srs/3-use-cases.md`, `<template_path>/srs/3-use-case-detail-template.md`.

**Agent 2.2b — System Features** *(skip if `[x]`)*:
> Using `<output_path>/_work/analysis/04-features.md` and all feature deep dives, generate `<output_path>/srs/04-system-features.md` and one detail file per feature at `<output_path>/srs/04-system-features/f-XX-<slug>.md`.
>
> Feature details must include: functional requirements (numbered FR-XX-YY), acceptance criteria, priority, user story, related use cases, and edge cases.
>
> Templates: `<template_path>/srs/4-system-features-list-template.md`, `<template_path>/srs/4-system-feature-detail-template.md`.

**Agent 2.2c — Data Requirements** *(skip if `[x]`)*:
> Using `<output_path>/_work/analysis/03-database.md` and feature deep dives, generate `<output_path>/srs/05-data-requirements.md`.
>
> Include: ER diagram (Mermaid erDiagram), data dictionary (every entity and field), data retention policies (if evidenced), privacy/PII fields (flag sensitive data).
>
> Template: `<template_path>/srs/5-data-requirements.md`.

**Agent 2.2d — External Interfaces** *(skip if `[x]`)*:
> Using `<output_path>/_work/analysis/00-architecture.md` and `02-apis.md`, generate `<output_path>/srs/06-external-interfaces.md`.
>
> Sections: (1) User Interfaces — UI standards and design conventions found in codebase; (2) Software Interfaces — all third-party APIs/SDKs integrated; (3) Hardware Interfaces — if any; (4) Communication Interfaces — protocols, data formats, API versioning strategy.
>
> Template: `<template_path>/srs/6-external-interfaces.md`.

Wait for all. Mark completed steps `[x]`.

---

### Step 2.3 — Quality & Supplemental Sections (parallel)

**Skip steps already `[x]`.** Spawn remaining agents in parallel in one assistant action (multiple subagent calls).

**Agent 2.3a — Quality Attributes** *(skip if `[x]`)*:
> Infer non-functional requirements from the codebase: caching → performance, rate limiting → scalability, auth guards → security, test coverage → maintainability, retry logic → reliability.
>
> Generate `<output_path>/srs/07-quality-attributes.md`. Template: `<template_path>/srs/7-quality-attributes.md`.

**Agent 2.3b — Internationalization** *(skip if `[x]`)*:
> Search `<source_path>` for i18n signals: locale config files, translation JSON/YAML, i18next / vue-i18n / flutter_localizations, date-fns locale, currency formatting.
>
> Generate `<output_path>/srs/08-internationalization.md`. Template: `<template_path>/srs/8-internationalization.md`.

**Agent 2.3c — Other Requirements** *(skip if `[x]`)*:
> Look for: license files (legal), `.env` variables (configuration/installation), logging frameworks (monitoring), audit trail patterns, compliance markers (GDPR, HIPAA, PCI-DSS comments or config).
>
> Generate `<output_path>/srs/09-other-requirements.md`. Template: `<template_path>/srs/9-other-requirements.md`.

Wait for all. Mark `[x]`.

---

## Phase 3 — Basic Design Generation

**Skip entire phase if** all Phase 3 steps are `[x]` and `--force` not set.
**Prerequisite:** Phase 2 must be fully complete. Enforce this check.

> Guidance: `<investigator_root>/guides/guide-basic-design.md`
> Templates: `<template_path>/basic_design/`
> Input: `<output_path>/srs/` + `<output_path>/_work/analysis/`

---

### Step 3.1 — Screen Map & API List (parallel)

**Skip steps already `[x]`.** Launch both agents in one assistant action (multiple subagent calls).

**Agent 3.1a — Screen Map** *(skip if `[x]`)*:
> Using `<output_path>/srs/03-use-cases/`, `<output_path>/srs/06-external-interfaces.md`, and `<output_path>/_work/analysis/01-screens.md`, generate `<output_path>/basic-design/screen-map.md`.
>
> Include: (1) Design System section — color palette, typography, spacing (infer from Tailwind config, theme files, CSS variables; or mark as TBD if not present); (2) Navigation Flow Diagram — Mermaid flowchart showing all screens and their transitions; (3) Screen Index — table with ID, name, route, user role, feature area, and link to detail file.
>
> Template: `<template_path>/basic_design/list-screen-template.md`.

**Agent 3.1b — API List** *(skip if `[x]`)*:
> Using `<output_path>/srs/04-system-features/`, `<output_path>/srs/06-external-interfaces.md`, and `<output_path>/_work/analysis/02-apis.md`, generate `<output_path>/basic-design/api-list.md`.
>
> Include: (1) API Overview — base URL, protocol, auth mechanism, content type, versioning; (2) Authentication section — how to authenticate, token format; (3) Endpoint summary table — method, path, feature, auth required, brief description, link to detail.
>
> Template: `<template_path>/basic_design/list-api-template.md`.

Wait for both. Mark `[x]`.

---

### Step 3.2 — Detail Documents (parallel batches)

**Skip steps already `[x]`.**

**Screen Details** *(skip if `3.2a` is `[x]`)*:

Read `<output_path>/basic-design/screen-map.md` and `<output_path>/_work/analysis/04-features.md`. Group screens by feature. Spawn one **general-purpose** sub-agent per feature (max 5 in parallel per wave; if more than 5 features, process in additional waves).

Each screen-detail agent task:
> For feature `<F-XX>`, generate detail files for each of its screens at `<output_path>/basic-design/screens/<feature-slug>/screen-<screen-slug>.md`.
>
> Per screen include: purpose, user role, ASCII wireframe showing layout structure, component inventory table (component name / type / behavior / source requirement), state & interaction table (user action → system response → outcome), validation rules (field-by-field), error states and their messages, cross-references to SRS use case IDs.
>
> Template: `<template_path>/basic_design/detail-screen-template.md`.

**API Details** *(skip if `3.2b` is `[x]`)*:

Similarly, group endpoints by feature. Spawn one sub-agent per feature (max 5 parallel per wave).

Each API-detail agent task:
> For feature `<F-XX>`, generate detail files for each of its endpoints at `<output_path>/basic-design/apis/<feature-slug>/api-<method>-<slug>.md`.
>
> Per endpoint include: full request spec (path params, query params with types/defaults, headers, body schema with field-level validation rules), full response spec (success schema, all error codes with messages and when they occur), JSON examples (request and response), business rules enforced, auth flow, cross-references to SRS feature IDs.
>
> Template: `<template_path>/basic_design/detail-api-template.md`.

Wait for all batches to complete. Mark `3.2a` and `3.2b` `[x]`.

---

### Step 3.3 — Database Design (serial)

**Skip if** `3.3` is `[x]`.

Spawn one **general-purpose** sub-agent:

> Using `<output_path>/srs/05-data-requirements.md` and `<output_path>/_work/analysis/03-database.md`, generate `<output_path>/basic-design/db-design.md`.
>
> Include: (1) Overview — DBMS, ORM, purpose summary; (2) Complete ER diagram in Mermaid erDiagram syntax; (3) Table-by-table breakdown — for every table: all columns (name, data type, nullable, default, constraints, business description), indexes (which columns and why), and foreign key relationships; (4) Relationships narrative — describe the most important joins in plain language; (5) Data patterns — soft delete, audit timestamps, JSONB usage, partitioning, etc.
>
> Template: `<template_path>/basic_design/db-design-template.md`.

Mark `3.3` `[x]`.

---

## Completion

After all requested phases complete, write a summary to the user:

```
gen-doc complete

  Source:       <source_path>
  Output:       <output_path>

  Phase 1 — Analysis      [complete / skipped / partial]
  Phase 2 — SRS           [complete / skipped / partial]
  Phase 3 — Basic Design  [complete / skipped / partial]

  Generated files:
    srs/                  <N> files
    basic-design/         <N> files

  Gaps & Assumptions:
    <list items added to progress.md during this run, or "none">

  To continue:
    /gen-doc srs <source_path>      generate SRS from existing analysis
    /gen-doc design <source_path>   generate Basic Design from existing SRS
    /gen-doc all <source_path> --force   re-run everything from scratch
```
