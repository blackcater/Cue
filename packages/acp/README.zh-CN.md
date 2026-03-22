# @acme-ai/acp

`@acme-ai/acp` 实现了 Agent Client Protocol (ACP)，一种基于 JSON-RPC 的外部代码 Agent
通信协议。它提供传输层 (STDIO, WebSocket) 和用于连接 ACP 兼容 Agent 的桥接。

**核心功能：**
- JSON-RPC 2.0 消息协议
- STDIO 传输用于本地进程
- WebSocket 传输用于远程连接
- ACP 桥接用于协议转换
- 消息类型定义和验证

**ACP 兼容 Agent：** 任何实现了 ACP 规范的 Agent
