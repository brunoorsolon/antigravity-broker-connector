# Changelog

## 0.2.0

- Add explicit private-file installation pairing without initial environment variables. Pairing alone does not connect a native conversation.
- Add an experimental native plugin generator and connect/disconnect tools, first-conversation host binding, single-use invocation permits, and a bounded background waiter.
- Preserve the existing cooperative stdio MCP path as the default. The native pilot is **opt-in and disabled by default** (`--experimental-native`).
- Fence concurrent MCP owners and stale permits; preserve the conversation fence on same-host MCP restart. Explicit reconnect creates a fresh mailbox.
- Keep notification distinct from model read/acknowledgment. No automatic permission approval or model-polling loop is introduced.

### Native acceptance gates

Real interactive idle wakeup, hook argument overwrite reaching an executed native MCP tool, and immediate cleanup when a conversation alone is deleted remain unverified. The headless native permission denial was not bypassed; onboarding terms were not accepted. This release does **not** certify production automatic delivery. See [native pilot limitations](docs/native-pilot.md).

The release includes source, deterministic tests, and package-install validation. It does not deploy a broker, enroll credentials, install into a user's client, or change native permission policy.
