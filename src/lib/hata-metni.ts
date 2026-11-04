/** Worker, WebGPU ve ağ katmanları Error dışındaki değerleri de fırlatabilir. */
export function hataMetni(hata: unknown, varsayilan = 'Model başlatılamadı. Tarayıcınızı güncelleyip WebGPU desteğini ve boş GPU belleğini kontrol edin.', derinlik=0): string {
 if(derinlik>4)return varsayilan;
 if (typeof hata === 'string' && hata.trim()) return hata.trim();
 if (hata && typeof hata === 'object') {
  const h = hata as {message?:unknown; error?:unknown; cause?:unknown};
  if (typeof h.message === 'string' && h.message.trim()) return h.message.trim();
  if (h.error && h.error !== hata) return hataMetni(h.error, varsayilan,derinlik+1);
  if (h.cause && h.cause !== hata) return hataMetni(h.cause, varsayilan,derinlik+1);
 }
 return varsayilan;
}
