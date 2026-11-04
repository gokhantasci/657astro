import raw from '../data/hata-durumlari.json' with {type:'json'};
export type HataKodu=number|'4xx'|'5xx';
export const hataDurumlari=raw;
export function hataBilgisi(kod:HataKodu){
 return raw.find(h=>h.kod===kod)??(kod==='4xx'||typeof kod==='number'&&kod<500
  ?{kod,baslik:'İstek tamamlanamadı',aciklama:'Gönderdiğiniz istek işlenemedi. Bağlantıyı kontrol edebilir veya herkese açık araçlara dönebilirsiniz.',tekrar:false,arama:true}
  :{kod,baslik:'Sunucu isteği tamamlayamadı',aciklama:'Sunucuya erişirken bir sorun oluştu. Daha sonra yeniden deneyebilirsiniz.',tekrar:true,arama:false});
}
export function hataBasliklari(kod:number):Record<string,string>{
 return {'Cache-Control':'no-store','X-Robots-Tag':'noindex',
  ...([429,503].includes(kod)?{'Retry-After':'60'}:{}),
  ...(kod===405?{Allow:'GET, HEAD'}:{}),
  ...(kod===401?{'WWW-Authenticate':'Bearer realm="657.com.tr"'}:{}),
  ...(kod===407?{'Proxy-Authenticate':'Bearer realm="Ag gecidi"'}:{}),
  ...(kod===426?{Upgrade:'HTTP/1.1'}:{})};
}
