import {aracKullanildi} from './hesaplama-sayaci';
const tur=()=>document.querySelector<HTMLElement>('[data-hesap-sayaci]')?.dataset.hesapSayaci;
const imzalar=new WeakMap<HTMLElement,string>();
const acilisHesaplari=new WeakSet<HTMLElement>();
/** Adresteki seçimler uygulandıktan sonra başlangıç hesabını çalıştırır.
 * Yalnız hesap başarılı olup aracSonucu çağrıldığında kullanım kaydedilir. */
export function otomatikHesapla(root:HTMLElement,hesapla:()=>void){
 setTimeout(()=>{acilisHesaplari.add(root);try{hesapla();}finally{acilisHesaplari.delete(root);}},0);
}
export function aracSonucuIptal(){clearTimeout(bekleyen);}
let hedef:Element|null=null,hedefYolu:EventTarget[]=[],bilet=0,bekleyen:ReturnType<typeof setTimeout>|undefined,sorguTimer:ReturnType<typeof setTimeout>|undefined;
for(const name of ['input','change','click','submit','keydown'])document.addEventListener(name,event=>{
 // Menü listesi body altındadır. Gerçek tıklama/tuşun aynı olay akışında
 // select'e ilettiği input/change, hesabın bulunduğu formu hedeflemelidir.
 if(!event.isTrusted&&!(event.target instanceof HTMLSelectElement&&hedef?.closest('[role=option],.secim')))return;hedef=event.target instanceof Element?event.target:null;
 hedefYolu=event.composedPath();
 const id=++bilet,button=hedef?.closest('button');
 const reset=button&&(button.type==='reset'||[...button.attributes].some(a=>/^data-.*-(sifirla|temizle)$/.test(a.name)));
 if(name==='input'||name==='submit'||reset)clearTimeout(bekleyen);
 if(name==='input'||reset)clearTimeout(sorguTimer);
 if(reset){hedef=null;return;}
 setTimeout(()=>{if(bilet===id){hedef=null;hedefYolu=[];}},0);
},true);
document.addEventListener('reset',()=>{hedef=null;++bilet;clearTimeout(bekleyen);},true);
/** Başarılı başlangıç hesabı ve kullanıcının yeni hesabı birer kez sayılır. */
export function aracSonucu(root:HTMLElement,imza?:unknown){
 const acilista=acilisHesaplari.has(root);
 if(acilista)root.dataset.otomatikHesap='1';
 const value=JSON.stringify(imza??(root instanceof HTMLFormElement?[...new FormData(root)].map(([k,v])=>[k,typeof v==='string'?v:v.name]):[]));
 // Silme düğmesi sonuç çizilirken DOM'dan ayrılmış olabilir; özgün olay yolu korunur.
 if((!acilista&&(!hedef||(!root.contains(hedef)&&!hedefYolu.includes(root))))||imzalar.get(root)===value)return;
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
 }else if(['hukuk-mahkemeleri','hukuki-hesaplamalar'].includes(key)&&a.closest('.terimler'))void aracKullanildi(key);
});
