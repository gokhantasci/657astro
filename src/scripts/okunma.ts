// Genel sayaç derlemede WP + GA4'ten gelir. Yerel ziyaret ayrı gösterilir, genel istatistiğe eklenmez.
const yollar=new Map<string,number>();
for(const el of document.querySelectorAll<HTMLElement>('[data-okunma-path]')){
 const path=el.dataset.okunmaPath!;let n=yollar.get(path);
 if(n===undefined){
  try{const key='657:ziyaret:'+path,onceki=Number(localStorage.getItem(key));n=(Number.isSafeInteger(onceki)&&onceki>=0?onceki:0)+1;localStorage.setItem(key,String(n));}
  catch{n=1;}
  yollar.set(path,n);
 }
 const yerel=el.querySelector<HTMLElement>('[data-okunma-yerel]');
 if(yerel){yerel.textContent=` · Bu tarayıcıda ${n.toLocaleString('tr-TR')} ziyaret`;yerel.hidden=false;}
}
