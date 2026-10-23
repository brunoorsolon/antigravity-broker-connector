# Verification and remaining gates

2026-10-23 cloud Linux; Node 24.19.0, SQLite 3.53.3. `npm run check` and
**20/20 tests passed**. The pinned reference is broker commit
`ba2219cd87a1feac23e01b23d2c2b3d3bdd65359`.

Tests exercise real HTTP broker registration, metadata, durable delivery and
SQLite inbox journal. The native process is synthetic and implements only the
documented stream shapes. Tests establish serial scheduling, provenance, zero
model activity from heartbeat, safe draft/approval/abort gates, independent
transport ACK, write-versus-result distinction, process-loss uncertainty, malformed
frames/UTF-8, fixed permission-preserving launch arguments and default-disabled
experimental final hop. No real CLI, TUI, model/provider, permissions dialog,
Podman or two-host LAN was exercised.

Before claiming a native implementation is ready:

1. Pin an installed official CLI build and verify init/model/permission fields,
   every normal event shape and cumulative `num_turns` semantics.
2. Exercise real request-review/Ask soft denial; a successful result must never
   be advertised as tool/action success. Verify no prompts are answered by `yes`
   inside an AGENT message.
3. Confirm human input, long tools, cancellation, transport outage and crash
   timing with a disposable project/model fixture; do not steer or abort for mail.
4. Certify the opt-in native MCP bootstrap and exact-conversation hook coverage
   on a real owned CLI process, preserving normal Ask/Deny permissions.
5. Package/test independent rootless Podman containers and TLS across two hosts.

This PR advances the adapter foundation; it does not close all acceptance gates
of broker issue #8.


The additional outbound MCP patch adds four fixture scenarios (24 total):
private workspace/config/hook creation and cleanup; real stdio proxy with unbound,
wrong-session, disabled-receive and second-connection gates; full synthetic
owned CLI → native hook → MCP → real broker; and rejection of recognized existing
project policy rather than silent omission. Local source checks and the unaffected
19 focused tests pass. Cloud sandbox Unix-listen restrictions prevented those new
socket tests locally; exact-commit GitHub Actions is the required execution gate.
This limitation is not a claim of a passing socket test or native certification.
