我现在想要基于 Electron 开发一个本地优先、多智能体协作应用，叫做 Acme。当前项目采用 monorepo 进行代码组织。或许为了可维护性，需要引入新的 package，或删除部分 package，但如果要调整 monorepo 结构，请询问我意见。

---

## 部分功能说明

### 多种智能体
1. 兼容所有支持 Agent Client Protocol(ACP) 协议的 Code Agent
2. 基于 Claude Code Agent SDK 第一方兼容 Claude Code
3. 基于 OpenAI Agent SDK 第一方兼容 Codex
4. 兼容自研 Acmex，模型访问使用 vercel/ai 库，实现上仿照 pi-mono，功能上类似 opencode 的 Code Agent

### 本地优先设计
1. 配置和数据尽量保存在本地
2. 提供类似 Obsidian 的 Vault 数据隔离功能，一个 Vault 可以认为就是一个 Workspace
3. 配置分为全局配置，本地配置；未来可能还支持远程配置，比如用户读取远程的 Vault
4. 配置默认存储在 `~/.acme` 目录下
5. 全局配置文件为 `~/.acme/settings.json`
6. 快捷键配置文件为 `~/.acme/keybindings.json`
7. 用户可以自定义本地 vault 存储路径，如果未指定默认为 `~/.acme/vaults/<vaultId>` 目录下
8. `settings.json` 可以添加几乎所有配置，包括但不限于：桌面应用样式、provider、mcpServers 等等

```
|- .acme/
     |- skills/                      # 全局 skills 存储目录
     |- agents/                      # 全局自定义的 Agents
     |- plugins/                     # 全局安装的 acme 插件
     |- commands/                    # 全局启用的 commands
     |- vaults/
     |    |- <vaultId>/
     |         |- skills/            # 仅在 vault 中生效的 skills
     |         |- agents/            # 仅在 vault 中生效的 agents
     |         |- plugins/           # 仅在 vault 中启用的 plugins
     |         |- commands/          # 仅在 vault 中可用的 commands
     |         |- threads/           # 存储 vault 相关 thread 配置和数据
     |         |- settings.json      # 配置文件，可对全局配置进行覆盖
     |- settings.json                # 全局配置
```

### 本地优先设计
Thread 就是一个与 Agent 之间的会话实例，在其他应用中叫做 Session。Thread 有三种：
1. Local：会话中修改的是本地文件
2. Worktree：会话会自动从当前状态创建 worktree，并修改文件
3. Remote：在远程服务器中运行和修改文件，本地只展示结果

### 多窗口
Acme 桌面应用支持开启多个窗口，同时管理多个 Vault。

窗口大概分为：
1. Vault 窗口
2. Thread 窗口
3. 可能还包括设置窗口、初次安装窗口、tray 等等

### 通信规范
1. 在 AgentRuntime 运行在本地的情况下，Electron 中 Main 进程和 Renderer 进程通过 IPC + MessageCHannel 进行通信。
2. 当 AgentRuntime 运行在远程设备上时，Electron 此时是薄客户端，只提供必要的 IPC 能力。Renderer 进程直接与远程 AgentRuntime 通信。使用 HTTP，如果需要可以加上 Websocket

### 通信规范
AgentRuntime 指管理多个智能体同时运行的核心逻辑。

---

## 参考文献和代码

- opencode 是一个 Code Agent 工具，提供 CLI 和 Web 两种访问方式
  - 文档目录：docs/anomalyco_opencode 和 docs/anomalyco_opencode_docs
  - 源码目录：temp/opencode
- pi-mono 是一个用于实现自定义 Agent 库
  - 文档目录：docs/badlogic_pi-mono
  - 源码目录：temp/pi-mono
- mastra 是一个用于实现自定义 Agent 库
  - 文档目录：docs/mastra-ai_mastra
  - 源码目录：temp/mastra
- vercel ai 是一个磨平与主流 AI 大模型交互差异的库
  - 文档目录：docs/vercel_ai
  - 源码目录：temp/vercel_ai
- AionUi 是一款基于 Electron 开发的多智能体应用，支持 Agent Client Protocol，竞品
  - 文档目录：docs/iOfficeAI_AionUi
  - 源码目录：temp/AionUi
- Craft Agents OSS 是一款基于 Electron 开发的多智能体应用，支持远程运行 AgentRuntime，竞品
  - 文档目录：docs/lukilabs_craft-agents-oss 和 docs/lukilabs_craft-agents-oss-cn
  - 源码目录：temp/craft-agents-oss
- Superset 是一款基于 Electron 开发的多智能体应用，竞品
  - 文档目录：docs/superset-sh_superset
  - 源码目录：temp/superset

---

## 代码要求
- 私有变量和方法请添加 `_` 前缀予以区分
- 一个类相关的 TS 类型等，可以通过 namespace 进行组织
- 文件与文件名尽量遵循 kebab-case 规范
- 一个文件中避免包含多个领域的内容
- 一个方法中避免包含多个职责
