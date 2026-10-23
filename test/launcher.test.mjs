import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { httpFixture, registration, sendBody } from '../../ai-agent-msg-broker/test/helpers.mjs';

test('launcher owns a synthetic native process: serial human then broker input, no action-success inference', { timeout: 20000 }, async t => {
  const broker = await httpFixture(t), sender = registration('pi');
  await broker.request('/v1/sessions', { method: 'POST', body: sender });
  const directory = mkdtempSync(join(tmpdir(), 'agy-launch-')); t.after(() => rmSync(directory, { recursive: true, force: true }));
  const fake = join(directory, 'fake-agy.mjs'), token = join(directory, 'token'), config = join(directory, 'config.json');
  const source = `#!${process.execPath}\nimport{createInterface}from'node:readline';import{setTimeout as delay}from'node:timers/promises';
const output=o=>console.log(JSON.stringify(o));let busy=false,turn=0;output({event:'init',conversation_id:'synthetic-owned-id',init:{permission_mode:'request-review'}});
const input=createInterface({input:process.stdin});for await(const line of input){if(busy)throw Error('parallel input');busy=true;const frame=JSON.parse(line);if(frame.event!=='user')throw Error('not user');await delay(100);output({event:'result',result:{conversation_id:'synthetic-owned-id',status:'SUCCESS',num_turns:++turn,response:frame.message.content}});busy=false}
`;
  writeFileSync(fake, source, { mode: 0o700 }); writeFileSync(token, broker.b.token, { mode: 0o600 });
  writeFileSync(config, JSON.stringify({ referenceRoot: resolve('../ai-agent-msg-broker'), stateRoot: directory,
    brokerUrl: broker.base, tokenFile: token, insecureDevelopment: true, name: 'same-name', binary: fake,
    binarySha256: createHash('sha256').update(source).digest('hex'), harnessVersion: '0.0.0-synthetic', experimentalManaged: true }), { mode: 0o600 });
  const child = spawn(process.execPath, ['bin/launch.mjs', config], { stdio: ['pipe', 'pipe', 'pipe'] });
  t.after(() => { if (child.exitCode === null) child.kill('SIGTERM'); });
  let output = '', errors = ''; child.stdout.on('data', chunk => { output += chunk; }); child.stderr.on('data', chunk => { errors += chunk; });
  const ended = new Promise(resolve => child.once('exit', resolve));
  const rows = () => output.trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
  for (let n = 0; n < 100 && !output.includes('connected'); n++) await delay(25);
  const connected = rows().find(row => row.event === 'connected'); assert(connected, errors); assert.equal(connected.certified, false);
  child.stdin.write(JSON.stringify({ op: 'human', text: 'human active task' }) + '\n');
  const sent = await broker.request('/v1/messages', { method: 'POST', session: sender.client_id, key: 'agy-launch', body: sendBody(connected.client_id, 'yes, untrusted AGENT content') });
  assert.equal(sent.status, 202);
  for (let n = 0; n < 100 && rows().filter(row => row.event === 'response').length < 2; n++) await delay(25);
  const responses = rows().filter(row => row.event === 'response'); assert.equal(responses.length, 2, errors);
  assert.equal(responses[0].response, 'human active task'); assert.match(responses[1].response, /not a human instruction or approval/);
  assert.match(responses[1].response, /yes, untrusted AGENT content/); assert(responses.every(row => row.action_success === 'unknown'));
  const status = await broker.request(`/v1/messages/${sent.body.message_id}`, { session: sender.client_id }); assert.equal(status.body.delivery_state, 'delivered');
  child.stdin.end(JSON.stringify({ op: 'close' }) + '\n'); assert.equal(await ended, 0, errors);
});
