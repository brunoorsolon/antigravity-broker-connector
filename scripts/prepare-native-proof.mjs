// Generates a disposable, offline proof plugin; never installs or activates it.
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, isAbsolute, join } from 'node:path';
const target = process.argv[2];
if (process.argv.length !== 3 || !isAbsolute(target) || resolve(target) !== target) throw new Error('absolute_new_directory_required');
mkdirSync(target, { mode: 0o700 }); // Existing target is an error, not an overwrite.
mkdirSync(join(target, 'skills/psst-native-proof'), { recursive: true });
const quote = value => `'${value.replaceAll("'", "'\\''")}'`;
const runner = join(target, 'proof.mjs');
const command = mode => `${quote(process.execPath)} ${quote(runner)} ${mode}`;
writeFileSync(join(target, 'plugin.json'), JSON.stringify({ name: 'psst-native-proof', description: 'Disposable offline native wakeup proof; no broker or credentials.' }, null, 2));
writeFileSync(join(target, 'hooks.json'), JSON.stringify({ 'psst-proof-context': { PreInvocation: [{type:'command',command:command('hook'),timeout:5}] } }, null, 2));
writeFileSync(runner, `import {watch,existsSync,writeFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=dirname(fileURLToPath(import.meta.url));
const marker=join(root,'pending');
const mode=process.argv[2];
if(mode==='hook') {
 let input='';for await(const chunk of process.stdin){input+=chunk;if(input.length>32768)throw Error('oversize');}
 const data=JSON.parse(input);
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data.conversationId))throw Error('invalid_conversation');
 console.log(JSON.stringify({injectSteps:[{ephemeralMessage:'Offline Psst proof hook active. This fixture has no broker, credentials or message payload. Conversation: '+data.conversationId}]}));
} else if(mode==='signal') {writeFileSync(marker,'pending\\n',{mode:0o600});}
else if(mode==='wait') {
 let watcher,done=false;
 const check=()=>{if(done)return true;if(existsSync(marker)){done=true;watcher?.close();console.log('PSST_NATIVE_WAKE_PROOF: synthetic pending notice, not model-read acknowledgment.');return true;}return false;};
 watcher=watch(root,check);check();
 process.on('SIGTERM',()=>{watcher.close();process.exit(0);});
 process.on('SIGINT',()=>{watcher.close();process.exit(0);});
}else throw Error('invalid_mode');
`);
writeFileSync(join(target,'skills/psst-native-proof/SKILL.md'), `---
name: psst-native-proof
description: Run one disposable offline native background-completion test, not a broker connection.
---

This test has no credentials or network. It does not connect to Psst.
Use native run_command to run the following exact command with WaitMsBeforeAsync=500,
toolSummary="Native wake proof", subject to normal permissions:

\`\`\`sh
${command('wait')}
\`\`\`

End your turn. Do not poll, schedule, invoke another model, or auto-approve anything.
When the native completion notice arrives, reply PSST_NATIVE_WAKE_OBSERVED once.
Do not pretend this is a broker read or acknowledgment. Do not re-arm this one-shot test.
The tester signals from the same sandbox using: ${command('signal')}
`);
console.log(JSON.stringify({ pluginDirectory: target, signalCommand: command('signal'), installed:false }));
