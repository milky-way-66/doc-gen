# Schema: 00-architecture.md

Output file for Step 1.1 — Architecture Overview.

---

```markdown
# Architecture Overview

**Analyzed:** <ISO datetime>
**Source Path:** <absolute path>

## Project Identity

| Field | Value |
|-------|-------|
| Project Name | |
| One-line Purpose | |
| Project Type | web-app / REST API / mobile / CLI / library / monorepo |
| Primary Language(s) | |
| Primary Framework(s) | |
| Runtime / Platform | Node 20 / Python 3.12 / JVM 21 / etc. |

## Top-Level Directory Structure

```
<project-name>/
├── src/           # <one-line description>
├── tests/         # <one-line description>
└── ...
```

## Architectural Layers

| Layer | Directory / Package | Description |
|-------|-------------------|-------------|
| Frontend | | |
| Backend / API | | |
| Database | | |
| Background Workers | | |
| Infrastructure / Config | | |

## External Integrations

| Service | Purpose | Integration Method |
|---------|---------|-------------------|
| | | SDK / REST / Webhook |

## Notable Patterns

- <Pattern 1 — e.g., "JWT auth with refresh token rotation">
- <Pattern 2 — e.g., "Repository pattern for all DB access">

## Key Configuration

| Config Key | Location | Purpose |
|-----------|---------|---------|
| | .env.example | |
```
