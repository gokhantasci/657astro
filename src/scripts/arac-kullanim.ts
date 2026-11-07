import {aracKullanildi} from './hesaplama-sayaci';
const tur=()=>document.querySelector<HTMLElement>('[data-hesap-sayaci]')?.dataset.hesapSayaci;
const imzalar=new WeakMap<HTMLElement,string>();
let hedef:Element|null=null,bilet=0,bekleyen:ReturnType<typeof setTimeout>|undefined,sorguTimer:ReturnType<typeof setTimeout>|undefined;
for(const name of ['input','change','click','submit'])document.addEventListener(name,event=>{
 if(!event.isTrusted)return;hedef=event.target instanceof Element?event.target:null;
 const id=++bilet,button=hedef?.closest('button');
 const reset=button&&(button.type==='reset'||[...button.attributes].some(a=>/^data-.*-(sifirla|temizle)$/.test(a.name)));
 if(name==='input'||name==='submit'||reset)clearTimeout(bekleyen);
 if(name==='input'||reset)clearTimeout(sorguTimer);
 if(reset){hedef=null;return;}
 setTimeout(()=>{if(bilet===id)hedef=null;},0);
},true);
document.addEventListener('reset',()=>{hedef=null;++bilet;clearTimeout(bekleyen);},true);
/** Sonuç başarıyla hesaplandıktan sonra çağrılır. Açılış, sıfırlama ve aynı girdi yeniden sayılmaz. */
export function aracSonucu(root:HTMLElement,imza?:unknown){
 const value=JSON.stringify(imza??(root instanceof HTMLFormElement?[...new FormData(root)].map(([k,v])=>[k,typeof v==='string'?v:v.name]):[]));
 if(!hedef||!root.contains(hedef)||imzalar.get(root)===value)return;
 const key=tur();if(!key)return;
 clearTimeout(bekleyen);bekleyen=setTimeout(()=>{imzalar.set(root,value);void aracKullanildi(key).then(ok=>{if(!ok&&imzalar.get(root)===value)imzalar.delete(root);});},500);
}
let sorguImzasi='';
export function aracSorgulandi(imza:unknown){
 const value=JSON.stringify(imza);if(value===sorguImzasi)return;
 clearTimeout(sorguTimer);sorguTimer=setTimeout(()=>{sorguImzasi=value;void aracKullanildi();},500);
}
export {aracKullanildi};

// Rehberlerde indirilen şablon, araç dizininde seçilen hesap ayrı bir kullanımdır.
document.addEventListener('click',async event=>{
 const key=tur(),a=(event.target as Element).closest<HTMLAnchorElement>('a[href]');
 if(!a||!key||!document.querySelector('main .page')?.contains(a))return;
 if(['durusma-kacagi','kanun-yolu'].includes(key)&&a.hasAttribute('download')){
  event.preventDefault();try{const r=await fetch(a.href);if(!r.ok)return;const blob=await r.blob();const {dosyaIndir}=await import('../lib/belge-indir');dosyaIndir(blob,a.download||'denetim.docx');void aracKullanildi(key);}catch{/* Başarısız indirme sayılmaz; bağlantı tekrar denenebilir. */}
 }else if(key==='hukuk-mahkemeleri'&&a.closest('.terimler'))void aracKullanildi(key);
});
