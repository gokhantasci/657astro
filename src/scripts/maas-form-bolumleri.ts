// Uzun formun kapalı bölümlerinde mevcut seçimleri gösterir; hesap yapmaz.
const form=document.querySelector<HTMLFormElement>('#maas-form');
if(form){
 const field=(id:string)=>form.elements.namedItem(id) as HTMLInputElement|HTMLSelectElement;
 const text=(id:string)=>{const el=field(id);return el instanceof HTMLSelectElement?el.selectedOptions[0]?.textContent??'':el?.value??'';};
 const set=(n:number,value:string)=>{const el=form.querySelector(`[data-maas-bolum-ozet="${n}"]`);if(el)el.textContent=value;};
 const update=()=>{
  set(1,`${text('unvan')} · ${text('derece')} · ${text('hizmetYili')} yıl · ${text('gorevYeri')}`);
  set(2,`${text('ay')} · önceki matrah ${text('oncekiMatrah')||'0'} TL · ${text('gelirVergisiOrani')}`);
  const child=['kucuk','buyuk','engelliKucuk','engelliBuyuk'].reduce((sum,id)=>sum+Number(field(id)?.value||0),0);
  set(3,`Eş yardımı ${field('esCalismiyor').value==='1'?'var':'yok'} · ${child} çocuk`);
  set(4,`Sendika ${field('sendika').value==='1'?'üyesi':'üyeliği yok'} · BES ${field('bes').value==='1'?'%'+text('besOran'):'yok'} · yabancı dil ${text('yabanciDil')}`);
  set(5,form.querySelector<HTMLElement>('[data-m-ogretmen]')?.hidden?'Vergi istisnaları ve engellilik indirimi':'Öğretmen bilgileri, vergi istisnaları ve engellilik indirimi');
 };
 form.addEventListener('input',e=>queueMicrotask(()=>{update();if((e.target as HTMLElement).id==='unvan'){const teacher=form.querySelector<HTMLElement>('[data-m-ogretmen]');if(teacher&&!teacher.hidden){const parent=teacher.closest('details');if(parent)parent.open=true;}}}));form.addEventListener('change',()=>queueMicrotask(update));form.addEventListener('reset',()=>setTimeout(update));
 form.addEventListener('invalid',e=>{const el=e.target as HTMLElement;for(const d of form.querySelectorAll<HTMLDetailsElement>('details'))if(d.contains(el))d.open=true;},true);
 update();
}
