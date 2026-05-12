# doc-writer

An AI-powered technical documentation generator skill for your IDE (Cursor / Claude). It analyzes your repository using a **graph-first** pipeline: **GitNexus** and **Graphify** are indexed into a frozen snapshot under `docs/.../_work/graph/`, analysis views are written with graph evidence, then **SRS** and **Basic Design** documents are generated following the machine-defined DAG in [`.source-investigator/document-dependencies.yaml`](.source-investigator/document-dependencies.yaml). Parallel sub-agents are used where the DAG and phase files allow.

## Prerequisites (target repo)

| Tool | Role |
|------|------|
| **Git** | `source_path` must live inside a git work tree (for commit SHA + `git rev-parse --show-toplevel`). |
| **GitNexus** | `npx gitnexus analyze` at repo root (optional if you use `--graph-backend graphify` only). MCP is optional; a mirror under `_work/graph/gitnexus/` supports offline phases. |
| **Graphify** | Python CLI per [Graphify](https://github.com/safishamsi/graphify) (optional if you use `--graph-backend gitnexus` only). |

## Installation

You can install the package globally using npm:

```bash
npm install -g doc-writer
```

*(Alternatively, you can run it directly without installing via `npx doc-writer init`)*

## Setup and quick start

### Step 1: Initialize the skill

Navigate to your project directory in your terminal and run the installer:

```bash
cd /path/to/your/project
npx doc-writer init
```

*This copies `.cursor`, `.claude`, and `.source-investigator` (skills, phases, schemas, and `document-dependencies.yaml`) into your project.*

### Step 2: Open your AI IDE

Open the project directory in Cursor or Claude.

### Step 3: Generate documentation

In chat, use one primary command (path = folder to analyze):

```text
/gen-doc ./src
```

*(Replace `./src` with the path you want documented. If you omit the path, the skill will ask for it.)*

---

## Advanced commands

```text
/gen-doc <source_path>                     # Full pipeline: Phase 0–3 (default)
/gen-doc all <source_path>                 # Same, explicit
/gen-doc analyze <source_path>             # Phase 0 + Phase 1 only
/gen-doc srs <source_path>                 # Phase 2 only (requires completed analysis)
/gen-doc design <source_path>              # Phase 3 only (requires completed SRS)
```

**Options**

- `--output <path>` — Output root (default: `./docs/<folder-name>`).
- `--force` — Re-run the requested phase; `analyze` + `--force` resets **Phase 0 and Phase 1**.
- `--skip-graph-refresh` — Skip `npx gitnexus analyze` and Graphify rebuild; requires an existing `_work/graph/manifest.json` under the output tree.
- `--graph-backend both|gitnexus|graphify` — Default `both`. Skipped backends are stubbed in the manifest and noted under **Gaps & Assumptions**.
- `--type <auto|modern|legacy>` — Still honored by the router when you add it; architecture detection defaults to **auto** via `/gen-doc`.

### Phases (high level)

0. **Graph index** — GitNexus analyze, Graphify export, `manifest.json` (graph identity for the run).
1. **Source analysis** — Architecture, screens, APIs, entities, workers, **module dependencies**, features, deep dives (graph-evidenced where possible).
2. **SRS** — Requirements aligned to analysis + graph traceability.
3. **Basic design** — Screen/API/DB design from SRS + analysis.

Progress is stored in `<output>/_work/progress.md`. You can resume after interruption.

### Contracts for contributors

- **Graph evidence:** [`.source-investigator/schemas/graph-evidence.md`](.source-investigator/schemas/graph-evidence.md)
- **Document DAG:** [`.source-investigator/document-dependencies.yaml`](.source-investigator/document-dependencies.yaml)

## License

ISC
