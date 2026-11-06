import {teftisWord,teftisCetvel} from '../lib/teftis-belge';
import {yerelYol} from '../lib/site-yolu';
import {dosyaIndir} from '../lib/belge-indir';
const frame=document.querySelector<HTMLIFrameElement>('[data-teftis-modul]');
if(frame){
 const systemTheme=matchMedia('(prefers-color-scheme: dark)');
 const theme=()=>frame.contentWindow?.postMessage({tur:'657-teftis-tema',tema:document.documentElement.dataset.theme??(systemTheme.matches?'dark':'light')},'*');
 frame.addEventListener('load',theme);new MutationObserver(theme).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
 systemTheme.addEventListener('change',theme);
 theme();
 let busy=false;
 window.addEventListener('message',async e=>{
  if(e.source!==frame.contentWindow)return;const d=e.data;
  if(d?.tur==='657-teftis-hazir'){theme();return;}
  if(d?.tur==='657-teftis-indir'&&d.dosya==='denetimtutanagi.docx'){
   const r=await fetch(yerelYol('/uygulamalar/teftis/denetimtutanagi.docx'));if(r.ok)dosyaIndir(await r.blob(),'denetimtutanagi.docx');return;
  }
  if(d?.tur==='657-teftis-boyut'){if(Number.isFinite(d.height))frame.style.height=Math.max(600,Math.min(30000,d.height))+'px';return;}
  if(d?.tur!=='657-teftis-belge'||!Number.isInteger(d.request))return;
  const reply=(data:object)=>frame.contentWindow?.postMessage({tur:'657-teftis-belge-yanit',request:d.request,...data},'*');
  if(busy){reply({hata:'Önceki belge hazırlanıyor.'});return;}busy=true;
  try{
   if(d.path==='/api/generate-cetvel.php'){
    const bytes=new Uint8Array(await teftisCetvel(d.payload));let raw='';for(const b of bytes)raw+=String.fromCharCode(b);
    reply({json:{ok:true,filled:true,base64:btoa(raw),filename:'terfi-cetveli.xls'}});
   }else if(['/api/byu_writer.php','/api/yimdenetim_writer.php'].includes(d.path)){
    const bytes=await teftisWord(d.path.includes('byu')?'byu':'yimdenetim',d.payload);reply({buffer:bytes});
   }else reply({hata:'Bu belge işlemi desteklenmiyor.'});
  }catch(error){reply({hata:(error as Error).message});}finally{busy=false;}
 });
}
