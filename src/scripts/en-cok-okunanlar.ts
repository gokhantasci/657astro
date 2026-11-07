type Kayit={grup:string;baslik:string;yol:string};
type Ozet={donem:string;ilkGun:string;sonGun:string;baslangic:string;okunmalar:{path:string;sayi:number}[]};
const root=document.querySelector<HTMLElement>('[data-okunanlar]');
if(root){
 const durum=root.querySelector<HTMLElement>('[data-okunanlar-durum]')!;
 const listeler=root.querySelector<HTMLElement>('[data-okunanlar-listeler]')!;
 const tekrar=root.querySelector<HTMLButtonElement>('[data-okunanlar-tekrar]')!;
 const olcum=root.querySelector<HTMLElement>('[data-okunanlar-olcum]')!;
 const buttons=[...root.querySelectorAll<HTMLButtonElement>('[data-donem]')];
 let secim='bugun',sira=0;
 let katalog:Promise<Kayit[]>|undefined;
 const json=async(url:string)=>{const r=await fetch(url);if(!r.ok)throw new Error('Veri alınamadı');return r.json();};
 async function yukle(donem:string){
  const istek=++sira;secim=donem;
  buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.donem===donem)));
  root!.dataset.durum='yukleniyor';listeler.setAttribute('aria-busy','true');tekrar.hidden=true;
  durum.textContent='Okunma sıralamaları yükleniyor…';
  // Önceki dönemin içeriğini yeni dönemin başlığı altında göstermeyin.
  root!.querySelectorAll('ol').forEach(ol=>ol.replaceChildren());
  try{
   katalog??=json('/okunma-katalogu.json').catch(e=>{katalog=undefined;throw e;});
   const [kayitlar,ozet]:[Kayit[],Ozet]=await Promise.all([katalog,json(`/_657-servis/api/okunma/siralama?donem=${donem}`)]);
   if(istek!==sira)return;
   const sayilar=new Map(ozet.okunmalar.map(k=>[k.path,k.sayi]));
   root!.querySelectorAll<HTMLOListElement>('[data-okunanlar-grup]').forEach(ol=>{
    const rows=kayitlar.filter(k=>k.grup===ol.dataset.okunanlarGrup).map(k=>({...k,sayi:sayilar.get(k.yol)??0})).sort((a,b)=>b.sayi-a.sayi||a.baslik.localeCompare(b.baslik,'tr')||a.yol.localeCompare(b.yol)).slice(0,5);
    ol.replaceChildren(...rows.map(k=>{
     const li=document.createElement('li'),a=document.createElement('a'),span=document.createElement('span');
     a.href=k.yol;a.textContent=k.baslik;span.textContent=k.sayi.toLocaleString('tr-TR');span.setAttribute('aria-label',`${k.sayi.toLocaleString('tr-TR')} görüntülenme`);span.title=k.sayi?`${k.sayi.toLocaleString('tr-TR')} görüntülenme`:'Bu dönemde henüz görüntülenme yok';
     li.append(a,span);return li;
    }));
   });
   const tarih=(s:string)=>new Date(`${s}T12:00:00+03:00`).toLocaleDateString('tr-TR');
   durum.textContent=`${ozet.ilkGun===ozet.sonGun?tarih(ozet.sonGun):`${tarih(ozet.ilkGun)} – ${tarih(ozet.sonGun)}`} · Görüntülenme sayısına göre`;
   olcum.textContent=`Türkiye saati · Günlük ölçüm başlangıcı: ${new Date(ozet.baslangic).toLocaleDateString('tr-TR',{timeZone:'Europe/Istanbul'})}. Eşit sayılarda alfabetik sıra kullanılır.`;olcum.hidden=false;
   root!.dataset.durum='hazir';
  }catch{
   if(istek!==sira)return;
   durum.textContent='Okunma sıralamaları alınamadı. Yeniden deneyebilirsiniz.';tekrar.hidden=false;root!.dataset.durum='hata';
  }finally{if(istek===sira)listeler.setAttribute('aria-busy','false');}
 }
 buttons.forEach(b=>b.addEventListener('click',()=>{void yukle(b.dataset.donem!);}));
 tekrar.addEventListener('click',()=>{void yukle(secim);});
 void yukle(secim);
}
