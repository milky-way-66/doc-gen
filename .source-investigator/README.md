# Source Investigator Core

Shared, tool-agnostic documentation generation workflow.

This folder contains the common phase logic used by multiple adapters:

- Cursor skill adapter: `.cursor/skills/gen-doc/SKILL.md`
- Cursor rule adapter: `.cursor/rules/gen-doc.mdc`

The goal is to keep business logic in one place and keep each tool adapter thin.

## Folder Structure

```text
.source-investigator/
  phases/
    phase-1-analyze.md
    phase-2-srs.md
    phase-3-basic-design.md
  guides/      # optional shared writing guidance files
  schemas/     # optional shared output schemas
```

## Design Principles

1. Keep orchestration rules and output contracts independent from any single tool.
2. Use placeholders in shared phase files, resolved by adapters at runtime:
   - `{source_path}`
   - `{output_path}`
   - `{investigator_root}`
   - `{template_path}`
3. Track progress in `{output_path}/_work/progress.md` and support resume.
4. Keep steps deterministic and idempotent (safe to skip completed steps).

## Adapter Responsibilities

Each adapter should:

1. Parse user command arguments.
2. Resolve variables and substitute placeholders in phase prompts.
3. Enforce prerequisites between phases.
4. Execute parallel and serial steps according to phase definitions.
5. Update progress markers after every completed step.

Shared phase files should not include tool-specific syntax such as
tool frontmatter, command aliases, or model-specific instructions.

## Current Status

- Shared phase definitions are available in `phases/`.
- Shared guides and schemas live in this folder and are referenced by the
  active adapter.

## Migration Plan

1. Keep guidance files in `.source-investigator/guides/`.
2. Keep schema files in `.source-investigator/schemas/`.
3. Keep adapter references pointing at shared paths.

