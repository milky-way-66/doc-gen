# Schema: 05-module-dependencies.md

Output file for **Step 1.2e — Module / package dependency materialization** (after discovery 1.2a–d, before feature grouping 1.3).

**Inputs:** `{output_path}/_work/graph/manifest.json`, graph exports under `_work/graph/`, GitNexus clusters/processes when available, Graphify communities when available, `{output_path}/_work/analysis/00-architecture.md`, and discovery files as needed for naming.

---

## Document structure

```markdown
# Module & package dependencies

**Materialized:** <ISO datetime>
**Graph identity:** see `_work/graph/manifest.json` (commit + backend versions)

## Summary

One short paragraph: layering (e.g. web vs domain vs infra), notable cycles or forbidden directions (evidence-backed only).

## Module register

| Module ID | Display name | Root paths (repo-relative) | Notes |
|-----------|--------------|---------------------------|-------|
| M-01 | Auth | `src/auth/`, `packages/auth/` | … |

## Dependency edges

Directed edges **A → B** means A depends on B (A imports or calls into B).

| From | To | Kind (import / call / extends / event) | Evidence |
|------|----|------------------------------------------|----------|
| M-02 | M-01 | import | GN:… ; GF:… |

**Evidence** must follow [graph-evidence.md](graph-evidence.md). Do not invent edges without evidence.

## Diagram (optional)

```mermaid
graph LR
  M01[M-01 Auth]
  M02[M-02 Orders]
  M02 --> M01
```

## Gaps

Bullets for unresolved graph coverage, unknown package boundaries, or backend skips.

```

---

## AI responsibilities

- **Name** modules (M-01…) and explain **business meaning** of dependency directions.
- **Aggregate** edges from graph primitives (IMPORTS, CALLS, communities); **never** assert an edge without Evidence column.

---

## Relation to Step 1.3

`04-features.md` should reference **module IDs** where they clarify cross-feature technical dependencies (e.g. “F-04 depends on F-01 because **M-Orders → M-Auth**”).
