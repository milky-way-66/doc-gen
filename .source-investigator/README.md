# Source Investigator Core

Shared, tool-agnostic documentation generation workflow.

This folder contains the common phase logic used by multiple adapters:

- Cursor skill adapter: `.cursor/skills/gen-doc/SKILL.md`
- Cursor rule adapter: `.cursor/rules/gen-doc.mdc` (if present)

The goal is to keep business logic in one place and keep each tool adapter thin.

## Folder Structure

```text
.source-investigator/
  document-dependencies.yaml   # machine-defined DAG: outputs + requires + parallel hints
  phases/
    phase-0-graph.md           # GitNexus + Graphify snapshot bootstrap
    phase-1-analyze.md
    phase-2-srs.md
    phase-3-basic-design.md
  guides/      # shared writing guidance (incl. guide-graph-bootstrap.md)
  schemas/     # output schemas (incl. graph-evidence, module-dependencies)
```

## Design Principles

1. Keep orchestration rules and output contracts independent from any single tool.
2. **Graph-first:** `_work/graph/manifest.json` identifies the frozen GitNexus + Graphify snapshot for a run; analysis files are materialized views with graph evidence when possible.
3. **Document DAG:** `document-dependencies.yaml` is the source of truth for which artifacts depend on which others; adapters must not start a node until `requires` are satisfied (with `backend_skip_rules` for optional graph backends).
4. Use placeholders in shared phase files, resolved by adapters at runtime:
   - `{source_path}`
   - `{output_path}`
   - `{investigator_root}`
   - `{template_path}`
5. Track progress in `{output_path}/_work/progress.md` and support resume.
6. Keep steps deterministic and idempotent (safe to skip completed steps).

## Adapter Responsibilities

Each adapter should:

1. Parse user command arguments (including `--skip-graph-refresh`, `--graph-backend`).
2. Resolve variables and substitute placeholders in phase prompts.
3. Enforce prerequisites between phases **and** the document DAG.
4. Execute parallel and serial steps according to phase definitions **and** `parallel_waves` in `document-dependencies.yaml`.
5. Update progress markers after every completed step.

Shared phase files should not include tool-specific syntax such as
tool frontmatter, command aliases, or model-specific instructions.

## Current Status

- Shared phase definitions are available in `phases/` (including Phase 0 graph bootstrap).
- Shared guides and schemas live in this folder and are referenced by the
  active adapter.

## Migration Plan

1. Keep guidance files in `.source-investigator/guides/`.
2. Keep schema files in `.source-investigator/schemas/`.
3. Keep adapter references pointing at shared paths.
4. When extending outputs, update `document-dependencies.yaml` in the same change.
