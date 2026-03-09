# RFC 0012: UI/UX Design System

## Summary

This document defines the UI/UX design system for Acme, including component library, design tokens, and accessibility standards.

## Design Philosophy

1. **Minimal chrome**: Focus on content, hide UI chrome when not needed
2. **Keyboard-first**: Power users should never need the mouse
3. **Dark/light**: First-class support for both themes
4. **Native feel**: Platform-appropriate behavior and shortcuts

## Tech Stack

| Layer      | Technology             |
| ---------- | ---------------------- |
| Styling    | Tailwind CSS 4.x       |
| Components | Radix UI (headless)    |
| Icons      | Lucide React           |
| Typography | Inter + JetBrains Mono |
| Animation  | Framer Motion          |

## Color System

### Light Theme

```css
--background: #ffffff;
--foreground: #0f172a;

--muted: #f1f5f9;
--muted-foreground: #64748b;

--border: #e2e8f0;
--input: #e2e8f0;

--primary: #0f172a;
--primary-foreground: #f8fafc;

--accent: #f1f5f9;
--accent-foreground: #0f172a;

--destructive: #ef4444;
--success: #22c55e;
--warning: #f59e0b;
```

### Dark Theme

```css
--background: #0f172a;
--foreground: #f8fafc;

--muted: #1e293b;
--muted-foreground: #94a3b8;

--border: #334155;
--input: #334155;

--primary: #f8fafc;
--primary-foreground: #0f172a;

--accent: #1e293b;
--accent-foreground: #f8fafc;

--destructive: #f87171;
--success: #4ade80;
--warning: #fbbf24;
```

### Brand Colors

```css
--brand: #6366f1;  /* Indigo */
--brand-hover: #4f46e5;
```

## Typography

### Font Families

```css
--font-sans: 'Inter', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### Type Scale

```css
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
```

### Line Heights

```css
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
```

## Spacing System

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
```

## Component Library

### Base Components

| Component   | Description                                     |
| ----------- | ----------------------------------------------- |
| `Button`    | Primary, secondary, ghost, destructive variants |
| `Input`     | Text input with icon support                    |
| `Select`    | Dropdown selection                              |
| `Dialog`    | Modal dialog                                    |
| `Popover`   | Floating content                                |
| `Tooltip`   | Hover information                               |
| `Tabs`      | Tab navigation                                  |
| `Accordion` | Collapsible sections                            |
| `Toast`     | Notification messages                           |
| `Avatar`    | User avatars                                    |
| `Badge`     | Status badges                                   |

### Domain Components

| Component       | Description             |
| --------------- | ----------------------- |
| `MessageBubble` | Chat message            |
| `CodeBlock`     | Syntax-highlighted code |
| `DiffViewer`    | Git diff display        |
| `FileTree`      | File browser            |
| `Terminal`      | Terminal emulator       |
| `Composer`      | Chat input              |
| `ThreadCard`    | Thread list item        |
| `ProjectCard`   | Project list item       |

## Layout Structure

### Main Window

```
┌─────────────────────────────────────────────────────────────┐
│ [≡] Acme - project-name                     ─ □ ×         │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────────────────────────────────────────┐ │
│ │         │ │  Thread Title                    [⋮]       │ │
│ │ Sidebar │ │ ─────────────────────────────────────────── │ │
│ │         │ │                                             │ │
│ │ Projects│ │  [Messages...]                             │ │
│ │ Threads │ │                                             │ │
│ │         │ │                                             │ │
│ │ ─────── │ │                                             │ │
│ │ Tools   │ ├─────────────────────────────────────────────┤ │
│ │ MCP     │ │  [Composer]                    [Send]      │ │
│ │ Skills  │ │                                             │ │
│ └─────────┘ └─────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ Status: Connected │ Model: claude-sonnet-4-20250514       │
└─────────────────────────────────────────────────────────────┘
```

### Resizable Panels

```typescript
interface LayoutConfig {
  sidebar: {
    width: number;
    collapsible: boolean;
  };

  threadList: {
    width: number;
    collapsible: boolean;
  };

  terminal: {
    height: number;
    collapsible: boolean;
  };
}
```

## Accessibility

### WCAG 2.1 AA Compliance

- Color contrast ratio ≥ 4.5:1
- Focus indicators visible
- Keyboard navigation for all interactions
- Screen reader support (ARIA labels)
- Reduced motion support

### Keyboard Shortcuts

| Category   | Shortcut      | Action          |
| ---------- | ------------- | --------------- |
| Navigation | `Cmd+K`       | Command palette |
|            | `Cmd+P`       | Quick file open |
|            | `Cmd+Shift+P` | Projects        |
| Thread     | `Cmd+N`       | New thread      |
|            | `Cmd+W`       | Close thread    |
|            | `Cmd+Shift+K` | Clear thread    |
| Panel      | `Cmd+J`       | Toggle terminal |
|            | `Cmd+B`       | Toggle sidebar  |
| Window     | `Cmd+Shift+N` | New window      |
|            | `Cmd+Shift+M` | Pop out thread  |

## Responsive Design

### Breakpoints

```css
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
```

### Mobile Layout

On smaller screens:
- Sidebar becomes drawer
- Thread list moves to drawer
- Terminal becomes full-screen overlay

## Animation

```css
--duration-fast: 150ms;
--duration-normal: 300ms;
--duration-slow: 500ms;

--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

Animations respect `prefers-reduced-motion`.

## Open Questions

1. Should we support custom themes?
2. What about high DPI displays (font smoothing)?
3. Should we implement custom font loading?

---

**Status**: Draft
**Related RFCs**: 0002 (System Architecture)
**Reviewers**: (to be assigned)
