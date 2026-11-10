import type {KontrolKalemi} from '../lib/veri-kontrol';
type State=Record<string,{checked:boolean;fingerprint:string;at:string}>;
const data:{y:number;h:number;rows:KontrolKalemi[]}[]=JSON.parse(document.querySelector('#kontrol-veri')?.textContent??'[]');
const root=document.querySelector('.veri-kontrol');
if(root){
 const el=<T extends Element>(s:string)=>root.querySelector<T>(s)!;
 const year=el<HTMLSelectElement>('[data-kontrol-yil]'),half=el<HTMLSelectElement>('[data-kontrol-yari]'),search=el<HTMLInputElement>('[data-kontrol-ara]'),pending=el<HTMLInputElement>('[data-kontrol-bekleyen]');
 const key='657:veri-kontrol:v1';let state:State={};
 const error=(text:string)=>{el<HTMLElement>('[data-kontrol-hata]').hidden=false;el<HTMLElement>('[data-kontrol-hata]').textContent=text;};
 try{state=JSON.parse(localStorage.getItem(key)??'{}');}catch{error('Yerel kayıt okunamadı. Kontrolleri indirme düğmesiyle yedekleyin.');}
 const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
 const fingerprint=(r:KontrolKalemi)=>JSON.stringify([r.deger,r.kaynak,r.alan,r.girildi,r.surum]);
 const id=(r:KontrolKalemi)=>`${year.value}:${half.value}:${r.id}`;
 const checked=(r:KontrolKalemi)=>state[id(r)]?.checked&&state[id(r)]?.fingerprint===fingerprint(r);
 function render(){const rows=data.find(d=>String(d.y)===year.value&&String(d.h)===half.value)?.rows??[];
  el('[data-kontrol-ozet]').textContent=`${rows.filter(checked).length} / ${rows.length} kaynak kontrolü tamamlandı · ${rows.filter(r=>r.girildi).length} kalemde dönem kaydı var.`;
  el('[data-kontrol-satirlar]').innerHTML=rows.filter(r=>(!pending.checked||!checked(r))&&`${r.ad} ${r.dosya} ${r.alan}`.toLocaleLowerCase('tr').includes(search.value.toLocaleLowerCase('tr'))).map(r=>`<tr><td><label><input type="checkbox" data-kontrol-id="${esc(r.id)}" ${checked(r)?'checked':''} aria-label="${esc(r.ad)} kontrol ettim" />Kontrol ettim</label><small><label><input type="checkbox" disabled ${r.girildi?'checked':''} aria-label="Dönem verisi girildi" />${r.girildi?'Veri girildi':'Veri / güncellik bekleniyor'}</label></small></td><th scope="row">${esc(r.ad)}<small>${esc(r.donem)}</small>${r.deger?'<small>'+esc(r.deger)+'</small>':''}</th><td><a href="https://github.com/gokhantasci/657astro/edit/main/${esc(r.dosya)}" target="_blank" rel="noopener noreferrer">Dosyayı düzenle</a><br/><code>${esc(r.dosya)}</code><small>${esc(r.alan)}</small></td><td><a href="${esc(r.kaynak)}" target="_blank" rel="noopener noreferrer">Resmî kaynak</a><small>${esc(r.yayin)}</small></td></tr>`).join('');
 }
 root.addEventListener('change',e=>{const t=e.target as HTMLInputElement;if(t.dataset.kontrolId){const row=data.find(d=>String(d.y)===year.value&&String(d.h)===half.value)!.rows.find(r=>r.id===t.dataset.kontrolId)!;state[id(row)]={checked:t.checked,fingerprint:fingerprint(row),at:new Date().toISOString()};try{localStorage.setItem(key,JSON.stringify(state));}catch{error('Tarayıcı kaydı engellendi. İndirme düğmesiyle yedekleyin.');}}render();});search.addEventListener('input',render);
 el('[data-kontrol-indir]').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({version:1,state},null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=`657-kontrol-${year.value}-${half.value}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
 el<HTMLInputElement>('[data-kontrol-yukle]').addEventListener('change',async e=>{try{const file=(e.target as HTMLInputElement).files?.[0];if(!file)return;const d=JSON.parse(await file.text());if(d.version!==1||!d.state||typeof d.state!=='object'||Array.isArray(d.state)||!Object.values(d.state).every((v:any)=>v&&typeof v.checked==='boolean'&&typeof v.fingerprint==='string'&&typeof v.at==='string'))throw Error();state=d.state;localStorage.setItem(key,JSON.stringify(state));render();}catch{error('Yedek okunamadı; geçerli bir 657 kontrol JSON dosyası seçin.');}});
 render();
}
