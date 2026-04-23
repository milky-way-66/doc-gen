---
name: gen-doc-legacy
description: Analyze a source code repository and generate technical documentation for LEGACY architectures (Server-rendered monoliths, PHP, ASP). Runs in three phases with parallel sub-agents.
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
- [ ] 1.2d Worker & Event Discovery
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
- [ ] 3.4  Documentation Index

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

> Read `<source_path>` and focus on top-level directories and runtime boundaries. Map architectural layers. Since this is a legacy app, look for monolithic server-side rendering, include chains, file-based routing, and raw database access.
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

> Read `<output_path>/_work/analysis/00-architecture.md` to understand the project structure.
>
> Every `.php` or `.asp` file in the root or `public/` directory might be a screen. Use terminal commands like `find . -type f \( -name '*.php' -o -name '*.html' \)` and trace `<form action="...">` or `<a href="...">` to find screens.
>
> **CRITICAL: You must list EVERY SINGLE screen found in the codebase. Do not truncate the list, summarize, or stop after a few examples.**
> **If you detect more than 50 screens, group them by top-level module and write them to separate files (e.g., `01-screens-auth.md`, `01-screens-catalog.md`), then create an index file `01-screens.md`.**
>
> For each screen record: a short ID (S-01, S-02...), name, route/path, what area it belongs to (auth, dashboard, settings, admin, etc.), and one-sentence purpose. Note the routing approach and any route guards.
>
> Write to `<output_path>/_work/analysis/01-screens.md` following the schema in `<investigator_root>/schemas/analysis-screens.md`.

**Agent 1.2b — API Discovery** *(skip if `1.2b` is `[x]`)*:

> Read `<output_path>/_work/analysis/00-architecture.md`.
>
> The project might be a server-rendered monolith without APIs. Search `<source_path>` for specific AJAX endpoints or REST routes if they exist. If none exist, do not hallucinate APIs; simply state "No APIs found (Legacy Monolith)" in the output and stop.
>
> **CRITICAL: You must list EVERY SINGLE API endpoint found in the codebase. Do not truncate the list. However, if the architecture analysis identified this as a legacy monolith without APIs, do not hallucinate APIs. Simply state "No APIs found (Legacy Monolith)" in the output and stop.**
> **If you detect more than 50 APIs, group them by top-level module and write them to separate files (e.g., `02-apis-users.md`), then create an index file `02-apis.md`.**
>
> For each endpoint record: method (GET/POST/etc.), path, feature area, whether auth is required, and one-sentence purpose. Note the base URL pattern, auth mechanism (JWT, session, API key, OAuth), and response format conventions.
>
> Write to `<output_path>/_work/analysis/02-apis.md` following the schema in `<investigator_root>/schemas/analysis-apis.md`.

**Agent 1.2c — Database / Entity Discovery** *(skip if `1.2c` is `[x]`)*:

> Read `<output_path>/_work/analysis/00-architecture.md`.
>
> The app may have no ORM. Look for `schema.sql` files. If missing, infer tables by running `grep -ri 'CREATE TABLE'` or `grep -ri 'INSERT INTO'` and `grep -ri 'SELECT .* FROM'` across the codebase.
>
> **CRITICAL: You must list EVERY SINGLE database entity found in the codebase. Do not truncate the list, summarize, or stop after a few examples.**
> **If you detect more than 50 entities, group them by module and write to separate files, then create an index file `03-database.md`.**
>
> For each entity record: name, table/collection name, one-sentence purpose, key fields (name + type), and relationships (hasMany, belongsTo, manyToMany). Note the DBMS, ORM, and any data patterns (soft delete, audit timestamps, UUID vs. integer PKs).
>
> Write to `<output_path>/_work/analysis/03-database.md` following the schema in `<investigator_root>/schemas/analysis-database.md`.

**Agent 1.2d — Worker & Event Discovery** *(skip if `1.2d` is `[x]`)*:

> Read `<output_path>/_work/analysis/00-architecture.md`.
>
> Search `<source_path>` for all background workers, cron jobs, event listeners (Kafka, RabbitMQ, SQS), and webhooks. Use `grep` to find keywords like `cron`, `queue`, `worker`, `subscribe`, `webhook`.
>
> **CRITICAL: You must list EVERY SINGLE worker and event handler found in the codebase.**
>
> For each worker/event record: name, trigger (time schedule or event topic), payload/inputs, and one-sentence purpose.
>
> Write to `<output_path>/_work/analysis/03b-workers.md` using a simple markdown list format.

Wait for all running agents to complete. Mark each finished step `[x]` in `progress.md`.

---

### Step 1.3 — Feature List & Dependency Graph (serial)

**Skip if** `1.3` is `[x]`.

Spawn one **general-purpose** sub-agent:

> Read all analysis files in `<output_path>/_work/analysis/`: `00-architecture.md`, `01-screens.md` (and any split files), `02-apis.md` (and split files), `03-database.md` (and split files), and `03b-workers.md` (if present).
>
> Group screens, APIs, entities, and workers into logical **features** — business capabilities that a user or actor can exercise. Examples: "User Authentication", "Product Catalog", "Order Management", "Admin Dashboard".
>
> **CRITICAL:** Ensure every single screen, API, entity, and worker discovered in the previous steps is assigned to at least one feature. Do not leave any orphans behind.
>
> For each feature define:
> - **ID**: F-01, F-02... (stable, never reuse)
> - **Name**: short noun phrase
> - **Description**: one sentence — what user goal does this feature serve?
> - **Owned screens**: IDs from screens files
> - **Owned APIs**: method + path from API files
> - **Owned entities**: names from database files
> - **Owned workers**: names from worker files
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
> First read `<output_path>/_work/analysis/04-features.md` to find which files belong to this feature. Then read those specific source files.
>
> A single file (e.g., `login.php`) may contain UI, API, and DB logic mixed together. Document:
> - **UI Flow & State:** Analyze form `action`s and `<a href>` links. Note session usage (`$_SESSION` or similar) for auth/state.
> - **Business Logic & API:** Analyze `$_POST` / `$_GET` handling.
> - **Database Interactions:** Document inline raw SQL queries (e.g., `INSERT INTO`, `SELECT`).
> - **Include Chains:** Follow `require()` or `include()` statements to find hidden DB connections or auth checks.
>
> Combine findings into `<output_path>/_work/analysis/features/f-XX-<slug>.md` following `<investigator_root>/schemas/analysis-feature-detail.md`.

After each batch completes, mark each feature's step `[x]` in `progress.md`, then start the next batch.

---

## Phase 2 — SRS Generation

**Skip entire phase if** all Phase 2 steps are `[x]` and `--force` not set.
**Prerequisite:** Phase 1 must be fully complete (all `[x]`). Enforce this check.

To execute Phase 2, load and strictly follow the instructions in `<investigator_root>/phases/phase-2-srs.md`. Provide it with `<source_path>`, `<output_path>`, `<investigator_root>`, and `<template_path>`.

---

## Phase 3 — Basic Design Generation

**Skip entire phase if** all Phase 3 steps are `[x]` and `--force` not set.
**Prerequisite:** Phase 2 must be fully complete. Enforce this check.

To execute Phase 3, load and strictly follow the instructions in `<investigator_root>/phases/phase-3-basic-design.md`. Provide it with `<source_path>`, `<output_path>`, `<investigator_root>`, and `<template_path>`.

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
