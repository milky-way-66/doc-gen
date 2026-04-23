# Phase 2 — SRS Generation

**Variables required by the adapter:**
- `{source_path}` — absolute path to source code root
- `{output_path}` — absolute path to output directory
- `{investigator_root}` — absolute path to `.source-investigator/`
- `{template_path}` — absolute path to `.source-investigator/templates/`

**Skip entire phase if** all Phase 2 steps are `[x]` in progress.md (unless `--force`).
**Prerequisite:** All Phase 1 steps must be `[x]`. If not, stop and tell the user to run analysis first.

**Golden rule:** Only document what is evidenced in the source code and analysis.
Do not invent requirements. When something cannot be determined, write:
`**TBD** — Could not be determined from source code. Requires stakeholder input.`
and add the gap to `{output_path}/_work/progress.md` under "Gaps & Assumptions".

> Writing guidance: `{investigator_root}/guides/guide-srs.md`
> Templates: `{template_path}/srs/`
> Input: `{output_path}/_work/analysis/`

---

## Step 2.1 — Foundation

**Skip if** step `2.1` is `[x]`.
**Worker type:** general-purpose
**Runs:** serial (sections 1–2 are the foundation for all other sections)

**Task:**

> Using the analysis files in `{output_path}/_work/analysis/`,
> generate SRS sections 1 and 2.
>
> **Section 1 — Introduction:**
> Product name and one-paragraph purpose (from 00-architecture.md),
> document version (1.0 Draft), intended audience (developers, PMs, QA,
> business analysts), scope (what the system does AND does not do),
> definitions/acronyms for all technical terms and abbreviations
> found in the codebase.
>
> **Section 2 — Overall Description:**
> Product perspective (standalone or part of a larger ecosystem),
> user classes derived from screen roles and API auth levels
> (e.g., Admin, Customer, API Consumer) with their technical sophistication,
> operating environment (OS, browser targets, runtime versions from config),
> design constraints (framework choices, third-party lock-in),
> assumptions and dependencies.
>
> Templates: `{template_path}/srs/1-introduction.md`,
>            `{template_path}/srs/2-overall-description.md`
> Output: `{output_path}/srs/01-introduction.md`,
>         `{output_path}/srs/02-overall-description.md`
>
> Refer to `{investigator_root}/guides/guide-srs.md` for writing guidance.

**After completion:** mark step `2.1` `[x]` in progress.md.

---

## Step 2.2 — Core Sections

**Skip sub-steps already `[x]`.** Remaining sub-steps run in parallel.
**Worker type:** general-purpose (one worker per sub-step)

### Step 2.2a — Use Cases (Section 3)

**Task:**

> Using feature deep dives in `{output_path}/_work/analysis/features/`
> and `{output_path}/_work/analysis/01-screens.md`, generate:
> - Use case index: `{output_path}/srs/03-use-cases.md`
> - One detail file per use case: `{output_path}/srs/03-use-cases/uc-XX-<slug>.md`
>
> One use case = one user goal (e.g., "Register Account", "Place Order").
> Derive from screen user flows in feature deep-dives.
> Include: use case diagram (Mermaid), actor list, preconditions,
> main flow, alternative flows, error flows, postconditions.
>
> Templates: `{template_path}/srs/3-use-cases.md`,
>            `{template_path}/srs/3-use-case-detail-template.md`
>
> Refer to `{investigator_root}/guides/guide-srs.md` (Section 3 tips).

### Step 2.2b — System Features (Section 4)

**Task:**

> Using `{output_path}/_work/analysis/04-features.md` and all feature
> deep dives, generate:
> - Feature list: `{output_path}/srs/04-system-features.md`
> - One detail file per feature: `{output_path}/srs/04-system-features/f-XX-<slug>.md`
>
> Use the same F-XX IDs from 04-features.md (never create new IDs).
> Feature details must include: functional requirements (numbered FR-XX-YY),
> acceptance criteria, priority, user story, related use case IDs, and edge cases.
>
> Templates: `{template_path}/srs/4-system-features-list-template.md`,
>            `{template_path}/srs/4-system-feature-detail-template.md`

### Step 2.2c — Data Requirements (Section 5)

**Task:**

> Using `{output_path}/_work/analysis/03-database.md` and feature deep dives,
> generate `{output_path}/srs/05-data-requirements.md`.
>
> Include: ER diagram (Mermaid erDiagram syntax), data dictionary
> (every entity and every field), data retention policies (if evidenced),
> PII/sensitive field flags.
>
> Template: `{template_path}/srs/5-data-requirements.md`

### Step 2.2d — External Interfaces (Section 6)

**Task:**

> Using `{output_path}/_work/analysis/00-architecture.md` and `02-apis.md`,
> generate `{output_path}/srs/06-external-interfaces.md`.
>
> Sections: (1) User Interfaces — UI standards and conventions found in codebase;
> (2) Software Interfaces — all third-party APIs/SDKs integrated;
> (3) Hardware Interfaces — if any;
> (4) Communication Interfaces — protocols, data formats, API versioning strategy.
>
> Template: `{template_path}/srs/6-external-interfaces.md`

**After all sub-steps complete:** mark each finished step `[x]` in progress.md.

---

## Step 2.3 — Quality & Supplemental Sections

**Skip sub-steps already `[x]`.** Remaining sub-steps run in parallel.
**Worker type:** general-purpose (one worker per sub-step)

### Step 2.3a — Quality Attributes (Section 7)

**Task:**

> Infer non-functional requirements from the codebase:
> caching → performance, rate limiting → scalability,
> auth guards → security, retry logic → reliability.
>
> Generate `{output_path}/srs/07-quality-attributes.md`.
> Template: `{template_path}/srs/7-quality-attributes.md`
>
> Refer to `{investigator_root}/guides/guide-srs.md` (Section 7 tips).

### Step 2.3b — Internationalization (Section 8)

**Task:**

> Search `{source_path}` for i18n signals: locale config files,
> translation JSON/YAML, i18next / vue-i18n / flutter_localizations,
> date-fns locale, currency formatting (Intl.NumberFormat).
>
> Generate `{output_path}/srs/08-internationalization.md`.
> Template: `{template_path}/srs/8-internationalization.md`

### Step 2.3c — Other Requirements (Section 9)

**Task:**

> Look for: LICENSE file (legal), `.env` variables (configuration),
> logging frameworks (monitoring), audit trail patterns,
> compliance markers (GDPR, HIPAA, PCI-DSS comments or config).
>
> Generate `{output_path}/srs/09-other-requirements.md`.
> Template: `{template_path}/srs/9-other-requirements.md`

**After all sub-steps complete:** mark each `[x]` in progress.md.
