# Graph bootstrap guide (Phase 0)

Instructions for freezing **GitNexus** and **Graphify** outputs into `{output_path}/_work/graph/` before Phase 1. Read this before running Phase 0 steps in [`../phases/phase-0-graph.md`](../phases/phase-0-graph.md).

---

## Goals

1. Produce a **durable snapshot** under `_work/graph/` so later phases do not depend on live MCP (GitNexus) or a global index alone.
2. Write **`manifest.json`** that identifies the run: git commit, tool versions, backend mode, and artifact paths — the **graph identity** for this doc generation run.
3. Respect **split authority** when both backends are used: symbol-level / process queries prefer GitNexus; structural / community exports prefer Graphify. Disagreements are logged in `_work/progress.md` → **Gaps & Assumptions**, not silently merged.

---

## Prerequisites

| Requirement | Notes |
|-------------|--------|
| Git repository | `source_path` must resolve inside a git work tree (`git rev-parse --show-toplevel`). |
| GitNexus (optional if `--graph-backend graphify`) | `npx gitnexus analyze` from **repository root** (not necessarily the same as `source_path` if that is a subfolder). |
| Graphify CLI (optional if `--graph-backend gitnexus`) | Python install per [Graphify](https://github.com/safishamsi/graphify); run ingest/build/export scoped to the analyzed tree. |
| Network | May be needed for `npx` / embedding flags; document gaps if offline. |

---

## Directory layout (`{output_path}/_work/graph/`)

After Phase 0 completes, expect:

```
_work/graph/
  manifest.json           # required — graph identity + paths
  gitnexus/               # when GitNexus ran: mirror or pointer metadata (see phase-0-graph.md)
  graphify/
    graph.json            # or tool-default export name
    GRAPH_REPORT.md       # when Graphify produced a report
```

Exact filenames for Graphify exports may vary by CLI version; **`manifest.json` must list the actual paths** written.

---

## `manifest.json` schema (v1)

Top-level object (JSON):

| Field | Type | Description |
|-------|------|-------------|
| `version` | number | Schema version; use `1`. |
| `createdAt` | string | ISO-8601 timestamp. |
| `repoRoot` | string | Absolute path from `git rev-parse --show-toplevel`. |
| `sourcePath` | string | Absolute `source_path` passed to gen-doc. |
| `repoCommit` | string | Full SHA from `git rev-parse HEAD` at `repoRoot`. |
| `graphBackend` | string | `both` \| `gitnexus` \| `graphify`. |
| `gitnexus` | object \| null | `skipped` (bool), `analyzeCommand` (string), `indexPath` (string, e.g. path under `.gitnexus/`), `mirroredTo` (string under `_work/graph/gitnexus/` if copied). |
| `graphify` | object \| null | `skipped` (bool), `cliVersion` (string or `"unknown"`), `exportDir` (string), `artifacts` (string[] relative paths under `_work/graph/`). |
| `conflictPolicy` | string | Short fixed text: symbol truth = GitNexus; coarse structure = Graphify; log disagreements. |

If a backend is skipped (`--graph-backend`), set its block to `{ "skipped": true, "reason": "..." }` and add a gap under **Gaps & Assumptions**.

---

## Failure modes

| Situation | Action |
|-----------|--------|
| Not a git repo | Stop Phase 0; log gap; do not claim graph-backed evidence in Phase 1. |
| GitNexus analyze fails | Log gap; if backend is `gitnexus` or `both`, set `gitnexus.skipped` and gap; continue only if policy allows degraded run. |
| Graphify missing / fails | Same pattern for `graphify` / `both`. |
| `--skip-graph-refresh` and no valid `manifest.json` | Stop immediately with a clear message: run full analyze once without skip. |
| MCP unavailable | Phase 1+ must use **mirrored** `.gitnexus/` data under `_work/graph/gitnexus/` per snapshot; do not assume MCP. |

---

## Cross-references

- Phase steps: [`../phases/phase-0-graph.md`](../phases/phase-0-graph.md)
- Evidence citations in analysis: [`../schemas/graph-evidence.md`](../schemas/graph-evidence.md)
- Document DAG: [`../document-dependencies.yaml`](../document-dependencies.yaml)
