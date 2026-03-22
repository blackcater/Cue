# @acme-ai/acp

`@acme-ai/acp` implements the Agent Client Protocol (ACP), a JSON-RPC-based
protocol for communicating with external code agents. It provides transport
layers (STDIO, WebSocket) and a bridge for connecting ACP-compatible agents.

**Key Features:**
- JSON-RPC 2.0 message protocol
- STDIO transport for local processes
- WebSocket transport for remote connections
- ACP Bridge for protocol translation
- Message type definitions and validation

**ACP-Compatible Agents:** Any agent implementing the ACP specification
