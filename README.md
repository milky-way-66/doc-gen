# gen-doc-skill

An AI-powered technical documentation generator skill for your IDE (Cursor / Claude). It automatically analyzes your source code repository and generates a Software Requirements Specification (SRS) and Basic Design documents using a three-phase pipeline with parallel sub-agents.

## Installation

You can install the package globally using npm:

```bash
npm install -g gen-doc-skill
```

*(Alternatively, you can run it directly without installing via `npx gen-doc-skill`)*

## Setup in Your Project

To add the `gen-doc` skill to your current project, navigate to your project directory in your terminal and run:

```bash
install-gen-doc
```

This command will copy the necessary `.cursor`, `.claude`, and `.source-investigator` folders into your project workspace.

## Usage

Once installed, open your project in your compatible IDE (Cursor or Claude).

You can trigger the skill from your AI chat interface using the following commands:

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
