# RFC 0015: Window Management

## Summary

This document defines the multi-window support in Acme, including pop-out threads, window state persistence, and cross-window communication.

## Window Types

| Window Type | Description            | Count     | Lifecycle    |
| ----------- | ---------------------- | --------- | ------------ |
| Main        | Primary workspace      | 1         | App lifetime |
| Pop-out     | Thread floating window | N         | Per thread   |
| Settings    | Preferences dialog     | 1 (modal) | On demand    |
| About       | App info               | 1 (modal) | On demand    |

## Pop-out Windows

### Use Cases

- **Multi-monitor**: Pop out thread to second monitor
- **Side-by-side**: Keep thread visible while working in IDE
- **Picture-in-picture**: Thread always on top while browsing

### Pop-out Flow

```
User clicks pop-out button or uses shortcut
    │
    ▼
┌─────────────────────┐
│ Create new window   │ ── Same dimensions as main
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Load thread state   │ ── Reconnect to session
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Show window         │
└─────────────────────┘
```

### Pop-out Window Features

```typescript
interface PopoutWindow {
  threadId: string;
  alwaysOnTop: boolean;  // "Pin" feature
  dimensions: {
    width: number;
    height: number;
    x?: number;
    y?: number;
  };
}
```

### Window Controls

```
┌─────────────────────────────────────────────────────┐
│ Thread: Fix login bug              [_] [□] [📌] [×] │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [Messages...]                                      │
│                                                     │
│                                                     │
├─────────────────────────────────────────────────────┤
│  [Composer]                           [Send]      │
└─────────────────────────────────────────────────────┘
```

| Button | Action                         |
| ------ | ------------------------------ |
| `_`    | Minimize to dock               |
| `□`    | Toggle maximize                |
| `📌`    | Toggle always on top           |
| `×`    | Close (returns to main window) |

## Window State Persistence

### Saved State

```typescript
interface WindowState {
  main: {
    x: number;
    y: number;
    width: number;
    height: number;
    isMaximized: boolean;
    isFullScreen: boolean;
  };

  panels: {
    sidebarWidth: number;
    sidebarCollapsed: boolean;
    terminalHeight: number;
    terminalCollapsed: boolean;
  };

  popouts: {
    [threadId: string]: {
      x: number;
      y: number;
      width: number;
      height: number;
      alwaysOnTop: boolean;
    };
  };
}
```

### Persistence Location

- **Main window**: `settings.json`
- **Per-thread popouts**: Per-thread in database

## Cross-Window Communication

### Events

```typescript
// Event types
type WindowEvent =
  | { type: 'thread:updated'; threadId: string }
  | { type: 'thread:archived'; threadId: string }
  | { type: 'settings:changed' }
  | { type: 'theme:changed' }
  | { type: 'project:switched'; projectId: string };

// IPC channels
window.electron.onWindowEvent((event: WindowEvent) => {
  // Handle event
});
```

### Synchronization

| State           | Sync Method       |
| --------------- | ----------------- |
| Thread messages | Real-time via IPC |
| Project switch  | Event broadcast   |
| Settings        | Event broadcast   |
| Theme           | Event broadcast   |

## Multi-Monitor Support

### Detection

```typescript
interface DisplayInfo {
  id: string;
  label: string;
  bounds: { x: number; y: number; width: number; height: number };
  scaleFactor: number;
  isPrimary: boolean;
}

// Get available displays
window.electron.getDisplays(): Promise<DisplayInfo[]>;
```

### Window Placement

```typescript
interface PlaceWindowOptions {
  display?: 'primary' | 'same' | 'next' | 'previous' | string;
  position?: 'center' | 'left' | 'right' | 'top' | 'bottom';
  bounds?: { x: number; y: number; width: number; height: number };
}
```

## Window Effects

### macOS

| Effect          | Implementation             |
| --------------- | -------------------------- |
| Vibrancy        | NSVisualEffectView         |
| Title bar       | Hidden with traffic lights |
| Rounded corners | mask-corner-radius         |

### Windows

| Effect | Implementation           |
| ------ | ------------------------ |
| Mica   | Windows 11 Mica material |
| Snap   | Snap layouts support     |
| Aero   | DWM blur behind          |

### Linux

| Effect       | Implementation       |
| ------------ | -------------------- |
| Blur         | picom compositor     |
| Transparency | compton/transparency |

## Fullscreen Support

### Enter Fullscreen

- `F11` or `Ctrl+Cmd+F` (macOS)
- Menu: View → Toggle Full Screen

### Fullscreen Behavior

```
┌─────────────────────────────────────────────────────────┐
│ Thread Title                               [Exit Full]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Messages...]                                         │
│                                                         │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  [Composer]                               [Send]      │
└─────────────────────────────────────────────────────────┘
```

## Keyboard Shortcuts

### Window Management

| Shortcut      | Action            |
| ------------- | ----------------- |
| `Cmd+Shift+N` | New window        |
| `Cmd+\`       | Toggle sidebar    |
| `Cmd+Ctrl+F`  | Toggle fullscreen |
| `Cmd+M`       | Minimize          |
| `Cmd+Shift+M` | Minimize to tray  |
| `Cmd+W`       | Close popout      |

### Pop-out Specific

| Shortcut      | Action                 |
| ------------- | ---------------------- |
| `Cmd+Shift+P` | Pop out current thread |
| `Cmd+Shift+T` | Return to main window  |

## Open Questions

1. Should we support multiple main windows?
2. How to handle window state on multi-monitor setup changes?
3. Should we implement window tabs within a single window?

---

**Status**: Draft
**Related RFCs**: 0006 (Thread Management), 0013 (Desktop Shell)
**Reviewers**: (to be assigned)
