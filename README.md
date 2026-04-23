# doc-generator

An AI-powered technical documentation generator skill for your IDE (Cursor / Claude). It automatically analyzes your source code repository and generates a Software Requirements Specification (SRS) and Basic Design documents using a three-phase pipeline with parallel sub-agents.

## Installation

You can install the package globally using npm:

```bash
npm install -g doc-generator
```

*(Alternatively, you can run it directly without installing via `npx doc-generator init`)*

## 🛠️ Setup & Quick Start Guideline

Follow these steps to generate documentation for any project using Cursor or Claude.

### Step 1: Initialize the Skill
Navigate to your project directory in your terminal and run the installer:

```bash
cd /path/to/your/project
npx doc-generator init
```
*Note: This creates `.cursor`, `.claude`, and `.source-investigator` hidden folders containing the AI prompts and templates.*

### Step 2: Open Your AI IDE
Open the project directory in your compatible IDE (Cursor or Claude Desktop).

### Step 3: Trigger the Documentation Generation
Open the AI chat window (e.g., `Cmd+L` in Cursor) and invoke the skill by typing:

```text
/gen-doc ./src
```
*(Replace `./src` with the actual path to your source code folder. If you forget to provide a path, the AI will nicely remind you!)*

---

## 💻 Advanced Commands

If you want more control over the generation pipeline, you can run specific phases:

```text
/gen-doc <source_path>                    # Run the full pipeline (default)
/gen-doc all <source_path>                # Run the full pipeline (explicit)
/gen-doc analyze <source_path>            # Phase 1 only: analyze source code
/gen-doc srs <source_path>               # Phase 2 only: generate SRS
/gen-doc design <source_path>            # Phase 3 only: generate Basic Design
```

**Options:**
- `--output <path>`: Specify an output directory (default is `./docs/<project-name>`)
- `--force`: Re-run the requested phase even if it is already complete
- `--type <auto|modern|legacy>`: Specify the architecture type (default: `auto`). If `auto`, the AI will detect if the codebase is modern or legacy during the analysis phase and adapt its strategy automatically.

### Phases Breakdown

1. **Phase 1: Source Analysis (Bottom-Up)**
   Analyzes the architecture, discovers all screens, APIs, and database entities, and maps them to high-level features.
2. **Phase 2: SRS Generation**
   Generates a comprehensive Software Requirements Specification based on the analysis.
3. **Phase 3: Basic Design Generation**
   Produces detailed screen maps, API lists, database schemas, and detail documents for each component.

Progress is automatically saved to disk. If the process is interrupted, you can safely resume it later!

## License

ISC
