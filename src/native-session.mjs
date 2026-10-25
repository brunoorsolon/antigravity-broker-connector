import { join } from 'node:path';
import { Inbox, newSessionIdentity } from '../vendor/psst/reference/inbox.mjs';
import { BrokerClient } from '../vendor/psst/reference/client.mjs';
import { AdapterRuntime } from '../vendor/psst/reference/runtime.mjs';
import { createTools } from '../vendor/psst/reference/tools.mjs';
import { createCooperativeInbox } from './cooperative-inbox.mjs';
import { prepareStateRoot } from './connector-config.mjs';

/** Experimental native session. Caller owns the native hook permit boundary. */
export async function startNativeSession({config,conversationId,isAlive,signal,onDiagnostic=()=>{},onUnavailable=()=>{}}) {
  prepareStateRoot(config.stateRoot);
  const identity=newSessionIdentity('antigravity-cli');
  const inbox=new Inbox({directory:join(config.stateRoot,identity.client_id),identity});
  let client;
  try {client=new BrokerClient({url:config.brokerUrl,tokenFile:config.tokenFile,caFile:config.caFile,insecureDevelopment:config.insecureDevelopment===true,inbox});}
  catch(error){inbox.close();throw error;}
  let active=true,stopping,monitor,notified=false;
  const unavailable=()=>{if(!notified){notified=true;queueMicrotask(()=>{try{onUnavailable();}catch{}});}};
  const alive=()=>{
    let result=false;try{result=active&&!signal?.aborted&&isAlive()===true&&(!config.enrollment||Date.parse(config.enrollment.expiresAt)>Date.now());}catch{}
    if(!result)unavailable();return result;
  };
  const diagnostic=value=>{
    try{onDiagnostic(value);}catch{}
    if(['unauthenticated','forbidden','session_closed','session_mismatch','invalid_response','retry_window_elapsed'].includes(value.code)){active=false;unavailable();void close().catch(()=>{});}
  };
  const runtime=new AdapterRuntime({client,inbox,verifySession:alive,isAlive:alive,onDiagnostic:diagnostic});
  const close=()=>stopping??=(async()=>{active=false;clearInterval(monitor);try{await runtime.stop({closeSession:true});}finally{inbox.close();}})();
  const abort=()=>{void close().catch(()=>{});};signal?.addEventListener('abort',abort,{once:true});
  try {
    if(!alive())throw Error('native_host_unavailable');
    monitor=setInterval(()=>{if(!alive())void close().catch(()=>{});},1000);monitor.unref?.();
    await runtime.start(config.metadata);
    if(!alive())throw Error('native_host_unavailable');
    const tools={...createTools({client,inbox}),...createCooperativeInbox({inbox,isActive:alive}),
      broker_identity:async()=>({...identity,conversation_id:conversationId,endpoint_scope:'experimental_native_conversation',native_session_binding:true,automatic_delivery_certified:false})};
    return {identity,inbox,tools,async close(){signal?.removeEventListener('abort',abort);await close();}};
  } catch(error){signal?.removeEventListener('abort',abort);await close();throw error;}
}
