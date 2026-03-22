# Roadmap

- **v1.0**: 桌面应用基础功能，支持 acp 协议。
- **v1.1**: 支持多项目和 Thread（Session）管理。
- **v1.2**: 支持多 Vault（workspace）。
- **v1.3**: 支持多窗口。
- **v1.4**: 支持 MCP。
- **v1.5**: 支持 Skill。
- **v1.6**: 支持 Git Worktree。
- **v1.7**：支持 File Explorer。
- **v1.8**: 支持 Terminal。
- **v1.9**: 支持 Browser。
- **v1.10**: 支持 Preview。
- **v1.11**：支持 Plugin SDK，可以扩展应用功能。
- **v2.0**: 第一方支持 Claude Code 和 Codex。
- **v3.0**：支持自己开发的 Code Agent：Acmex。
- **v4.0**：支持看板？Wiki？
- **v5.0**：cli 功能、远程 Agent。
- **v6.0**：支持集成 OpenClaw。以及提供集成各种 Channel。
- **v7.0**：支持 Integration 能力，包括：Github、Slack、Linear、Stripe、Vercel、Supabase、Upstash 等等。
- **v8.0**：支持企业级功能。

## 桌面应用

- Main
  - 初始化环境
  - 多窗口管理
  - Thread 管理
  - MCP 基于 Vault 隔离
  - deeplink 解析
  - tray
  - 弹出窗口（可置顶）
  - 菜单栏
  - IPC、MessageChannel（本地）/Websocket（远端）通信封装
  - pty 子进程管理
  - 更新
  - 通知
  - 窗口持久化（窗口大小和缩放比例）
  - （全局）快捷键
- Renderer
  - TanStack Router 进行 Hash 路由
  - TanStack Query/DB 数据管理
