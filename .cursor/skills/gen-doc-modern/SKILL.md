---
name: gen-doc-modern
description: Analyze a source code repository and generate technical documentation for MODERN architectures (SPA, API, MVC). Graph-first pipeline (Phase 0–3) with parallel sub-agents.
argument-hint: [analyze|srs|design|all] <source_path> [--output <path>] [--force] [--skip-graph-refresh] [--graph-backend both|gitnexus|graphify]
effort: xhigh
---

# gen-doc — Technical Documentation Generator

Generate SRS and Basic Design documents from source code using a **graph-first** pipeline: Phase 0 freezes **GitNexus** + **Graphify** into `_work/graph/`, Phase 1 materializes analysis views with graph evidence, then Phases 2–3 follow the machine-defined DAG in `document-dependencies.yaml`. Progress is saved to disk after every step — runs can be paused and resumed at any point.

## Usage

```
/gen-doc <source_path>                    # full pipeline (default)
/gen-doc all <source_path>               # full pipeline (explicit)
/gen-doc analyze <source_path>           # phase 1 only: analyze source code
/gen-doc srs <source_path>              # phase 2 only: generate SRS
/gen-doc design <source_path>           # phase 3 only: generate Basic Design

Options:
  --output <path>              output directory (default: ./docs/<project-name>)
  --force                      re-run the requested phase even if already complete
  --skip-graph-refresh         skip GitNexus/Graphify CLIs; require existing `_work/graph/manifest.json`
  --graph-backend <mode>       both (default) | gitnexus | graphify — skipped backend is stubbed + gap
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
7. **skip_graph_refresh** — `true` if `--skip-graph-refresh` is present, else `false`.
8. **graph_backend** — token after `--graph-backend` if present: `both`, `gitnexus`, or `graphify`; default `both`.
9. **document_deps** — always `<investigator_root>/document-dependencies.yaml` (DAG for outputs and parallel waves).

**Validate before proceeding:**
- `source_path` must exist and be a directory. If not, stop immediately and tell the user with a clear error.
- If `skip_graph_refresh` is true: require `<output_path>/_work/graph/manifest.json` exists; if not, stop with a clear error (user must run once without skip).
- For command `srs`: verify Phase 1 is fully complete in `progress.md`. If not, stop and say: "Phase 1 (analysis) must complete first. Run: `/gen-doc analyze <source_path>`". If `progress.md` contains **Phase 0**, verify every Phase 0 step is `[x]`; if not, stop and say: "Phase 0 (graph snapshot) must complete first. Run: `/gen-doc analyze <source_path>`".
- For command `design`: verify Phase 2 is fully complete. If not, stop and say: "Phase 2 (SRS) must complete first. Run: `/gen-doc srs <source_path>`".

---

## Step 0b — Resume Check & Bootstrap

1. Check if `<output_path>/_work/progress.md` exists.
2. If it exists, read it. Load the `[x]` / `[ ]` status for every step. Tell the user what was found: `"Resuming: Phase 1 complete, Phase 2 at step 2.2b"`.
3. If `--force` is set, reset all steps in the **requested phase** to `[ ]` (preserve other phases). **Exception:** if command is `analyze` and `--force` is set, reset **Phase 0 and Phase 1** (all steps in both phases) so graph + analysis rebuild together.
4. If `progress.md` does not exist (first run), create the directory structure and initialize it with the template below.

**Initialize `<output_path>/_work/progress.md`:**

```markdown
# gen-doc Progress

**Source:** <source_path>
**Output:** <output_path>
**Templates:** <template_path>
**Started:** <ISO datetime>
**Last Updated:** <ISO datetime>

## Phase 0: Graph index
- [ ] 0.1  GitNexus analyze (+ mirror to _work/graph/gitnexus)
- [ ] 0.2  Graphify build/export (_work/graph/graphify)
- [ ] 0.3  Snapshot manifest (_work/graph/manifest.json)

## Phase 1: Source Analysis
- [ ] 1.1  Architecture Overview
- [ ] 1.2a Screen Discovery
- [ ] 1.2b API Discovery
- [ ] 1.2c Database / Entity Discovery
- [ ] 1.2d Worker & Event Discovery
- [ ] 1.2e Module / package dependencies
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

**Migration:** If an existing `progress.md` has no `## Phase 0` section and the user runs `analyze` or `all`, insert the Phase 0 checklist (all `[ ]`) immediately above `## Phase 1`. If Phase 0 is missing and the user runs `srs`/`design` with Phase 1 already complete, allow continuing but append a gap: *Legacy progress — graph snapshot not recorded; run `/gen-doc analyze <source_path>` to add Phase 0.*

### Step 0c — Document dependency manifest (DAG)

1. Read `<investigator_root>/document-dependencies.yaml`.
2. Build the **directed acyclic graph** from `nodes[*].requires` (treat skipped backends per `backend_skip_rules` when resolving prerequisites).
3. **Parallel scheduling:** Only run subagents in parallel when (a) they share the same topological depth **and** (b) `parallel_waves` (if present) lists them as co-run after a completed `progress` milestone **and** (c) the step instructions allow parallel execution.
4. If `progress.md` and the manifest disagree on prerequisites for a step, **the manifest wins** — do not start a node until all `requires` are satisfied (skipped backends excepted).

---

## Phase 0 — Graph bootstrap

**Skip entire phase if** all Phase 0 steps are `[x]` and `skip_graph_refresh` is false and `--force` does not target Phase 0, **or** if `skip_graph_refresh` is true and `manifest.json` is valid (then mark `0.1`/`0.2` as already satisfied without re-run, and ensure `0.3` reflects current policy).

**Skip graph CLIs when** `skip_graph_refresh` is true: verify `<output_path>/_work/graph/manifest.json` exists; warn if `repoCommit` inside does not match current HEAD; mark `0.1` and `0.2` `[x]` without re-invoking tools; mark `0.3` `[x]` after verification.

Execute strictly per `<investigator_root>/phases/phase-0-graph.md`, passing `source_path`, `output_path`, `investigator_root`, resolved `repo_root` (`git rev-parse --show-toplevel` from `source_path`), `graph_backend`, and `skip_graph_refresh`.

**Parallelism:** When `graph_backend` is `both` and not skipping refresh, run **0.1** and **0.2** in parallel (two subagents or terminal tasks), then **0.3** serial.

After Phase 0 completes, summarize **graph status** for the user (commit SHA, paths under `_work/graph/`, backends used or skipped).

---

## Phase 1 — Source Analysis (Bottom-Up)

**Prerequisite:** If `progress.md` contains `## Phase 0`, every Phase 0 step must be `[x]` before starting `1.1`. If Phase 0 is absent (legacy progress), complete Phase 1 as before and log a gap recommending a full `analyze` run to record the graph.

**Skip entire phase if** all Phase 1 steps are `[x]` and `--force` not set.

> Analysis rules: `<investigator_root>/guides/guide-analyze.md` — Graph bootstrap: `<investigator_root>/guides/guide-graph-bootstrap.md` — Evidence format: `<investigator_root>/schemas/graph-evidence.md` — Output schemas: `<investigator_root>/schemas/`.

**Principle:** general before specific. Understand the whole system before any single feature. Map relationships before detailing individual items.

### Parallel Subagent Execution Contract

When a step says "parallel", execute multiple subagents concurrently **only if** allowed by `<investigator_root>/document-dependencies.yaml` (see Step 0c) **and** items are independent:

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

> Read `<output_path>/_work/graph/manifest.json` (if present). Use GitNexus MCP resources (`gitnexus://repo/{name}/context`, clusters, processes) and/or `<output_path>/_work/graph/graphify/GRAPH_REPORT.md` when available — then read the source code at `<source_path>`. Examine in order: all README files (root and sub-dirs), package manifests (package.json, requirements.txt, go.mod, Cargo.toml, pom.xml, build.gradle, pubspec.yaml — whichever exist), top-level directory listing (one level deep), Dockerfile and docker-compose files, CI config (.github/workflows/, .gitlab-ci.yml), environment example files (.env.example, config/).
>
> Identify and document:
> - Project name and one-paragraph purpose
> - Programming language(s) and primary framework(s)
> - Project type: web-app / REST API / mobile / CLI / library / monorepo
>
> Write findings to `<output_path>/_work/analysis/_partials/00-architecture-intent.md`.

**Agent 1.1b — Architecture (Layers & Runtime Topology)**:

> Read `<output_path>/_work/graph/manifest.json` if present. Prefer graph-backed navigation (GitNexus query/cypher or Graphify `graph.json` summaries) before broad file walks. Read `<source_path>` and focus on top-level directories and runtime boundaries. Map architectural layers: frontend, backend, database, infrastructure, workers, shared libs, and scripts/tooling. Identify how components communicate (HTTP, events, queues, direct DB access, RPC). 
>
> Write findings to `<output_path>/_work/analysis/_partials/00-architecture-layers.md`.

**Agent 1.1c — Integrations & Cross-Cutting Patterns**:

> Read `<output_path>/_work/graph/manifest.json` if present. Use graph signals for integration hotspots where possible, then read `<source_path>` for external integrations and cross-cutting concerns (auth, logging, monitoring, config loading, background jobs, caching, messaging).
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
> Merge and normalize them into `<output_path>/_work/analysis/00-architecture.md` following `<investigator_root>/schemas/analysis-architecture.md`. Remove duplicates and keep only evidence-backed statements; cite graph evidence per `<investigator_root>/schemas/graph-evidence.md` where applicable.

Wait for synthesis completion. Mark step `1.1` `[x]` in `progress.md`.

---

### Step 1.2 — Discovery (parallel)

**Skip any step already `[x]`.** Spawn remaining discovery agents in parallel (all at once, not sequentially).

**Agent 1.2a — Screen / UI Discovery** *(skip if `1.2a` is `[x]`)*:

> Read `<output_path>/_work/graph/manifest.json` and use graph clusters / processes to partition search. Read `<output_path>/_work/analysis/00-architecture.md` to understand the project structure.
>
> Search `<source_path>` for all user-facing screens, pages, views, and routes. Look in: `pages/`, `views/`, `app/`, `src/routes/`, router config files. Use terminal commands like `find . -type f -name '*route*'` to ensure you do not miss any files.
>
> **CRITICAL: You must list EVERY SINGLE screen found in the codebase. Do not truncate the list, summarize, or stop after a few examples.**
> **If you detect more than 50 screens, group them by top-level module and write them to separate files (e.g., `01-screens-auth.md`, `01-screens-catalog.md`), then create an index file `01-screens.md`.**
>
> For each screen record: a short ID (S-01, S-02...), name, route/path, what area it belongs to (auth, dashboard, settings, admin, etc.), and one-sentence purpose. Note the routing approach and any route guards. Include **graph evidence** per `<investigator_root>/schemas/graph-evidence.md` for each screen row when the snapshot is available; otherwise `FALLBACK:` + gap.
>
> Write to `<output_path>/_work/analysis/01-screens.md` following the schema in `<investigator_root>/schemas/analysis-screens.md`.

**Agent 1.2b — API Discovery** *(skip if `1.2b` is `[x]`)*:

> Read `<output_path>/_work/graph/manifest.json` if present; use GitNexus / Graphify to locate route handlers and controllers when possible. Read `<output_path>/_work/analysis/00-architecture.md`.
>
> Search `<source_path>` for all API endpoints in `routes/`, `controllers/`, `api/`, OpenAPI specs. Use `find . -type f -name '*controller*'` or `grep -r`.
>
> **CRITICAL: You must list EVERY SINGLE API endpoint found in the codebase. Do not truncate the list. However, if the architecture analysis identified this as a legacy monolith without APIs, do not hallucinate APIs. Simply state "No APIs found (Legacy Monolith)" in the output and stop.**
> **If you detect more than 50 APIs, group them by top-level module and write them to separate files (e.g., `02-apis-users.md`), then create an index file `02-apis.md`.**
>
> For each endpoint record: method (GET/POST/etc.), path, feature area, whether auth is required, and one-sentence purpose. Note the base URL pattern, auth mechanism (JWT, session, API key, OAuth), and response format conventions. Include **graph evidence** per `<investigator_root>/schemas/graph-evidence.md` when available.
>
> Write to `<output_path>/_work/analysis/02-apis.md` following the schema in `<investigator_root>/schemas/analysis-apis.md`.

**Agent 1.2c — Database / Entity Discovery** *(skip if `1.2c` is `[x]`)*:

> Read `<output_path>/_work/graph/manifest.json` if present. Read `<output_path>/_work/analysis/00-architecture.md`.
>
> Search for data models, entities, and schemas in `models/`, `entities/`, `migrations/`, ORM files. Use `find` and `grep` if needed.
>
> **CRITICAL: You must list EVERY SINGLE database entity found in the codebase. Do not truncate the list, summarize, or stop after a few examples.**
> **If you detect more than 50 entities, group them by module and write to separate files, then create an index file `03-database.md`.**
>
> For each entity record: name, table/collection name, one-sentence purpose, key fields (name + type), and relationships (hasMany, belongsTo, manyToMany). Note the DBMS, ORM, and any data patterns (soft delete, audit timestamps, UUID vs. integer PKs). Include **graph evidence** when available per `<investigator_root>/schemas/graph-evidence.md`.
>
> Write to `<output_path>/_work/analysis/03-database.md` following the schema in `<investigator_root>/schemas/analysis-database.md`.

**Agent 1.2d — Worker & Event Discovery** *(skip if `1.2d` is `[x]`)*:

> Read `<output_path>/_work/graph/manifest.json` if present. Read `<output_path>/_work/analysis/00-architecture.md`.
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

### Step 1.2e — Module / package dependencies (parallel by cluster + merge)

**Skip if** step `1.2e` is `[x]`.

This step runs **after** 1.2a–d and **before** 1.3 (do not read `04-features.md` yet).

Read `<output_path>/_work/graph/manifest.json`, GitNexus cluster/process resources (if available), Graphify `graph.json` / report, and discovery files `00-architecture.md`, `01-screens.md`, `02-apis.md`, `03-database.md`.

Spawn one **Explore** sub-agent **per coarse cluster** (GitNexus cluster or Graphify community; cap **max 8** parallel). Each agent writes **only** to a unique partial file, e.g. `<output_path>/_work/analysis/_partials/module-deps-cluster-<slug>.md`.

Each cluster agent task:

> Extract **directed** module or package dependency edges involving files in this cluster vs other clusters (imports, calls, extends). Every edge must list **Evidence** using `<investigator_root>/schemas/graph-evidence.md`. Write partial to your assigned file only.

After all cluster agents complete, spawn one **general-purpose** merge agent:

> Merge all partials into `<output_path>/_work/analysis/05-module-dependencies.md` following `<investigator_root>/schemas/analysis-module-dependencies.md`. Deduplicate edges; preserve evidence. Add Mermaid package diagram if helpful.

Mark step `1.2e` `[x]` in `progress.md`.

---

### Step 1.3 — Feature List & Dependency Graph (serial)

**Skip if** `1.3` is `[x]`.

Spawn one **general-purpose** sub-agent:

> Read all analysis files in `<output_path>/_work/analysis/`: `00-architecture.md`, `01-screens.md` (and any split files), `02-apis.md` (and split files), `03-database.md` (and split files), `03b-workers.md` (if present), and **`05-module-dependencies.md`**.
>
> Group screens, APIs, entities, and workers into logical **features** — business capabilities that a user or actor can exercise. Examples: "User Authentication", "Product Catalog", "Order Management", "Admin Dashboard".
>
> **CRITICAL:** Ensure every single screen, API, entity, and worker discovered in the previous steps is assigned to at least one feature. Do not leave any orphans behind. Use **module IDs** from `05-module-dependencies.md` to justify cross-feature technical dependencies where they clarify ordering.
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
> Document the following separately:
> 
> **Screens** (user flow, UI actions, validations)
> **APIs** (request/response specs, business rules)
> **Entities** (fields, relationships)
>
> Combine findings into `<output_path>/_work/analysis/features/f-XX-<slug>.md` following `<investigator_root>/schemas/analysis-feature-detail.md`.

After each batch completes, mark each feature's step `[x]` in `progress.md`, then start the next batch.

---

## Phase 2 — SRS Generation

**Skip entire phase if** all Phase 2 steps are `[x]` and `--force` not set.
**Prerequisite:** Phase 1 must be fully complete (all `[x]`). If `progress.md` includes Phase 0, Phase 0 must also be `[x]`. Enforce this check.

To execute Phase 2, load and strictly follow the instructions in `<investigator_root>/phases/phase-2-srs.md`. Provide it with `<source_path>`, `<output_path>`, `<investigator_root>`, and `<template_path>`. **Also provide** `<output_path>/_work/graph/manifest.json` path and require adherence to `<investigator_root>/document-dependencies.yaml` for step ordering and parallel waves.

---

## Phase 3 — Basic Design Generation

**Skip entire phase if** all Phase 3 steps are `[x]` and `--force` not set.
**Prerequisite:** Phase 2 must be fully complete. Enforce this check.

To execute Phase 3, load and strictly follow the instructions in `<investigator_root>/phases/phase-3-basic-design.md`. Provide it with `<source_path>`, `<output_path>`, `<investigator_root>`, and `<template_path>`. **Also provide** the graph manifest path and `<investigator_root>/document-dependencies.yaml` for DAG-safe parallelism.

---

## Completion

After all requested phases complete, write a summary to the user:

```
gen-doc complete

  Source:       <source_path>
  Output:       <output_path>

  Phase 0 — Graph snapshot  [complete / skipped / partial]
  Phase 1 — Analysis        [complete / skipped / partial]
  Phase 2 — SRS             [complete / skipped / partial]
  Phase 3 — Basic Design    [complete / skipped / partial]

  Graph:        <manifest.json path + commit SHA + backends used or skipped>

  Generated files:
    _work/graph/          manifest + tool outputs
    srs/                  <N> files
    basic-design/         <N> files

  Gaps & Assumptions:
    <list items added to progress.md during this run, or "none">

  To continue:
    /gen-doc srs <source_path>      generate SRS from existing analysis
    /gen-doc design <source_path>   generate Basic Design from existing SRS
    /gen-doc all <source_path> --force   re-run everything from scratch
```
