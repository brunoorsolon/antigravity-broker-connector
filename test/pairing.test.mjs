import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, statSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { pairingOptions, pairConnector } from '../src/pairing.mjs';
import { readConnectorConfig } from '../src/connector-config.mjs';

test('shared enrollment helper matches its immutable reviewed source pin', () => {
  const pin=JSON.parse(readFileSync(new URL('../vendor/psst/enrollment-source.json',import.meta.url),'utf8'));
  assert.equal(pin.commit,'3e908e79966d886a02d372c103e31dec6e900c1a');
  assert.equal(createHash('sha256').update(readFileSync(new URL('../vendor/psst/enrollment.mjs',import.meta.url))).digest('hex'),pin.sha256);
});

test('pair accepts only a private file path, with a no-env installation default', () => {
  assert.deepEqual(pairingOptions(['pair','--pairing-file','/private/pair.json'],'/home/test'), {
    pairingFile:'/private/pair.json', directory:'/home/test/.config/psst/antigravity' });
  for (const args of [['pair','--secret','abc'],['pair','--pairing-file','relative'],['pair','--pairing-file','/p','--token','secret']])
    assert.throws(() => pairingOptions(args));
});

test('CLI pairing errors do not echo path, arbitrary secret arguments, or filesystem details', () => {
  const executable = fileURLToPath(new URL('../bin/psst-antigravity.mjs', import.meta.url));
  const sentinel = 'DO_NOT_ECHO_SECRET';
  for (const args of [['pair','--secret',sentinel],['pair','--pairing-file',`/nonexistent/${sentinel}`]]) {
    const result = spawnSync(process.execPath,[executable,...args],{encoding:'utf8'});
    assert.equal(result.status,1); assert.equal(result.stdout,'');
    assert.equal(result.stderr.includes(sentinel),false);
    assert.match(result.stderr,/pairing_failed/);
  }
});

test('pair persists retry identity, reads returned legacy bundle, and never outputs bearer or pairing secrets', async t => {
  const root = mkdtempSync(join(tmpdir(),'agy-pair-')); t.after(() => rmSync(root,{recursive:true,force:true}));
  const pairingFile = join(root,'pair.json'), secret = 'a'.repeat(43);
  writeFileSync(pairingFile,JSON.stringify({ format:'psst-pairing-v1', broker_url:'https://broker.example',
    pairing_secret:secret, client_type:'antigravity-cli', expires_at:new Date(Date.now()+60000).toISOString() }),{mode:0o600});
  const bodies = [], response = {credential_id:`enrolled-${randomUUID()}`,adapter_id:`installation-${randomUUID()}`,
    client_type:'antigravity-cli', scopes:['psst'], expires_at:new Date(Date.now()+86400000).toISOString(), protocol_version:'1'};
  const transport = async (url, grant, body) => { assert.equal(url,'https://broker.example'); assert.equal(grant,secret); bodies.push(body); return {status:201,body:response}; };
  const options = {pairingFile,directory:join(root,'installation')};
  const result = await pairConnector(options,{transport});
  assert.equal(result.connected,false);
  const config = readConnectorConfig(result.connectionFile,{}), token = readFileSync(config.tokenFile,'utf8').trim();
  assert.equal(statSync(config.tokenFile).mode & 0o077,0);
  assert.equal(JSON.stringify(result).includes(secret),false);
  assert.equal(JSON.stringify(result).includes(token),false);
  await pairConnector(options,{transport}); assert.equal(bodies[0],bodies[1]);
  assert.deepEqual(Object.keys(JSON.parse(bodies[0])).sort(),['client_type','enrollment_id','token_sha256']);
  const receiptFile=join(dirname(result.connectionFile),'enrollment.json');
  const receipt=JSON.parse(readFileSync(receiptFile,'utf8'));
  const replace=value=>writeFileSync(receiptFile,JSON.stringify(value),{mode:0o600});
  for(const patch of [{client_type:'pi'},{broker_url:'https://other.example'},{token_sha256:'0'.repeat(64)},{expires_at:'2000-01-01T00:00:00Z'}]) {
    replace({...receipt,...patch});assert.throws(()=>readConnectorConfig(result.connectionFile,{}),/invalid_connector_configuration/);
  }
  replace(receipt);assert.equal(readConnectorConfig(result.connectionFile,{}).enrollment.credentialId,response.credential_id);
  unlinkSync(receiptFile);assert.throws(()=>readConnectorConfig(result.connectionFile,{}),/invalid_connector_configuration/);
});
