# RFC 0013: Desktop Shell

## Summary

This document defines the desktop shell implementation for Acme using Electron, including window management, system integration, and native features.

## Electron Configuration

### Version & Dependencies

```json
{
  "electron": "^40.0.0",
  "electron-builder": "^25.0.0"
}
```

### Process Model

```
┌─────────────────────────────────────────────────────────┐
│                    Main Process                          │
│  - Window management                                     │
│  - IPC handlers                                          │
│  - System tray                                           │
│  - Native menus                                          │
│  - Auto-updater                                          │
│  - File system access                                    │
└───────────────────────┬───────────────────────────────────┘
                        │ IPC
                        ▼
┌───────────────────────────────────────────────────────────┐
│                   Preload Script                         │
│  - contextBridge API exposure                            │
│  - Secure IPC channel                                     │
└───────────────────────┬───────────────────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────────────────┐
│                  Renderer Process                         │
│  - Next.js application                                   │
│  - Full Node.js disabled                                  │
│  - Context isolation enabled                              │
└───────────────────────────────────────────────────────────┘
```

## Window Management

### Window Types

| Window   | Purpose                | Modality         |
| -------- | ---------------------- | ---------------- |
| Main     | Primary workspace      | Single           |
| Pop-out  | Thread floating window | Multiple allowed |
| Settings | Preferences dialog     | Modal            |
| About    | App info               | Modal            |

### Window Options

```typescript
interface WindowConfig {
  // Dimensions
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;

  // Behavior
  resizable: boolean;
  maximizable: boolean;
  minimizable: boolean;
  closable: boolean;

  // Appearance
  frame: boolean;           // Native frame
  titleBarStyle: 'default' | 'hidden' | 'hiddenInset';
  backgroundColor: string;

  // Effects
  vibrancy?: boolean;      // macOS
  fullscreenable: boolean;
}
```

### Main Window Default

```typescript
const mainWindowConfig: WindowConfig = {
  width: 1400,
  height: 900,
  minWidth: 800,
  minHeight: 600,

  resizable: true,
  maximizable: true,
  minimizable: true,
  closable: true,

  frame: true,
  titleBarStyle: 'default',
  backgroundColor: '#0f172a',  // Dark theme

  fullscreenable: true,
};
```

## Preload API

### Exposed APIs

```typescript
// Window controls
window.electron.windowMinimize(): void;
window.electron.windowMaximize(): void;
window.electron.windowClose(): void;
window.electron.windowIsMaximized(): boolean;
window.electron.onWindowMaximizeChange(callback): void;

// File system
window.electron.openFileDialog(options): Promise<string[]>;
window.electron.saveFileDialog(options): Promise<string>;
window.electron.readFile(path): Promise<string>;
window.electron.writeFile(path, content): Promise<void>;

// System
window.electron.openExternal(url): void;
window.electron.openPath(path): void;
window.electron.showItemInFolder(path): void;

// Clipboard
window.electron.clipboardWriteText(text): void;
window.electron.clipboardReadText(): string;

// Notifications
window.electron.showNotification(options): void;

// Updates
window.electron.checkForUpdates(): void;
window.electron.downloadUpdate(): void;
window.electron.installUpdate(): void;
window.electron.onUpdateAvailable(callback): void;
window.electron.onUpdateDownloaded(callback): void;
```

### Implementation

```typescript
// preload.ts
contextBridge.exposeInMainWorld('electron', {
  windowMinimize: () => ipcRenderer.invoke('window:minimize'),
  windowMaximize: () => ipcRenderer.invoke('window:maximize'),
  windowClose: () => ipcRenderer.invoke('window:close'),
  // ...
});
```

## System Tray

### Tray Menu

```
┌─────────────────────┐
│ Acme                │
├─────────────────────┤
│ ● Project Name      │
├─────────────────────┤
│ New Thread          │
│ Open Projects       │
├─────────────────────┤
│ Check for Updates   │
├─────────────────────┤
│ Quit Acme           │
└─────────────────────┘
```

### Tray Behavior

| Option           | Default | Description                      |
| ---------------- | ------- | -------------------------------- |
| Show             | Yes     | Show tray icon                   |
| Minimize to tray | Yes     | Minimize to tray instead of dock |
| Close to tray    | No      | Close button minimizes to tray   |
| Start minimized  | No      | Start in background              |

## Native Menus

### macOS Menu

```
Acme
├── About Acme
├── Preferences... (⌘,)
├── Services
├── Hide Acme (⌘H)
├── Hide Others (⌥⌘H)
├── Show All
└── Quit Acme (⌘Q)

File
├── New Thread (⌘N)
├── New Window (⌘⇧N)
├── Open Project... (⌘O)
├── Close (⌘W)

Edit
├── Undo (⌘Z)
├── Redo (⇧⌘Z)
├── Cut (⌘X)
├── Copy (⌘C)
├── Paste (⌘V)
├── Select All (⌘A)
└── Find...

View
├── Toggle Sidebar (⌘B)
├── Toggle Terminal (⌘J)
├── Toggle Full Screen (⌃⌘F)
└── Zoom

Thread
├── Stop (⌘.)
├── Pause
├── Clear (⌘⇧K)
└── Compact Context

Window
├── Minimize (⌘M)
├── Zoom
├── Bring All to Front

Help
├── Documentation
├── Report Issue
└── Check for Updates
```

### Windows/Linux Menu

```
File
├── New Thread (Ctrl+N)
├── New Window (Ctrl+Shift+N)
├── Open Project... (Ctrl+O)
├── Settings (Ctrl+,)
└── Quit (Ctrl+Q)

Edit
├── Undo (Ctrl+Z)
├── Redo (Ctrl+Shift+Z)
├── Cut (Ctrl+X)
├── Copy (Ctrl+C)
├── Paste (Ctrl+V)
└── Select All (Ctrl+A)

View
├── Toggle Sidebar (Ctrl+B)
├── Toggle Terminal (Ctrl+J)
└── Toggle Full Screen (F11)

Thread
├── Stop (Ctrl+.)
├── Pause
└── Clear (Ctrl+Shift+K)

Help
├── Documentation
├── Report Issue
└── Check for Updates
```

## Auto-Updater

### Configuration

```typescript
interface UpdaterConfig {
  provider: 'github' | 'generic';
  repo: string;
  releaseUrl?: string;
}
```

### Update Flow

```
1. App starts → Check for updates
                    │
                    ▼
2. No update available → Continue normal
                    │
                    ▼
3. Update available → Show notification
                    │
                    ▼
4. User clicks → Download in background
                    │
                    ▼
5. Download complete → Show "Restart to update"
                    │
                    ▼
6. User restarts → Install update
```

## Packaging

### Build Targets

| Platform | Format                | Architectures |
| -------- | --------------------- | ------------- |
| macOS    | .dmg, .zip            | arm64, x64    |
| Windows  | .exe (NSIS), .msi     | x64, arm64    |
| Linux    | .AppImage, .deb, .rpm | x64, arm64    |

### Code Signing

| Platform | Certificate     | Notarization |
| -------- | --------------- | ------------ |
| macOS    | Developer ID    | Optional     |
| Windows  | EV Code Signing | Required     |
| Linux    | N/A             | N/A          |

## Open Questions

1. Should we support Snap/Flatpak on Linux?
2. How to handle auto-update for enterprise (managed updates)?
3. Should we implement Windows sandbox mode like Codex?

---

**Status**: Draft
**Related RFCs**: 0002 (System Architecture), 0012 (UI/UX)
**Reviewers**: (to be assigned)
