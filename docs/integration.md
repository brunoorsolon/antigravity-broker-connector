# Opt-in local managed runner

The runner is an experimental operator-controlled JSON-lines front end, **not a
TUI extension**. Use only a new CLI process whose stdin it exclusively owns.
An operator must first install/authenticate the official CLI normally and review
its current headless protocol. No setup command here downloads a CLI, copies
credentials, changes approvals or opens a LAN port.

## Private config

Create a 0600 JSON file outside the repository, with absolute paths. Create a
0700 state directory owned by the same nonroot user; do not share a state directory
between live adapters or use network filesystems. Use the exact broker checkout
`e015a6f5d7cc32d0c0a90bd633fab8d94195417a` read-only.

```json
{
  "referenceRoot": "/opt/ai-agent-msg-broker",
  "stateRoot": "/var/lib/agy-pair",
  "brokerUrl": "https://broker.example.test:8787",
  "tokenFile": "/run/secrets/broker-token",
  "caFile": "/run/secrets/broker-ca.pem",
  "name": "reviewer-1",
  "project": "example-project",
  "binary": "/opt/official-cli/agy",
  "binarySha256": "REPLACE_WITH_SHA256_OF_REVIEWED_EXECUTABLE",
  "harnessVersion": "REPLACE_WITH_REVIEWED_VERSION",
  "experimentalManaged": false
}
```

The binary must be a regular executable (not a symlink), pinned by SHA-256.
The configured version is a declaration, not native certification. The wrapper
passes only documented stream input/output arguments and an optional `model`
identifier. It accepts only `request-review` in the native init event. It does
not add permission, trust, sandbox-relaxation or account flags.

```sh
node bin/launch.mjs /absolute/private/config.json
```

Keep stdin open for the life of the owned session. Its stdout contains bounded
JSON-line events; stderr uses nonsecret diagnostic codes. The `connected` event
identifies this fresh exact broker client. Reconnects within the same process
use the shared lease logic; a new process gets a new identity, never adopts an
old native session or mailbox.

Commands from the **trusted local operator**, never from model output or broker
message bodies:

```jsonl
{"op":"human","text":"Review this project without changing files."}
{"op":"draft","present":true}
{"op":"draft","present":false}
{"op":"pause"}
{"op":"resume"}
{"op":"tool","name":"broker_list_clients","arguments":{}}
{"op":"close"}
```

`pause` stops future automatic submissions; it does not interrupt an active turn.
`resume` does not resolve uncertain injection or approve any tool. `human` is
accepted only at the same single-owner safe boundary, not while another turn or
approval hold is active. Library hosts may also use `holdForHuman()` and
`releaseHumanHold()`; these are deliberately not model tools.

With `experimentalManaged:false`, incoming messages remain in the durable inbox.
Set it to `true` **only for an explicitly reviewed experimental session** to enable
serial final-hop submission. The mode still reports uncertified. Every prompt
uses the shared provenance wrapper. An unknown event, failed result, malformed
frame or process death preserves uncertainty and blocks the head.

## Containers and multiple hosts

Run one CLI+adapter in each independent nonroot Podman container; mount only its
own private state, approved project and credentials, plus the pinned broker
reference read-only. The broker may be on another host; HTTPS verification, CA,
broker token and exact recipient UUID still apply. This repository does not ship
a vendor-bundled image or automatically install/authenticate a CLI. No rootless
Podman/SELinux/two-host LAN deployment has been performed. Do not use host PID
namespaces, Docker sockets, relaxed seccomp, privileged mode or approval bypasses
to make this prototype work. Native CLI image packaging is a remaining gate.

## Operator recovery

Do not delete, edit or automatically resolve an `injecting`/`uncertain` inbox.
A crash after submission may have reached the model even without a receipt.
Preserve the journal and use the shared reference's explicit operator recovery
process after checking the exact native session. Never replay an old inbox into
a new session just because its project/name matches.

## Official contract

- [Headless stream JSON](https://antigravity.google/docs/cli/headless/)
- [CLI reference](https://antigravity.google/docs/cli/reference)
- [Native MCP](https://antigravity.google/docs/mcp) — not yet wired in this runner.

These are CLI contracts; app-side internal agent APIs are intentionally not used.
