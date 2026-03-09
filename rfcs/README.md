# RFC Index

This document serves as an index to all Acme RFCs.

## RFC List

| RFC # | Title                          | Status | Description                                       |
| ----- | ------------------------------ | ------ | ------------------------------------------------- |
| 0001  | Product Vision & Overview      | Draft  | Product goals, target users, core principles      |
| 0002  | System Architecture            | Draft  | Tech stack, layers, directory structure           |
| 0003  | Multi-Provider Abstraction     | Draft  | Unified provider interface, capability model      |
| 0004  | Core Data Models               | Draft  | Database schema, TypeScript interfaces            |
| 0005  | Project & Workspace Management | Draft  | Project CRUD, sidebar, context management         |
| 0006  | Thread & Session Management    | Draft  | Thread lifecycle, message flow, checkpoints       |
| 0007  | Worktree & Isolation           | Draft  | Worktree lifecycle, merge, clone                  |
| 0008  | Git Integration                | Draft  | Git features, GitHub integration                  |
| 0009  | MCP & Skills System            | Draft  | MCP servers, custom skills, marketplace           |
| 0010  | Automation System              | Draft  | Scheduled tasks, permissions, worktree isolation  |
| 0011  | Terminal Integration           | Draft  | PTY management, actions, terminal panel           |
| 0012  | UI/UX Design System            | Draft  | Design tokens, components, accessibility          |
| 0013  | Desktop Shell                  | Draft  | Electron, window management, menus, tray          |
| 0014  | Voice & Input Methods          | Draft  | Voice dictation, autocomplete, attachments        |
| 0015  | Window Management              | Draft  | Pop-out windows, multi-monitor, state persistence |

## RFC Process

1. **Draft**: Initial version by author
2. **Review**: Assigned reviewers provide feedback
3. **Discussion**: RFC PR open for comments
4. **Accepted**: Consensus reached, marked as accepted
5. **Implemented**: Code ships with RFC reference
6. **Superseded**: Replaced by newer RFC

## Contributing

To create a new RFC:

1. Copy `rfcs/0000-template.md` to `rfcs/XXXX-title.md`
2. Fill in the RFC content
3. Open a PR with `[RFC]` prefix
4. Address feedback from reviewers
5. Merge when accepted

## Open Questions

The following RFCs have unresolved questions marked as "Open Questions":

- 0001: Provider support scope, tech stack decision
- 0002: Plugin system, separate AI process
- 0003: Provider file format migration, third-party plugins
- 0004: Soft delete, encryption
- 0005: Monorepo support, SSHFS
- 0006: Thread limits, long thread handling
- 0007: Auto-cleanup, templates
- 0008: Other Git providers, conflict resolution
- 0009: Skill versioning, sharing
- 0010: Webhooks, chaining
- 0011: Profiles, task runner integration
- 0012: Custom themes, high DPI
- 0013: Linux packaging, Windows sandbox
- 0014: (none)
- 0015: Multiple main windows, tabs
