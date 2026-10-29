/// <reference lib="webworker" />
import {TtsSession} from '@mintplex-labs/piper-tts-web';
let session:Promise<TtsSession>|undefined;
self.onmessage=async(e:MessageEvent<{text:string}>)=>{
 try{
  session??=TtsSession.create({voiceId:'tr_TR-fahrettin-medium',progress:p=>self.postMessage({type:'progress',value:p.total?Math.min(100,Math.round(p.loaded/p.total*100)):0})});
  const wav=await(await session).predict(e.data.text);
  self.postMessage({type:'audio',wav});
 }catch(e){session=undefined;self.postMessage({type:'error',message:(e as Error).message});}
};
