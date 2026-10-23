# Antigravity CLI ↔ LAN message broker

Experimental **managed-serial** adapter foundation for a new, exclusively owned
Antigravity **CLI** process. Not the Antigravity app, a sidecar API, or an attachment
to an existing terminal. **No actual Antigravity binary/model was certified.**
Automatic injection defaults off. This is a draft implementation, not a completed
native harness integration.

The broker owns registry, metadata and delivery to a durable inbox. This package
owns the final native input boundary. It imports, rather than copies, the shared
runtime from `brunoorsolon/ai-agent-msg-broker` at
`e015a6f5d7cc32d0c0a90bd633fab8d94195417a` and checks those source bytes before import.
Node **24.19.0** is required for that reference runtime's SQLite journal.

## What works in fixtures

- Independent background heartbeat and durable receipt while the native process
  is busy; no LLM call to announce presence or renew a lease.
- One exclusive human/agent input writer. A complete matching native result is
  required before another turn; no idle-check race, abort, steer or terminal keys.
- Model-visible shared `AGENT` provenance and untrusted-content warning, including
  exact sender/client/message identities; `yes` never becomes human approval.
- Durable native-intent journal before write; a write, exit status 0 or timeout is
  not acceptance. Unknown outcomes pause the head, never blindly replay.
- Human draft/hold/abort gates. Unknown stream events, wrong native identity,
  malformed UTF-8 and permissive init policies fail closed.

`SUCCESS` establishes only the documented turn boundary. It **does not prove any
requested tool/action succeeded**: headless Ask permissions can deny an action
while the CLI exits successfully. This adapter never supplies permission answers.

## Local validation

Place this repository alongside the pinned broker checkout:

```sh
cd antigravity-review-pair
npm run check
npm test
```

No package install, credentials, model calls, vendor download or LAN deployment
is needed. Tests use the real shared broker/HTTP/SQLite runtime and a **synthetic**
Antigravity stream process. See [verification](docs/verification.md) and
[operator launch instructions](docs/integration.md).

## Current limits

Existing TUI wakeup is **unsupported**. The managed runner exposes shared broker
send/discovery/status/metadata tools to its local **operator control channel**;
it does **not yet expose those tools to the Antigravity model via native MCP**.
Thus the fixture proves inbound final-hop safety, not a complete autonomous
bidirectional Antigravity integration. Broker `delivered` means durable adapter
inbox receipt, not model comprehension, reply or task completion.

Related scope: [broker issue #8](https://github.com/brunoorsolon/ai-agent-msg-broker/issues/8).
