# Pinned Psst runtime

These source files are unmodified from the reviewed Psst reference snapshot
`ba2219cd87a1feac23e01b23d2c2b3d3bdd65359` in https://github.com/matuto-ai/psst.
They implement broker protocol v1 and interoperate with broker v0.1.0.
The MIT license is preserved beside them. `src/reference-pin.mjs` verifies their
source digests during tests. No runtime download, postinstall script, or sibling
broker checkout is needed by the packaged MCP connector.

The connector-specific cooperative read/ACK facade and extended MCP tool list
live in `src/`, not in this snapshot. Never silently edit vendored source; update
its reviewed provenance, tests and digest manifest together.

`approval.mjs` is a separate immutable URL/admin-approval helper; its exact commit
and SHA256 are in `approval-source.json` and checked by `test/approval-pin.test.mjs`.
It depends on the broker's approval API (PR22), not on v0.1.0; an unreleased source
pin does not imply that a deployed broker has that capability. Legacy transport
files and the separate enrollment helper retain their original reviewed pins.
