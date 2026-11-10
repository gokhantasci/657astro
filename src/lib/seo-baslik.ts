// Anlamı ayıran son bölüm (soru, görüş tarihi/sayısı) 65 karakterlik
// ortak bir öneke indirgenmez. Görünen H1'e dokunulmaz.
export function metaBaslik(title:string){
 const temiz=title.replace(/\s+/g,' ').trim();if(temiz.length<=150)return temiz;
 const suffix=temiz.endsWith(' | 657.com.tr')?' | 657.com.tr':'';
 const core=suffix?temiz.slice(0,-suffix.length):temiz;
 return core.slice(0,85).replace(/\s+\S*$/,'')+'… '+core.slice(-48).replace(/^\S*\s/,'')+suffix;
}
