---
name: gen-doc
description: Automatically determines if a project is modern or legacy, and then generates technical documentation by delegating to the appropriate sub-skill.
argument-hint: <source_path> [--output <path>] [--force]
effort: low
---

# gen-doc — Technical Documentation Generator (Router)

This is a router skill. It determines the architecture of the project and then delegates to the appropriate specialized skill.

## Step 1 — Parse Arguments & Architecture Analysis

Parse the `$ARGUMENTS` to extract the `<source_path>` and any options.

**Validation:** If the user did not provide a `<source_path>` argument, STOP immediately. Reply to the user with: *"Please provide the path to the source code directory you want to document. Example: `/gen-doc ./src`"*

> Read the source code at `<source_path>`. Examine the top-level directories, routing setup, and files. 
> Determine if the architecture is:
> 1. **MODERN**: Uses modern frameworks (React, Vue, Next.js), separate API/Controllers, ORM models, or SPA structures.
> 2. **LEGACY**: Uses server-rendered monolithic routing (e.g., raw `.php` or `.asp` files serving HTML directly in public folders), mixed UI/DB logic, or lacks an MVC framework.

## Step 2 — Delegate

Based on your determination, immediately pivot and invoke the appropriate specialized skill, passing along the exact same arguments you received.

**If MODERN:**
Say: *"I have detected a modern architecture. I will now run the modern documentation generator."*
Then execute the skill: `/gen-doc-modern <source_path> [--output <path>] [--force]`

**If LEGACY:**
Say: *"I have detected a legacy monolithic architecture. I will now run the specialized legacy documentation generator."*
Then execute the skill: `/gen-doc-legacy <source_path> [--output <path>] [--force]`
