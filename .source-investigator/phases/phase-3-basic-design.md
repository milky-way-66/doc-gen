# Phase 3 — Basic Design Generation

**Variables required by the adapter:**
- `{source_path}` — absolute path to source code root
- `{output_path}` — absolute path to output directory
- `{investigator_root}` — absolute path to `.source-investigator/`
- `{template_path}` — absolute path to `.source-investigator/templates/`

**Skip entire phase if** all Phase 3 steps are `[x]` in progress.md (unless `--force`).
**Prerequisite:** All Phase 2 steps must be `[x]`. If not, stop and tell the user to run SRS generation first.

> Writing guidance: `{investigator_root}/guides/guide-basic-design.md`
> Templates: `{template_path}/basic_design/`
> Input: `{output_path}/srs/` + `{output_path}/_work/analysis/`

---

## Step 3.1 — Screen Map & API List

**Skip sub-steps already `[x]`.** Both sub-steps run in parallel.
**Worker type:** general-purpose (one worker per sub-step)

### Step 3.1a — Screen Map

**Task:**

> Using `{output_path}/srs/03-use-cases/`,
> `{output_path}/srs/06-external-interfaces.md`,
> and `{output_path}/_work/analysis/01-screens.md`,
> generate `{output_path}/basic-design/screen-map.md`.
>
> Include:
> 1. **Design System** — color palette, typography, spacing
>    (infer from Tailwind config, CSS variables, theme files;
>    or mark as TBD if not present in source)
> 2. **Navigation Flow Diagram** — Mermaid flowchart showing all screens
>    and their transitions with labeled arrows (the trigger: "click Login",
>    "submit form", "guard: unauthenticated", etc.)
> 3. **Screen Index** — table with ID, name, route, user role, feature area,
>    and link to the detail file
>
> Template: `{template_path}/basic_design/list-screen-template.md`
> Refer to `{investigator_root}/guides/guide-basic-design.md`
> (Screen Map section) for diagram rules.

### Step 3.1b — API List

**Task:**

> Using `{output_path}/srs/04-system-features/`,
> `{output_path}/srs/06-external-interfaces.md`,
> and `{output_path}/_work/analysis/02-apis.md`,
> generate `{output_path}/basic-design/api-list.md`.
>
> Include:
> 1. **API Overview** — base URL, protocol, auth mechanism, content type, versioning
> 2. **Authentication** — how to authenticate, token format, refresh flow
> 3. **Endpoint Summary Table** — method, path, feature, auth required,
>    brief description, link to detail file
>
> Template: `{template_path}/basic_design/list-api-template.md`

**After both sub-steps complete:** mark `3.1a` and `3.1b` `[x]` in progress.md.

---

## Step 3.2 — Detail Documents

**Skip sub-steps already `[x]`.**
**Worker type:** general-purpose

Group items by feature. Spawn one worker per feature.
Maximum 5 workers in parallel — if more than 5 features, process in batches of 5.

### Step 3.2a — Screen Details

**Task per feature** (substitute `<F-XX>` and `<feature-slug>`):

> For feature `<F-XX>`, generate detail files for each of its screens at
> `{output_path}/basic-design/screens/<feature-slug>/screen-<screen-slug>.md`.
>
> Per screen include:
> - Purpose and user role (SRS reference)
> - ASCII wireframe showing layout structure
> - Component inventory table (component name / type / behavior / SRS requirement ID)
> - State & interaction table (user action → system response → outcome)
> - Validation rules (field-by-field)
> - Error states with exact messages
> - Cross-references to SRS use case IDs
>
> Template: `{template_path}/basic_design/detail-screen-template.md`
> Refer to `{investigator_root}/guides/guide-basic-design.md`
> (Screen Detail section) for wireframe rules.

### Step 3.2b — API Details

**Task per feature** (substitute `<F-XX>` and `<feature-slug>`):

> For feature `<F-XX>`, generate detail files for each of its endpoints at
> `{output_path}/basic-design/apis/<feature-slug>/api-<method>-<slug>.md`.
>
> Per endpoint include:
> - Full request spec: path params, query params (type/default/required),
>   headers, body schema with field-level validation rules
> - Full response spec: success schema, all error codes with messages
>   and when they occur
> - JSON examples (request and response)
> - Business rules enforced (numbered list)
> - Auth flow
> - Cross-references to SRS feature IDs
>
> Template: `{template_path}/basic_design/detail-api-template.md`
> Refer to `{investigator_root}/guides/guide-basic-design.md`
> (API Detail section) for format rules.

**After all batches complete:** mark `3.2a` and `3.2b` `[x]` in progress.md.

---

## Step 3.3 — Database Design

**Skip if** step `3.3` is `[x]`.
**Worker type:** general-purpose
**Runs:** serial

**Task:**

> Using `{output_path}/srs/05-data-requirements.md`
> and `{output_path}/_work/analysis/03-database.md`,
> generate `{output_path}/basic-design/db-design.md`.
>
> Include:
> 1. **Overview** — DBMS, ORM, purpose summary
> 2. **Complete ER Diagram** — Mermaid erDiagram syntax,
>    every table and every relationship
> 3. **Table-by-Table Breakdown** — for every table:
>    all columns (name, data type, nullable, default, constraints,
>    business description), index inventory (column + reason),
>    foreign key relationships
> 4. **Relationships Narrative** — describe the most important joins
>    in plain language
> 5. **Data Patterns** — soft delete, audit timestamps, JSONB usage,
>    partitioning, multi-tenancy, etc.
>
> Template: `{template_path}/basic_design/db-design-template.md`
> Refer to `{investigator_root}/guides/guide-basic-design.md`
> (Database Design section) for format rules.

**After completion:** mark step `3.3` `[x]` in progress.md.
