#!/usr/bin/env node
import { readConnectorConfig } from '../src/connector-config.mjs';
import { startConnector } from '../src/connector.mjs';
import { pairingOptions, pairConnector } from '../src/pairing.mjs';
const usage = 'Usage: psst-antigravity --config /absolute/private/config.json\n       psst-antigravity pair --pairing-file /absolute/private/pairing.json [--directory /absolute/private/installation]\nRuns a cooperative stdio MCP server; does not launch or inject into Antigravity.\nPair explicitly enrolls this installation; it does not connect or wake a native conversation.\n';
if (process.argv.length === 3 && ['--help','-h'].includes(process.argv[2])) { process.stdout.write(usage); }
else if (process.argv[2] === 'pair') {
  try { process.stdout.write(JSON.stringify(await pairConnector(pairingOptions(process.argv.slice(2)))) + '\n'); }
  catch { process.stderr.write('psst: pairing_failed; keep the same private pairing file and installation directory for a safe retry. No native session was connected.\n'); process.exitCode = 1; }
}
else {
  let connector;
  const controller = new AbortController();
  const stop = () => { controller.abort(); void connector?.close(); };
  process.on('SIGINT', stop); process.on('SIGTERM', stop);
  try {
    const path = process.argv.length === 4 && process.argv[2] === '--config' ? process.argv[3] : process.argv.length === 2 ? process.env.PSST_CONFIG_FILE : null;
    if (!path) throw new Error();
    process.stdin.pause();
    const config = readConnectorConfig(path);
    connector = await startConnector({config, signal: controller.signal, onDiagnostic: ({code}) => process.stderr.write(`psst: ${code}\n`)});
    process.stdin.resume();
    await connector.done;
  } catch { process.stderr.write('psst: connector_start_failed; check private configuration, Node 24.19+, credential enrollment and broker availability.\n'); process.exitCode=1; }
  finally { await connector?.close(); process.removeListener('SIGINT',stop); process.removeListener('SIGTERM',stop); }
}
