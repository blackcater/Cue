# Coding Standards Design

## Context

This project is in its early stages, aggregating requirements from competitive analysis of docs/iOfficeAI_AionUi, docs/lukilabs_craft-agents-oss, docs/OpenSource03_harnss, docs/superset-sh_superset, and docs/openai_codex_app_docs.

We need a coding standards document that serves both:
- **Agents** (Claude Code, etc.) — rules must be concise and machine-readable for consistent code generation
- **Human developers** — rules need explanations, examples, and rationale for learning and adoption

## Decision

### Structure: Single Expansion Model

Two files only:

1. **`CLAUDE.md`** (inline, concise) — all rules embedded for quick Agent consumption
2. **`docs/architecture/coding-standards.md`** (detailed) — all rules with full explanations, examples, and rationale

### Scope

All major areas covered:

1. Directory & File Organization
2. Naming Conventions (files, variables, functions, classes, constants)
3. TypeScript / Type System
4. React Component Patterns
5. Electron Process Architecture (main/renderer/preload isolation)
6. State Management
7. Error Handling
8. Code Style (linting, formatting)
9. Git Commit Conventions

### Naming Conventions Summary

| Element              | Convention              | Example                   |
| -------------------- | ----------------------- | ------------------------- |
| Directories          | kebab-case              | `file-tree`, `chat-panel` |
| Component files      | PascalCase              | `ThreadCell.tsx`          |
| Utility files        | camelCase               | `formatDate.ts`           |
| Hook files           | camelCase, `use` prefix | `useThread.ts`            |
| Type/Interface files | camelCase               | `types.ts`                |
| Constants files      | camelCase               | `constants.ts`            |
| Component values     | PascalCase              | `<ThreadCell />`          |
| Hooks                | camelCase, `use` prefix | `useThread()`             |
| Variables/Functions  | camelCase               | `threadList`              |
| Types/Classes        | PascalCase              | `ThreadItem`              |
| Constants            | UPPER_SNAKE_CASE        | `MAX_RETRY_COUNT`         |
| Unused params        | `_` prefix              | `_threadId`               |

### TypeScript Rules

- Strict mode — no `any`, no implicit returns
- Prefer `type` over `interface` for public APIs
- Use `interface` for internal implementation
- Export types for external use
- Path aliases: `@/*` for renderer, `@main/*` for main process

### React Component Rules

- One component per file
- Props type: `<ComponentName>Props`
- Colocate styles: `ComponentName.module.css`
- State in atoms, derived data via selectors
- Prefer composition over prop drilling

### Electron Architecture Rules

- Main process: `apps/desktop/src/main/` — no DOM APIs
- Renderer: `apps/desktop/src/renderer/src/` — no Node.js APIs
- Preload: `apps/desktop/src/preload/` — contextBridge only
- IPC: typed channels via `RPC_CHANNELS`, no raw `ipcRenderer`

### Git Commit Conventions

Format: `<type>(<scope>): <subject>` in English

Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `style`, `perf`

## Implementation

### Step 1: Update CLAUDE.md

Expand existing `CLAUDE.md` with Code Standards section containing concise rules.

### Step 2: Create docs/architecture/coding-standards.md

Detailed document with:
- Each rule
- "Why" explanation
- Correct and incorrect examples
- References to competitor docs where pattern was observed

### Step 3: Quality Gates

Before commit, run:
```bash
bunx tsc --noEmit
bunx oxlint
bunx oxfmt
```

Use English for all code comments.

## Status

- [x] Design approved
- [ ] CLAUDE.md updated
- [ ] docs/architecture/coding-standards.md created
- [ ] Self-review completed
- [ ] User review completed
