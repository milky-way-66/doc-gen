# SRS Generation Guide

This guide helps sub-agents write high-quality SRS sections from Phase 1 analysis outputs. Read this before generating any SRS section.

---

## Core Principle

**Document what exists, not what should exist.** Every requirement must trace back to something observed in the source code or analysis files. When you cannot determine something, write:

> **TBD** — Could not be determined from source code. Requires stakeholder input.

Add the gap to `_work/progress.md` under "Gaps & Assumptions".

---

## Mapping: Analysis → SRS Sections

| SRS Section | Primary Input | Secondary Input |
|------------|--------------|-----------------|
| 1 — Introduction | 00-architecture.md | — |
| 2 — Overall Description | 00-architecture.md, 04-features.md | — |
| 3 — Use Cases | features/f-XX.md (user flows) | 01-screens.md |
| 4 — System Features | 04-features.md, features/f-XX.md | — |
| 5 — Data Requirements | 03-database.md, features/f-XX.md (entities) | — |
| 6 — External Interfaces | 00-architecture.md (integrations), 02-apis.md | — |
| 7 — Quality Attributes | 00-architecture.md (patterns), source code signals | — |
| 8 — Internationalization | Source code search (i18n libs, locale config) | — |
| 9 — Other Requirements | .env config, license files, logging setup | — |

---

## Section-by-Section Writing Tips

### Section 1 — Introduction

- **Product Name**: use the name from `package.json` `name` field, or folder name if unclear.
- **Scope**: describe what the system does AND explicitly what it does not do (exclude scope helps prevent scope creep).
- **Definitions**: include every technical term, acronym, and domain term used in the analysis. When in doubt, define it.

### Section 2 — Overall Description

- **User Classes**: derive from screen roles and API auth levels. A screen only accessible by admins → Admin user class. Unauthenticated routes → Guest user class.
- **Operating Environment**: look for Node/Python/Java version in config, browser targets in `.browserslistrc` or `package.json` `browserslist`, Docker base images.
- **Design Constraints**: the choice of framework IS a constraint. Mention it. External auth providers, payment processors — these constrain how auth and payments work.

### Section 3 — Use Cases

**One use case = one user goal.** Not one screen, not one API call — one goal.

- Bad: "User sees the login page" (not a goal)
- Good: "User authenticates with email and password" (goal)

**Naming**: use verb + noun. "Register Account", "Place Order", "Generate Monthly Report".

**Use case IDs**: UC-01, UC-02... Keep stable. Add to the index table in `03-use-cases.md` before writing detail files.

**Main flow**: number every step. Start at the user's first action, end at the user's achieved goal. Keep steps at the intent level, not the UI-click level.
- Bad step: "User clicks the blue Submit button in the bottom right corner"
- Good step: "User submits the login form"

**Alternative flows**: "what if the user does X instead?" (e.g., clicks Forgot Password).
**Error flows**: "what if the system fails?" (e.g., invalid credentials, network timeout). Reference the exact error states documented in the feature deep-dive.

### Section 4 — System Features

**Feature IDs**: use the same F-XX IDs from `04-features.md`. Never create new IDs.

**Functional Requirements (FR)**: number them `FR-XX-YY` where XX = feature number, YY = requirement number within the feature.

Format each FR as: `The system shall <verb> <object> [condition].`
- Bad: "Login works"
- Good: "The system shall authenticate a user given valid email and password credentials."
- Good: "The system shall lock a user account after 5 consecutive failed login attempts within 15 minutes."

**Acceptance Criteria**: concrete, testable. "Given X, when Y, then Z."

**Priority**: derive from the dependency graph — features in Batch 1 are typically High priority (the system cannot work without them).

### Section 5 — Data Requirements

**ER Diagram**: use Mermaid `erDiagram`. Show every entity from `03-database.md` and every relationship.

**Data Dictionary**: document EVERY field for EVERY entity. Do not skip fields just because they seem obvious. The data dictionary is the authoritative reference.

**PII / Sensitive Data**: flag fields that store personal data (email, name, address, payment info). Note: "This field contains PII — must be handled per applicable privacy regulations."

### Section 6 — External Interfaces

**User Interfaces**: do NOT describe specific UI designs here — that belongs in Basic Design. Instead describe constraints: "The system must be accessible on screen widths ≥ 320px", "The system must support keyboard navigation".

**Software Interfaces**: for each third-party integration found in `00-architecture.md`, specify: name, version (if pinned in manifest), purpose, interface type (REST API / SDK / webhook / message queue), and authentication method.

### Section 7 — Quality Attributes

**Infer from code signals:**

| Code Signal | Quality Implication |
|------------|-------------------|
| Redis cache | Response time / performance requirement |
| Rate limiter middleware | Throughput / availability requirement |
| JWT with short expiry | Security requirement |
| Database indexes on FK columns | Performance requirement |
| Retry logic / circuit breaker | Reliability requirement |
| Test coverage > 80% | Maintainability requirement |
| Docker multi-stage build | Deployability requirement |

When you find a signal, write a concrete requirement: "The system shall respond to 95% of API requests within 500ms under normal load."

### Section 8 — Internationalization

**Signals to search for in source:**
- `i18next`, `react-intl`, `vue-i18n`, `flutter_localizations` in dependencies
- Locale config files (e.g., `i18n/`, `locales/`, `translations/`)
- `date-fns/locale`, `moment.locale()`, `Intl.DateTimeFormat`
- Currency formatting: `Intl.NumberFormat` with `style: 'currency'`

If none found: "No internationalization infrastructure detected in source. System appears to be English-only."

### Section 9 — Other Requirements

**Logging**: look for Winston, Pino, Log4j, Python logging, structured log patterns. Note what is logged (errors, auth events, user actions).

**Legal**: look for `LICENSE` file, cookie consent UI, GDPR deletion endpoints, privacy policy link.

**Configuration**: every non-secret environment variable in `.env.example` is an installation/configuration requirement.

---

## Quality Checklist

Before finishing any SRS section, verify:

- [ ] Every requirement is traceable to analysis evidence
- [ ] All TBD items are logged in `progress.md` Gaps section
- [ ] FR numbers are unique and follow `FR-XX-YY` format
- [ ] Use case IDs match the index in `03-use-cases.md`
- [ ] Feature IDs match `04-features.md` exactly
- [ ] Mermaid diagrams are syntactically correct (test mentally)
- [ ] No future-tense wishful thinking — only what the code actually does
