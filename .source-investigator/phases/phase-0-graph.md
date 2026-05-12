# Phase 0 — Graph bootstrap (GitNexus + Graphify)

**Variables required by the adapter:**

- `{source_path}` — absolute path to source code root (may be a subfolder of the repo)
- `{output_path}` — absolute path to output directory
- `{investigator_root}` — absolute path to `.source-investigator/`
- `{repo_root}` — absolute path from `git rev-parse --show-toplevel` (run at or above `source_path`)
- `{graph_backend}` — `both` | `gitnexus` | `graphify`
- `{skip_graph_refresh}` — boolean; when true, do not re-run indexing CLIs unless manifest is invalid

**Skip rules:**

- If `{skip_graph_refresh}` is true: require `{output_path}/_work/graph/manifest.json` to exist and be readable. If missing, **stop** with instructions to run once without `--skip-graph-refresh`. Optionally warn if `repoCommit` inside manifest ≠ current `git rev-parse HEAD`.
- If all Phase 0 steps are `[x]` in `progress.md` and `--force` is not set for this phase, skip entire Phase 0.

**Prerequisite reading:** `{investigator_root}/guides/guide-graph-bootstrap.md`

---

## Step 0.1 — GitNexus analyze

**Skip if** `0.1` is `[x]` and not forcing Phase 0, or if `{graph_backend}` is `graphify`.

**Worker type:** shell / terminal (or general-purpose with run capability)

**Task:**

1. `cd {repo_root}` and run `npx gitnexus analyze` (add `--force` if Phase 0 forced and full rebuild desired).
2. Ensure `{output_path}/_work/graph/` exists.
3. Copy or summarize GitNexus index metadata into `{output_path}/_work/graph/gitnexus/` as appropriate for offline use (e.g. copy key generated files from `.gitnexus/` or write a small `README.md` there listing paths under `.gitnexus/` that agents should read). **Do not** delete the live `.gitnexus/` in the repo.

**After completion:** mark `0.1` `[x]` in `progress.md`.

---

## Step 0.2 — Graphify build & export

**Skip if** `0.2` is `[x]` and not forcing Phase 0, or if `{graph_backend}` is `gitnexus`.

**Worker type:** shell / terminal

**Task:**

1. Run Graphify against the intended scope (prefer `{source_path}`; if the tool requires repo root, use `{repo_root}` and document scope in manifest).
2. Export artifacts into `{output_path}/_work/graph/graphify/` (e.g. `graph.json`, `GRAPH_REPORT.md` — exact names depend on CLI; record actual paths in manifest).

**After completion:** mark `0.2` `[x]` in `progress.md`.

---

## Parallelism

Steps **0.1** and **0.2** may run **in parallel** when `{graph_backend}` is `both`. When one backend is selected, run only that step and mark the other as skipped with manifest + gaps.

---

## Step 0.3 — Snapshot manifest

**Skip if** `0.3` is `[x]` and not forcing Phase 0 — unless manifest must be rewritten after 0.1/0.2 reran.

**Worker type:** general-purpose (short)

**DAG note:** `{investigator_root}/document-dependencies.yaml` lists `phase0.manifest` as requiring both `phase0.gitnexus` and `phase0.graphify`. When `{graph_backend}` is `gitnexus` or `graphify`, treat the **skipped** backend node as satisfied (see `backend_skip_rules` in that file) before considering Phase 0 complete.

**Task:**

1. Write `{output_path}/_work/graph/manifest.json` following `{investigator_root}/guides/guide-graph-bootstrap.md` → **manifest.json schema**.
2. Set `repoCommit` from current git HEAD at `{repo_root}`.
3. Record which backends ran vs skipped and real artifact paths.

**After completion:** mark `0.3` `[x]` in `progress.md`.

---

## Completion criteria

Phase 0 is complete when `0.3` is `[x]` and `manifest.json` exists. Downstream phases must read the manifest first.
