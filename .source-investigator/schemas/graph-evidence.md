# Schema: graph evidence citations

Any Phase 1 **materialized view** row, module edge, or narrative claim that is grounded in the graph snapshot **must** cite evidence using one of the prefixes below. Plain grep without graph grounding is a **fallback** only — mark those lines with `FALLBACK:` and add an entry to `_work/progress.md` → **Gaps & Assumptions**.

---

## Citation prefixes

| Prefix | Meaning | Example |
|--------|---------|---------|
| `GN:` | GitNexus-backed (symbol, file, process, or Cypher-derived) | `GN:Function:src/api/users.ts#getUser` |
| `GF:` | Graphify node or cluster | `GF:node:abc123` or `GF:cluster:auth` |
| `FILE:` | Repo-relative file with optional line (always valid) | `FILE:src/app/page.tsx:12` |

Combine with free text in parentheses if needed:

`GN:Class:packages/core/Order.ts#Order (implements payment interface)`

---

## Rules

1. **No orphan claims** — A row in `01-screens.md`, `02-apis.md`, etc. that states a behavioral fact should include at least one `GN:`, `GF:`, or `FILE:` reference when the graph snapshot was available for that fact.
2. **Symbol-level disputes** — If GitNexus and Graphify disagree on neighbors for the same path, cite **both** and add a gap: `Graph mismatch: <path> — GN vs GF neighbor sets differ`.
3. **When snapshot missing** — Use `FALLBACK:FILE:...` only and log the gap `Graph snapshot unavailable for step X`.

---

## Module dependency edges

In [`analysis-module-dependencies.md`](analysis-module-dependencies.md), every **edge** row must include an **Evidence** column using `GN:` / `GF:` / `FILE:` (or explicit `FALLBACK:`).
