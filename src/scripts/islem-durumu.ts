export type IslemDurumu='idle'|'loading'|'success'|'error';
export function islemDurumunuYaz(root:HTMLElement,state:IslemDurumu,metin:string){
 const box=root.querySelector<HTMLElement>('[data-islem-durumu]');if(!box)return;
 box.dataset.state=state;box.setAttribute('role',state==='error'?'alert':'status');
 root.querySelector('[data-islem-alani]')?.setAttribute('aria-busy',String(state==='loading'));
 const text=box.querySelector('[data-islem-metni]');if(text)text.textContent=metin;
}
