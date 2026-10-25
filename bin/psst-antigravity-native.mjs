#!/usr/bin/env node
// Explicit experimental entrypoint. Never selected by the released MCP command.
import { serveNativePlugin, handleNativeHook } from '../src/native-plugin.mjs';
import { waitNativeProcess } from '../src/native-process-waiter.mjs';
const controller=new AbortController();
const stop=()=>controller.abort();process.on('SIGINT',stop);process.on('SIGTERM',stop);
try {
  const [mode,...args]=process.argv.slice(2);
  if(mode==='serve'&&args.length===1&&args[0]==='--experimental-native') {
    const server=await serveNativePlugin({signal:controller.signal});await server.done;
  } else if(mode==='hook'&&args.length===0) {
    let text='';for await(const c of process.stdin){text+=c;if(Buffer.byteLength(text)>128*1024)throw Error();}
    let output;
    try{output=handleNativeHook(JSON.parse(text));}
    catch{output={decision:'deny',reason:'Psst native binding is unavailable. No automatic approval or unbound broker call is permitted.'};}
    process.stdout.write(JSON.stringify(output)+'\n');
  } else if(mode==='wait'&&args.length===2) {
    process.stdout.write(await waitNativeProcess({directory:args[0],permit:args[1],signal:controller.signal})+'\n');
  } else throw Error();
} catch {process.stderr.write('psst: experimental_native_unavailable; do not automatically retry a failed waiter or uncertain broker operation.\n');process.exitCode=1;}
finally{process.removeListener('SIGINT',stop);process.removeListener('SIGTERM',stop);}
