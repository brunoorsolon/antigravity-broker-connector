# Native CLI delivery pilot (not enabled)

The default connector remains cooperative MCP. This pilot is **not certified
production automatic delivery**, and is not installed or activated by package startup.

## Verified capability and remaining gate (2026-10-25)

The official Antigravity CLI 1.4.7 binary was downloaded from the distribution
manifest referenced by Google's installer and checked against its SHA-512.
`--version`, `--help`, and offline plugin validation are available. An isolated
local fake Gemini provider completed a real headless CLI turn with no account
credential or paid model request. This proves neither subscription authentication
nor automatic delivery into an existing interactive conversation.

The runtime's actual `run_command` tool schema says a command continuing in the
background produces a completion notification. It accepts `CommandLine`,
`WaitMsBeforeAsync` (500–10000), `toolSummary`, and optional `IsDaemon`. These
fields differ from some website examples; use the installed runtime schema.
An interactive test stopped at fresh-profile Terms of Service / Data Use
onboarding, without accepting it. Existing-user TUI wakeup remains untested.

An independent headless fixture observed the real native process contract:
plugin MCP runs directly under the CLI with `PLUGIN_ROOT` but no conversation
environment variable; hooks run through `sh`, with
`ANTIGRAVITY_CONVERSATION_ID` matching their stdin `conversationId`. The tested
`nativeHookContext` implementation verified the same host PID/start time/boot ID
and executable for real SessionStart and PreInvocation hooks. Lazy MCP calls use
`call_mcp_tool` with `ServerName`, `ToolName` and `Arguments`; plugin server names
were prefixed with the plugin name. PreToolUse observed this wrapper correctly.

The attempted MCP call was denied by native headless permission policy, which
cannot prompt. No allow rules, auto-approval or permission-skip flags were added;
the MCP tool did not execute. Therefore actual `overwrite` propagation to MCP
and interactive idle wake remain acceptance gates, not verified successes.

Official references:
- [Native plugins](https://www.antigravity.google/docs/plugins): CLI plugin
  installation while running; packaged skills, hooks, and MCP configuration.
- [Hooks](https://www.antigravity.google/docs/hooks): native `conversationId`,
  `PreToolUse.overwrite`, and `PreInvocation` context steps.
- [Scheduling](https://www.antigravity.google/docs/commands/schedule): a matching
  background task completion is a wakeup; no periodic scheduler is proposed here.
- [Sidecars](https://www.antigravity.google/docs/sidecars): documented
  `agentapi send-message` support is App-only, not a CLI capability claim.
- [CLI installation](https://www.antigravity.google/docs/getting-started).

## Intended flow, requiring native proof

1. Install the native plugin in the running CLI. Startup stays disconnected;
   neither environment variables nor credentials are required to load it.
2. An explicit connect skill accepts only a private pairing-file **path**, never
   a secret in conversation text. The shared enrollment helper creates one
   installation credential; each native conversation receives a fresh address.
3. Native hooks bind broker calls to their actual conversation, not to a
   model-supplied ID. A one-use opaque routing ticket must bind conversation,
   incarnation, tool arguments and expiry. Hook `overwrite` may attach this
   ticket; `allow` must still delegate to normal permission policy. MCP hook
   matching and argument overwrite need runtime proof before this is enabled.
4. After connect, the model arms one native background waiter. Transport receives
   without model-token polling. A durable pending inbox event completes the task
   with a fixed notice, not message content. Native completion should wake the
   owning conversation; the model receives, explicitly acknowledges reading,
   and re-arms automatically. The human does not call receive.
5. Disconnect cancels transport/waiters. Reconnect uses bounded transport backoff;
   lost notices retain pending data. An expired credential requires re-pairing.

`src/native-waiter.mjs` is the tested event-driven waiter primitive. Its binding,
durable inbox and event subscription are injected by a future gated adapter.
It does not change the default MCP-process singleton. A
successful notice does not advance the FIFO, create a read receipt, or prove
the requested action succeeded. No terminal input injection, permission override,
infinite Stop-hook continuation, or model-polling cron is an acceptable substitute.

`src/native-binding.mjs` is the second gated primitive: a first-conversation fence
and small private SQLite invocation-permit store. A verified hook issues an
opaque, one-use, 30-second permit for exact tool arguments; MCP must consume it
atomically before acting. At most 32 unexpired permits are retained, containing
the raw short-lived nonce and argument hashes, not message bodies or broker/pairing
credentials. Missing hooks, modified arguments,
wrong session/host, expiration and replay fail closed. Uncertain commit/rollback
fences that handle; a closed host invalidates permits and cancels its waiter.
It is not a general multiplexing service and is not loaded by the released CLI.

This protects the native integration boundary under the assumption that the
installed hook code and private connector state are intact. **It is not a
cryptographic boundary against hostile code with the same OS UID and filesystem
access.** Native permission policy remains authoritative. `allow` only delegates
to that policy; it must never be replaced by `auto_approve` or permission overrides.

## Minimum native acceptance test

### Disposable wakeup-only fixture

The disposable first-stage proof plugin can be generated without installing it:

```sh
node scripts/prepare-native-proof.mjs /absolute/new/proof-plugin
agy plugin validate /absolute/new/proof-plugin --strict --json
```

The official CLI 1.4.7 validator returned no findings for the generated manifest,
one hook and one skill. In an already-onboarded test CLI, explicitly install that
directory using `/plugin install /absolute/new/proof-plugin` and invoke its
`psst-native-proof` skill. It prints the separate synthetic signal command. After
the agent ends its turn, execute that command from the same sandbox. Success is
an unsolicited `PSST_NATIVE_WAKE_OBSERVED` response in the owning conversation.
This first stage has no broker or ACK and is not the full acceptance test below.
It never changes permission policy, sends terminal input, or invokes a timer.

Use an already-onboarded CLI in the intended sandbox, with explicit permission
for the disposable test commands. No production credentials are necessary for
the wakeup proof. The pilot adapter must be reviewed before this test:

1. Load a local proof plugin; verify hooks and skills in `/hooks` and `/plugin`.
2. Start a finite event waiter using native `run_command` (`WaitMsBeforeAsync:500`,
   `IsDaemon:false`). End the model turn without polling or scheduling.
3. From the disposable fixture, commit one synthetic pending inbox item.
4. Without another human prompt, verify the same conversation gets a completion
   notice, invokes receive and explicit ACK, then arms another waiter exactly once.
5. Repeat while the model is busy; exercise two conversations, disconnect, lost
   notice, and restart. No cross-conversation delivery or implicit read ACK.

Record CLI version, native tool/hook observations and the resulting transcript
events (not hidden reasoning or secrets). Until this passes, automatic CLI
delivery remains a gated pilot, not a completed production feature.
