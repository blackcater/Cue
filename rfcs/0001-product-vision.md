# RFC 0001: Product Vision & Overview

## Summary

This document defines the vision, goals, and core positioning for **Acme** — a unified desktop client for AI coding assistants that supports multiple providers including OpenAI Codex, Anthropic Claude Code, and OpenCode.

## Motivation

The AI coding assistant landscape is fragmented. Each provider offers excellent CLI tools, but:

1. **No unified interface**: Users must switch between different apps/CLIs for different providers
2. **Feature inconsistency**: Each provider's desktop experience differs in capabilities
3. **Workflow fragmentation**:跨 provider 的工作流难以整合

This project aims to create a single, powerful desktop application that abstracts the differences between AI coding assistants while providing a cohesive, production-quality experience.

## Product Vision

**"One desktop, all AI coding assistants"**

Acme is a unified desktop workspace that:
- Connects to multiple AI coding providers (Codex, Claude Code, OpenCode)
- Provides native desktop features (projects, threads, worktrees, Git integration)
- Offers extensibility through MCP servers and custom skills
- Enables automation for routine development tasks

## Target Users

1. **Individual developers** who use multiple AI coding assistants
2. **Development teams** with diverse tool preferences
3. **Organizations** requiring centralized AI tooling management

## Core Principles

1. **Provider agnostic**: Abstraction layer ensures any AI coding assistant can be integrated
2. **Desktop native**: Full desktop integration (windows, menus, system tray)
3. **Project aware**: Deep understanding of codebase structure and conventions
4. **Extensible**: MCP servers, skills, and automations for customization
5. **Secure by default**: Sandboxed execution, approval workflows, local-first data

## Feature Comparison Matrix

| Feature                | Official Codex App | Claude Code CLI | Acme (Target) |
| ---------------------- | ------------------ | --------------- | ------------- |
| Multi-provider support | ❌                  | ❌               | ✅             |
| Projects/Workspaces    | ✅                  | Limited         | ✅             |
| Thread management      | ✅                  | Session-based   | ✅             |
| Worktree isolation     | ✅                  | Manual          | ✅             |
| Git integration        | ✅                  | Via tools       | ✅             |
| MCP support            | ✅                  | ✅               | ✅             |
| Skills                 | ✅                  | ✅               | ✅             |
| Automations            | ✅                  | ❌               | ✅             |
| Integrated terminal    | ✅                  | ❌               | ✅             |
| Voice dictation        | ✅                  | ❌               | ✅             |
| Multi-window           | ✅                  | ❌               | ✅             |
| Cross-platform         | macOS/Windows      | All             | All           |

## Success Metrics

- Support at least 3 AI coding providers (Codex, Claude Code, OpenCode)
- Parity with official Codex app features on core functionality
- Cross-platform availability (macOS, Windows, Linux)
- Sub-100ms response time for UI interactions
- Support for 100+ concurrent threads

## Open Questions

1. Should we support cloud-based AI services directly (API), or only local CLI tools?
2. What is the minimum supported Node.js/Rust version?
3. Should we target Electron or Tauri for the desktop shell?

---

**Status**: Draft
**RFC PR**: (to be created)
**Primary Author**: Architecture Team
**Reviewers**: (to be assigned)
