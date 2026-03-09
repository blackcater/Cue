# RFC 0014: Voice & Input Methods

## Summary

This document defines the various input methods supported by Acme, including voice dictation, keyboard shortcuts, and multimodal input.

## Input Methods Overview

| Method          | Description              | Platforms |
| --------------- | ------------------------ | --------- |
| **Text**        | Standard keyboard input  | All       |
| **Voice**       | Speech-to-text dictation | All       |
| **Drag & Drop** | Drop files/images        | All       |
| **Clipboard**   | Paste from clipboard     | All       |

## Composer Component

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│ [+] [📎] [🎤]                                    [Send]  │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ Type a message...                                     │ │
│ │                                                       │ │
│ │                                                       │ │
│ └───────────────────────────────────────────────────────┘ │
│ ──────────────────────────────────────────────────────── │
│ @file $skill /prompt: [autocomplete]                    │
└─────────────────────────────────────────────────────────────┘
```

### Toolbar Buttons

| Button | Action          | Shortcut        |
| ------ | --------------- | --------------- |
| `+`    | Expand composer | -               |
| `📎`    | Attach file     | -               |
| `🎤`    | Voice dictation | `Ctrl+M` (hold) |
| `Send` | Send message    | `Enter`         |

## Voice Dictation

### Implementation

Acme uses a local speech recognition model:

| Component | Technology                |
| --------- | ------------------------- |
| STT       | Whisper (via local model) |
| Audio     | Web Audio API             |
| UI        | Waveform visualization    |

### Usage

1. Press and hold `Ctrl+M` (or `Cmd+M` on macOS)
2. Start speaking
3. Release to stop
4. Edit transcribed text if needed
5. Send

### Keyboard Shortcuts

| Shortcut        | Action            |
| --------------- | ----------------- |
| `Ctrl+M` (hold) | Start voice input |
| `Ctrl+M` (tap)  | Toggle voice mode |

### Visual Feedback

```
┌─────────────────────────────────────────────────────────────┐
│ 🎤 Listening...  ████████████░░░░░░░░░░░░░░              │
│ ────────────────────────────────────────────────────────   │
│ What are the main authentication flows in the codebase?    │
└─────────────────────────────────────────────────────────────┘
```

## Autocomplete System

### Trigger Characters

| Trigger     | Type    | Description            |
| ----------- | ------- | ---------------------- |
| `@`         | File    | File path autocomplete |
| `$`         | Skill   | Skill autocomplete     |
| `/`         | Command | Slash commands         |
| `/prompts:` | Prompt  | Prompt library         |
| `/review`   | Review  | Code review            |

### Autocomplete Popup

```
┌─────────────────────────────────────────────────────┐
│ src/                                    [View all] │
│ ├ 📄 src/auth/login.ts                          │
│ ├ 📄 src/auth/register.ts                       │
│ └ 📁 src/auth/utils/                            │
└─────────────────────────────────────────────────────┘
```

## File Attachments

### Supported Types

| Type       | Handling                |
| ---------- | ----------------------- |
| Images     | Vision model processing |
| Code files | Context inclusion       |
| Text files | Content extraction      |
| PDFs       | Text extraction         |
| Archives   | Not supported (error)   |

### Attachment Methods

1. **Drag & drop** onto composer
2. **Paste** from clipboard (images)
3. **Click** attach button
4. **Type** `@filename` for file autocomplete

### Image Handling

```
┌─────────────────────────────────────────────────────────────┐
│ [+ ] Attach image from:                              [X]   │
│  ○ File picker                                         │
│  ○ Clipboard (⌘V)                                      │
│  ○ Screenshot (⌘⇧4)                                    │
└─────────────────────────────────────────────────────────────┘
```

### Composer Mode (Shift+Enter)

Users can use `Shift+Enter` to send with opposite follow-up behavior:

- **Default: Queue** → `Shift+Enter` = Steer
- **Default: Steer** → `Shift+Enter` = Queue

## Slash Commands

### Built-in Commands

| Command    | Description       |
| ---------- | ----------------- |
| `/help`    | Show help         |
| `/clear`   | Clear thread      |
| `/cost`    | Show token usage  |
| `/compact` | Compact context   |
| `/doctor`  | Run diagnostics   |
| `/review`  | Start code review |

### Custom Commands

Users can create custom slash commands:

```typescript
interface SlashCommand {
  id: string;
  name: string;
  description?: string;
  action: string;  // Prompt to execute
  scope: 'global' | 'project';
}
```

## Multimodal Input

### Image Context

When image is attached:
1. Image is encoded as base64
2. Sent with message to model
3. Model can "see" the image

### Screenshot Tool

For UI development, agents can take screenshots:

```typescript
// Agent tool for taking screenshots
{
  name: 'screenshot',
  description: 'Take a screenshot of the application'
}
```

## Accessibility

### Screen Reader Support

- Composer has proper ARIA labels
- Voice input has status announcements
- Autocomplete is navigable via keyboard

### Keyboard Navigation

All input methods are accessible without mouse:

| Action         | Shortcut                  |
| -------------- | ------------------------- |
| Focus composer | `Cmd+L`                   |
| Attach file    | `Cmd+Shift+A`             |
| Voice input    | `Ctrl+M`                  |
| Send           | `Enter`                   |
| New line       | `Enter` (when shift held) |

---

**Status**: Draft
**Related RFCs**: 0006 (Thread Management), 0012 (UI/UX)
**Reviewers**: (to be assigned)
