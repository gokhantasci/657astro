let aktifDurdur:(()=>void)|undefined;
for(const kok of document.querySelectorAll<HTMLElement>('[data-sesli]')){
 const q=<T extends HTMLElement>(s:string)=>kok.querySelector<T>(`[data-sesli-${s}]`)!;
 const motor=q<HTMLSelectElement>('motor'),oku=q<HTMLButtonElement>('oku'),dur=q<HTMLButtonElement>('dur'),durum=q('durum');
 const auto=q<HTMLInputElement>('otomatik');
 let worker:Worker|undefined,audio:HTMLAudioElement|undefined,url:string|undefined,token=0;
 const temizle=()=>{token++;worker?.terminate();worker=undefined;audio?.pause();audio=undefined;if(url)URL.revokeObjectURL(url);url=undefined;if('speechSynthesis'in window)window.speechSynthesis.cancel();dur.disabled=true;oku.disabled=false;};
 const bitir=()=>{temizle();durum.textContent='Okuma tamamlandı.';};
 const durdur=()=>{temizle();durum.textContent='Okuma durduruldu.';};
 const metin=()=>[...document.querySelectorAll<HTMLElement>(kok.dataset.sesliHedef!)].filter(e=>!e.closest('[aria-hidden="true"], [hidden]')).map(e=>e.textContent?.trim()).filter(Boolean).join('. ');
 const baslat=()=>{
  aktifDurdur?.();aktifDurdur=durdur;temizle();const text=metin();if(!text)return;
  dur.disabled=false;oku.disabled=true;durum.textContent='Ses hazırlanıyor…';const id=token;
  if(motor.value==='piper'){
   worker=new Worker(new URL('./piper.worker.ts',import.meta.url),{type:'module'});
   worker.onmessage=async e=>{
    if(id!==token)return;
    if(e.data.type==='progress')durum.textContent=`Piper modeli hazırlanıyor: %${e.data.value}`;
    if(e.data.type==='error'){temizle();durum.textContent='Piper yüklenemedi. Bağlantınızı kontrol edin veya tarayıcı sesini seçin.';}
    if(e.data.type==='audio'){
     url=URL.createObjectURL(e.data.wav);audio=new Audio(url);audio.onended=bitir;
     audio.onerror=()=>{temizle();durum.textContent='Ses oynatılamadı. Tekrar deneyin.';};
     try{await audio.play();if(id===token)durum.textContent='Piper ile okunuyor…';}catch{temizle();durum.textContent='Ses oynatılamadı. Sesli oku düğmesine tekrar basın.';}
    }
   };
   worker.onerror=()=>{temizle();durum.textContent='Piper başlatılamadı. Tarayıcı sesini seçebilirsiniz.';};worker.postMessage({text});
  }else{
   if(!('speechSynthesis'in window)){temizle();durum.textContent='Bu tarayıcıda sistem sesi yok. Piper seçeneğini kullanabilirsiniz.';return;}
   const speech=new SpeechSynthesisUtterance(text);speech.lang='tr-TR';
   const voice=window.speechSynthesis.getVoices().find(v=>v.lang.toLowerCase().startsWith('tr'));if(voice)speech.voice=voice;
   speech.onend=()=>{if(id===token)bitir();};speech.onerror=()=>{if(id===token){temizle();durum.textContent='Türkçe ses kullanılamadı. Piper seçeneğini deneyebilirsiniz.';}};
   window.speechSynthesis.speak(speech);durum.textContent='Okunuyor…';
  }
 };
 oku.addEventListener('click',baslat);dur.addEventListener('click',durdur);motor.addEventListener('change',durdur);
 auto?.addEventListener('change',()=>auto.checked?baslat():durdur());
 document.addEventListener('kart-degisti',()=>{if(auto?.checked)baslat();else if(!dur.disabled)durdur();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)durdur();});window.addEventListener('pagehide',temizle);
}
