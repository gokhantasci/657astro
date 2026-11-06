/* 657.com.tr: izole teftiş motoru. Dosyalar yalnız tarayıcı belleğinde işlenir. */
(()=>{
 // Kaynak motorların HTML ile çizdiği hücrelerde dosya içeriği kod olamaz.
 const handlers={"document.getElementById('excelInput').click()":'excel-pick','openToplamModal()':'toplam','cellClickHandler(this)':'cell','window.kesinlestirmeExportToExcel()':'infaz-excel'};
 let cleaning=false;
 const clean=value=>{if(cleaning)return value;cleaning=true;try{return DOMPurify.sanitize(String(value??'').replace(/\sonclick="([^"]*)"/gi,(_,code)=>handlers[code]?' data-teftis-action="'+handlers[code]+'"':''),{FORBID_TAGS:['script','iframe','object','embed','style','link','meta','img','svg','math'],ADD_ATTR:['target','download'],RETURN_TRUSTED_TYPE:false});}finally{cleaning=false;}};
 const inner=Object.getOwnPropertyDescriptor(Element.prototype,'innerHTML');
 Object.defineProperty(Element.prototype,'innerHTML',{...inner,set(value){inner.set.call(this,clean(value));}});
 const adjacent=Element.prototype.insertAdjacentHTML;Element.prototype.insertAdjacentHTML=function(position,value){return adjacent.call(this,position,clean(value));};
 const memory=new Map();window.teftisStorage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)};
 const pending=new Map();let id=0;
 window.fetch=async(url,options={})=>{
  const path=String(url);
  if(!['/api/generate-cetvel.php','/api/byu_writer.php','/api/yimdenetim_writer.php'].includes(path))return new Response('',{status:404});
  return new Promise((resolve,reject)=>{const request=++id;const timer=setTimeout(()=>{pending.delete(request);reject(Error('Belge hazırlanamadı; yeniden deneyin.'));},60000);pending.set(request,{resolve,reject,timer});parent.postMessage({tur:'657-teftis-belge',request,path,payload:JSON.parse(options.body||'{}')},'*');});
 };
 addEventListener('message',e=>{
  if(e.source!==parent)return;const data=e.data;
  if(data?.tur==='657-teftis-tema'&&(data.tema==='dark'||data.tema==='light')){document.documentElement.dataset.bsTheme=data.tema;document.documentElement.dataset.theme=data.tema;return;}
  if(data?.tur!=='657-teftis-belge-yanit')return;
  const req=pending.get(data.request);if(!req)return;clearTimeout(req.timer);pending.delete(data.request);
  if(data.hata){req.reject(Error(data.hata));return;}
  req.resolve(new Response(data.json?JSON.stringify(data.json):data.buffer,{status:200,headers:{'Content-Type':data.json?'application/json':'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}}));
 });
 window.toast=({title='',body=''})=>{let box=document.getElementById('657-bildirim');if(!box){box=document.createElement('p');box.id='657-bildirim';box.setAttribute('role','status');document.body.prepend(box);}const template=document.createElement('template');template.innerHTML=String(body);template.content.querySelectorAll('script,style,.material-symbols-rounded').forEach(n=>n.remove());box.textContent=title+(title&&body?' · ':'')+(template.content.textContent||'').replace(/\s+/g,' ').trim();};
 // Sayaç/örnek veri için eski ağ uçlarına istek gönderilmez.
 addEventListener('DOMContentLoaded',()=>{
  parent.postMessage({tur:'657-teftis-hazir'},'*');
  document.addEventListener('click',e=>{const a=e.target.closest?.('a[href]'),href=a?.getAttribute('href');if(href?.includes('denetimtutanagi.docx')){e.preventDefault();parent.postMessage({tur:'657-teftis-indir',dosya:'denetimtutanagi.docx'},'*');return;}const base=window.teftisBasePath||'';if(base&&href?.startsWith('/')&&!href.startsWith('//')&&!href.startsWith(base+'/'))a.setAttribute('href',base+href);});
  document.addEventListener('click',e=>{const node=e.target.closest?.('[data-teftis-action]');if(!node)return;const action=node.dataset.teftisAction;if(action==='excel-pick')document.getElementById('excelInput')?.click();if(action==='toplam')window.openToplamModal?.();if(action==='cell')window.cellClickHandler?.(node);if(action==='infaz-excel')window.kesinlestirmeExportToExcel?.();});
  if(window.jQuery){jQuery.getJSON=()=>({fail:()=>{}});jQuery.ajax=()=>({fail:()=>{}});}
  document.querySelectorAll('a[href]').forEach(a=>{const href=a.getAttribute('href');if(href?.startsWith('/')){a.target='_top';}});
  const dates=node=>{
   const w=document.createTreeWalker(node,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentElement?.closest('script,style,textarea,input,select,code,pre')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
   for(let n=w.nextNode();n;n=w.nextNode()){const s=n.nodeValue;const t=window.teftisTarihMetni?window.teftisTarihMetni(s):s;if(s!==t)n.nodeValue=t;}
  };
  const update=()=>{dates(document.body);parent.postMessage({tur:'657-teftis-boyut',height:Math.max(600,document.body.scrollHeight+30)},'*');};
  let timer;new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(update,80);}).observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class','style','hidden']});
  new ResizeObserver(()=>{clearTimeout(timer);timer=setTimeout(update,80);}).observe(document.body);update();
 });
})();
