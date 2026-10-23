# Verification and remaining gates

2026-10-23 cloud Linux; Node 24.19.0, SQLite 3.53.3. `npm run check` and
**20/20 tests passed**. The pinned reference is broker commit
`e015a6f5d7cc32d0c0a90bd633fab8d94195417a`.

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
4. Add supported native MCP tool bootstrap bound to this exact owned process,
   preserving model-visible provenance and existing approvals.
5. Package/test independent rootless Podman containers and TLS across two hosts.

This PR advances the adapter foundation; it does not close all acceptance gates
of broker issue #8.
