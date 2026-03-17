# Acme

## Apps

### API Server

`apps/api-server`

基于 elysia 框架，对外提供 RESTful API 接口。主要作用是为 Acme 应用提供企业级能力：
- 成员/团队管理
- 权限管理
- Agent 管理
- LLM 管理
- Skill 管理
- MCP 管理

### Cli

`apps/cli`

基于 Node.js 实现的命令行工具。

```bash
acme tool list      # 查看可用工具
acme agent list     # 查看可用 Agent
acme agent create   # 交互式创建新的 Agent
acme provider list  # 查看可用 Provider
acme provider add   # 交互式添加新的 Provider
acme command list   # 查看可用 Command
acme command create # 交互式创建新的 Command
acme skill list     # 查看可用 Skill
acme skill add      # 交互式添加新的 Skill
acme serve          # 启动 acme agent
acme serve --acp    # 启动兼容 acp 协议的 acme agent
```

### Console

`apps/console`

控制台应用，为 API Server 提供 Web 界面。

### Desktop

`apps/desktop`

基于 Electron 开发的类似 Codex 桌面应用。支持 Acme Agent、Claude Code、CodeX 等 Code Agent，以及支持兼容 ACP 的主流 Code Agents。

- Local-first 设计，所有数据保存在本地。
- 多 Vault 支持，每个 Vault 可以独立的 Window。
- 多项目支持，每个项目多个 Thread。
- Thread 组织管理：多级标签、归档、分享、独立浮窗等。
- Provider 管理：系统级、Vault 级多层级主流 LLM 配置。
- Agent 管理：系统级、Vault 级、项目级多层级 Sub-Agent 管理。
- Command 管理：系统级、Vault 级、项目级多层级 Command 管理。
- MCP 管理：系统级、Vault 级、项目级、Thread 级多层级管理。
- Skill 管理：系统级、Vault 级、项目级多层级管理。

### Mobile

`apps/mobile`

基于 React Native 开发的移动应用。

### Viewer

`apps/viewer`

基于 Next.js 实现，为用户提供一个查看 Thread 分享的 Web 应用。

### Website

`apps/web`

基于 Next.js 实现的官方网站，提供产品介绍以及在线文档。

## Packages

### `@acme/core`

Acme 核心类型、接口、工具函数包。

### `@acme/ai`

AI 基础包。

### `@acme/agent`

Agent 支持包。

### `@acme/acp`

Agent Client Protocol 实现包。

### `@acme/code-agent`

Acme Agent 实现包。

### `@acme/schemas`

基于 Rust 的 Schemar 库实现自动生成 JSON Schema 文件。对 Acme 本地配置文件进行提示和校验。

### `@acme/contracts`

暂时为空。

### `@acme/runtime`

暂时为空。

### `@acme/shared`

全平台共享的工具包。
- 配置管理
  - Provider 配置操作
  - Vault 配置操作
  - Agent 配置操作
  - ACP 配置操作
  - Command 配置操作
  - Skill 配置操作
  - MCP 配置操作
- 工具
  - Git 操作
  - 指令安全校验
  - LSP 检测
  - 权限检测
  - 校验与格式化工具
- 其他
  - 日志
  - APM
  - 事件总线
  - 依赖注入

### `@acme/ui`

基于 ShadCN 实现的 UI 组件库。
- foundation：基础组件库
- ai：AI 组件库
- chat：聊天组件库
- editor：简易代码编辑器
- markdown：Markdown 渲染库
- hooks：React Hooks
- icons：图标

### `@acme/tsconfig`

TypeScript 可共享配置文件。
