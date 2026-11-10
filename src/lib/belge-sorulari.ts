import {genelgeSorusu} from './genelge-soru-basliklari';

export interface BelgeSayfasi{no:number;metin:string;yontem?:string;guven?:number}
export interface BelgeSorusu{soru:string;cevap:string;sayfa:number}

const duz=(s:string)=>s.replace(/\s+/g,' ').trim();

export function cleanDpbTitle(raw:string):string{
 let s=(raw||'').trim();
 s=s.replace(/\s*\(\s*\d{1,2}[./]\d{1,2}[./]\d{2,4}[^)]*\)\s*$/i,'');
 s=s.replace(/\s*\(\s*\d+[\s\S]*?\)\s*$/i,'');
 s=s.replace(/(?:hk\.?|hakkında|ilişkin)?\s*[\.\s]*\d{1,2}[./]\d{1,2}[./]\d{2,4}\s*[-–—]?\s*\d*\s*$/i,'');
 s=s.replace(/\s*\d{1,2}[./]\d{1,2}[./]\d{2,4}\s*$/i,'');
 s=s.replace(/[\"“”’]/g,'');
 s=s.replace(/\s*(?:hk\.?|hakkında|hususunda|hususlarında|ilişkin|dair)\.?$/i,'');
 s=s.replace(/\s*(?:ile\s+ilgili|konusunda|hususunda)\s+(?:görüş|bilgi)\s+talebi$/i,'');
 s=s.replace(/\s+talebi$/i,'');
 s=s.replace(/\s+hususu$/i,'');
 s=s.replace(/\s*(?:hk\.?|hakkında|hususunda|ilişkin)\.?$/i,'');
 s=s.replace(/\s*\([^)]*\)\s*$/i,'');
 s=s.replace(/\s*(?:hk\.?|hakkında|hususunda|ilişkin)\.?$/i,'');
 return s.trim().replace(/^[–\-—\s]+/,'').replace(/[\.\s]+$/,'');
}

export function dpbAnaSorusu(rawBaslik:string):string{
 let s=cleanDpbTitle(rawBaslik);
 if(!s)return 'Bu konu hakkında DPB mütalaası ve hukuki değerlendirmesi nedir?';

 const narrativeMatch=s.match(/(?:bahisle|belirten ve|belirterek|açıklamada bulunarak)[,\s]+([\s\S]+)$/i);
 if(narrativeMatch&&narrativeMatch[1].trim().length>=25){
  s=narrativeMatch[1].trim();
 }else if(s.length>175){
  const parts=s.split(/;\s*|\.\s+/);
  if(parts.length>1&&parts.at(-1)!.length>=25){
   s=parts.at(-1)!.trim();
  }
 }

 s=s.replace(/\s+(?:dair|ilişkin|hakkında|hususunda|hususlarında)$/i,'');

 const rules:[RegExp,string][]=[
  [/Aday memur(?:un| olarak çalışmakta olan personelin)? KPSS süreci sonunda başka kurumun memur kadrosuna yerleştirilmesi/i,'Aday memur olarak çalışırken KPSS sonucunda başka kurumun memur kadrosuna yerleştirilen personelin muvafakat verilerek atanması mümkün müdür?'],

  [/(?:atanıp\s+atanamayacağı|atanıp\s+atanmayacağı|atanıp\s+atanamayacağına|atanıp\s+atanmayacağına|atanıp\s+atanamayacakları|atanıp\s+atanmayacakları|atanıp\s+atanamayacağınız)$/i,'atanabilir mi?'],
  [/(?:verilip\s+verilemeyeceği|verilip\s+verilmeyeceği|verilip\s+verilemeyeceğine|verilip\s+verilmeyeceğine|verilip\s+verilemeyecekleri)$/i,'verilebilir mi?'],
  [/(?:yapılıp\s+yapılamayacağı|yapılıp\s+yapılmayacağı|yapılıp\s+yapılamayacağına|yapılıp\s+yapılmayacağına)$/i,'yapılabilir mi?'],
  [/(?:ödenip\s+ödenemeyeceği|ödenip\s+ödenmeyeceği|ödenip\s+ödenemeyeceğine|ödenip\s+ödenmeyeceğine)$/i,'ödenebilir mi?'],
  [/(?:değerlendirilip\s+değerlendirilemeyeceği|değerlendirilip\s+değerlendirilmeyeceği|değerlendirilip\s+değerlendirilemeyeceğine|değerlendirilip\s+değerlendirilmeyeceğine)$/i,'değerlendirilebilir mi?'],
  [/(?:uygulanıp\s+uygulanamayacağı|uygulanıp\s+uygulanmayacağı|uygulanıp\s+uygulanamayacağına)$/i,'uygulanabilir mi?'],
  [/(?:yararlanıp\s+yararlanamayacağı|yararlanıp\s+yararlanmayacağı|yararlanıp\s+yararlanamayacakları|yararlanıp\s+yararlanamayacağına)$/i,'yararlanabilir mi?'],
  [/(?:faydalanıp\s+faydalanamayacağı|faydalanıp\s+faydalanmayacağı|faydalanıp\s+faydalanamayacağına)$/i,'faydalanabilir mi?'],
  [/(?:yararlandırılıp\s+yararlandırılamayacağı|yararlandırılıp\s+yararlandırılmayacağı)$/i,'yararlandırılabilir mi?'],
  [/(?:çekilmiş\s+sayılıp\s+sayılmayacağı|çekilmiş\s+sayılıp\s+sayılamayacağı)$/i,'çekilmiş sayılır mı?'],
  [/(?:sayılıp\s+sayılamayacağı|sayılıp\s+sayılmayacağı|sayılıp\s+sayılmayacağına|sayılıp\s+sayılamayacağına)$/i,'sayılır mı?'],
  [/(?:edilip\s+edilemeyeceği|edilip\s+edilmeyeceği|edilip\s+edilemeyeceğine)$/i,'edilebilir mi?'],
  [/(?:edip\s+edemeyeceği|edip\s+etmeyeceği|edip\s+edemeyecekleri)$/i,'edebilir mi?'],
  [/(?:alınıp\s+alınamayacağı|alınıp\s+alınmayacağı|alınıp\s+alınamayacağına)$/i,'alınabilir mi?'],
  [/(?:alıp\s+alamayacağı|alıp\s+alamayacakları|alıp\s+alamayacağına)$/i,'alabilir mi?'],
  [/(?:verip\s+veremeyeceği|verip\s+veremeyecekleri|verip\s+veremeyeceğine)$/i,'verebilir mi?'],
  [/(?:gerekip\s+gerekmediği|gerekip\s+gerekmediğine)$/i,'gerekir mi?'],
  [/(?:tutulup\s+tutulmayacağı|tutulup\s+tutulamayacağı|tutulup\s+tutulmayacağına)$/i,'tutulur mu?'],
  [/(?:çalışıp\s+çalışamayacağı|çalışıp\s+çalışamayacağına)$/i,'çalışabilir mi?'],
  [/(?:çalıştırılıp\s+çalıştırılamayacağı)$/i,'çalıştırılabilir mi?'],
  [/(?:yapıp\s+yapamayacağı|yapıp\s+yapamayacakları|yapıp\s+yapamayacağına)$/i,'yapabilir mi?'],
  [/(?:yürütüp\s+yürütemeyeceği|yürütüp\s+yürütemeyeceğine)$/i,'yürütebilir mi?'],
  [/(?:kullanıp\s+kullanamayacağı|kullanıp\s+kullanamayacağına|kullanıp\s+kullanamayacakları)$/i,'kullanabilir mi?'],
  [/(?:başlayıp\s+başlayamayacağı|başlayıp\s+başlayamayacağına)$/i,'başlayabilir mi?'],
  [/(?:başlatılıp\s+başlatılamayacağı|başlatılıp\s+başlatılamayacağına)$/i,'başlatılabilir mi?'],
  [/(?:geçip\s+geçemeyeceği|geçip\s+geçemeyeceğine)$/i,'geçebilir mi?'],
  [/(?:dönüp\s+dönemeyeceği|dönüp\s+dönemeyeceğine)$/i,'dönebilir mi?'],
  [/(?:katılıp\s+katılmayacağı|katılıp\s+katılamayacağı)$/i,'katılır mı?'],
  [/(?:silinip\s+silinemeyeceği|silinip\s+silinmeyeceği)$/i,'silinebilir mi?'],
  [/(?:kesilip\s+kesilmeyeceği|kesilip\s+kesilemeyeceği)$/i,'kesilir mi?'],
  [/(?:onaylanıp\s+onaylanmayacağı)$/i,'onaylanır mı?'],
  [/(?:kapsayıp\s+kapsamadığı)$/i,'kapsar mı?'],
  [/(?:incelenip\s+incelenemeyeceği|incelenip\s+incelenmeyeceği)$/i,'incelenebilir mi?'],
  [/(?:aranıp\s+aranmayacağı|aranıp\s+aranamayacağı)$/i,'aranır mı?'],
  [/(?:isteyip\s+isteyemeyeceği|isteyip\s+isteyemeyecekleri)$/i,'isteyebilir mi?'],
  [/(?:çıkıp\s+çıkamayacağı|çıkıp\s+çıkamayacakları)$/i,'çıkabilir mi?'],
  [/(?:ayrılıp\s+ayrılamayacağı|ayrılıp\s+ayrılamayacakları)$/i,'ayrılabilir mi?'],
  [/(?:kurulup\s+kurulamayacağı)$/i,'kurulabilir mi?'],
  [/(?:açılıp\s+açılamayacağı)$/i,'açılabilir mi?'],
  [/(?:düzenlenip\s+düzenlenemeyeceği)$/i,'düzenlenebilir mi?'],
  [/(?:başvurup\s+başvuramayacağı)$/i,'başvurabilir mi?'],
  [/(?:gönderilip\s+gönderilemeyeceği)$/i,'gönderilebilir mi?'],
  [/(?:görüşülüp\s+görüşülemeyeceği|görüşüleceği)$/i,'görüşülebilir mi?'],
  [/(?:uzatılıp\s+uzatılamayacağı|uzatılıp\s+uzatılamayacağına)$/i,'uzatılabilir mi?'],
  [/(?:görevlendirilip\s+görevlendirilemeyeceği|görevlendirilemeyeceği)$/i,'görevlendirilebilir mi?'],
  [/(?:üstlenip\s+üstlenemeyeceği)$/i,'üstlenebilir mi?'],
  [/(?:dikkate\s+alınıp\s+alınmayacağı|dikkate\s+alınıp\s+alınmayacağına)$/i,'dikkate alınır mı?'],
  [/(?:çevrilip\s+çevrilmeyeceği|çevrilip\s+çevrilemeyeceği)$/i,'çevrilebilir mi?'],
  [/(?:olup\s+olamayacağı|olup\s+olamayacağına|olup\s+olamayacakları|olup\s+olamayacaklarına)$/i,'olabilir mi?'],
  [/(?:olup\s+olmadığı|olup\s+olmadığına)$/i,'mümkün müdür?'],
  [/(?:bulunup\s+bulunmadığı|bulunmadığı|bulunup\s+bulunmadığına)$/i,'bulunmakta mıdır?'],
  [/(?:tabi\s+olup\s+olmadığı|tabi\s+olup\s+olmadığına|tabi\s+olup\s+olmayacağına)$/i,'tabi midir?'],
  [/(?:tabi\s+olmadığı|tabi\s+olmayacakları|tabi\s+olmadıklarına)$/i,'tabi midir?'],
  [/(?:tabi\s+olduğu|tabi\s+oldukları)$/i,'tabi midir?'],
  [/(?:tabi\s+tutulamayacağı)$/i,'tabi tutulur mu?'],
  [/(?:sayılacağı|sayılacakları)$/i,'sayılır mı?'],

  // Mümkünlük / Cevaz
  [/(?:atanmasının|atanmalarının)\s+mümkün\s+olduğu$/i,'atanması mümkün müdür?'],
  [/(?:atanmasının|atanmalarının)\s+mümkün\s+bulunmadığı$/i,'atanması mümkün müdür?'],
  [/(?:atanmasının|atanmalarının)\s+mümkün\s+olup\s+olmadığı$/i,'atanması mümkün müdür?'],
  [/(?:geçişinin|geçişlerinin)\s+mümkün\s+olduğu$/i,'geçişi mümkün müdür?'],
  [/(?:ödenmesinin|ödenmelerinin)\s+mümkün\s+olduğu$/i,'ödenmesi mümkün müdür?'],
  [/(?:ödenmesinin|ödenmelerinin)\s+mümkün\s+bulunmadığı$/i,'ödenmesi mümkün müdür?'],
  [/(?:verilmesinin|verilmelerinin)\s+mümkün\s+olduğu$/i,'verilmesi mümkün müdür?'],
  [/(?:yararlanmasının|yararlanmalarının)\s+mümkün\s+olduğu$/i,'yararlanması mümkün müdür?'],
  [/(?:yararlanmasının|yararlanmalarının)\s+mümkün\s+bulunmadığı$/i,'yararlanması mümkün müdür?'],
  [/(?:sayılmasının|sayılmalarının)\s+mümkün\s+olduğu$/i,'sayılması mümkün müdür?'],
  [/(?:sayılmasının|sayılmalarının)\s+mümkün\s+bulunmadığı$/i,'sayılması mümkün müdür?'],
  [/(?:kullanmasının|kullanmalarının)\s+mümkün\s+olduğu$/i,'kullanması mümkün müdür?'],
  [/(?:mümkün\s+olduğu|mümkün\s+olacağı)$/i,'mümkün müdür?'],
  [/(?:mümkün\s+bulunmadığı|mümkün\s+olmadığı)$/i,'mümkün müdür?'],
  [/mümkün\s+olup\s+olmadığı$/i,'mümkün müdür?'],
  [/bir\s+sakınca\s+bulunmadığı$/i,'bir sakınca var mıdır?'],
  [/sakınca\s+bulunmadığı$/i,'sakınca var mıdır?'],
  [/sakınca\s+olmadığı$/i,'sakınca var mıdır?'],
  [/engel\s+bulunmadığı$/i,'engel var mıdır?'],
  [/engel\s+olmadığı$/i,'engel var mıdır?'],
  [/aykırılık\s+teşkil\s+etmeyeceği$/i,'aykırılık teşkil eder mi?'],
  [/aykırılık\s+teşkil\s+etmeyeceğine$/i,'aykırılık teşkil eder mi?'],
  [/aykırılık\s+teşkil\s+edip\s+etmediği$/i,'aykırılık teşkil eder mi?'],
  [/bir\s+defaya\s+mahsus\s+olacağı$/i,'bir defaya mahsus mudur?'],
  [/(?:uygun\s+olacağı|uygun\s+olduğu)$/i,'uygun mudur?'],
  [/gerek\s+olmadığı$/i,'gerekir mi?'],
  [/takdirinde\s+olduğu$/i,'kurumun takdirinde midir?'],

  // Gereklilik / Hesaplama / Usul
  [/(?:hesaplanması\s+gerektiği)$/i,'nasıl hesaplanır?'],
  [/(?:hesaba\s+katılması\s+gerektiği)$/i,'hesaba katılır mı?'],
  [/(?:yapılması\s+gerektiği)$/i,'nasıl yapılmalıdır?'],
  [/(?:alınması\s+gerektiği)$/i,'nasıl alınmalıdır?'],
  [/(?:ödenmesi\s+gerektiği)$/i,'nasıl ödenmelidir?'],
  [/(?:uygulanması\s+gerektiği)$/i,'nasıl uygulanmalıdır?'],
  [/(?:belirlenmesi\s+gerektiği)$/i,'nasıl belirlenmelidir?'],
  [/(?:değerlendirilmesi\s+gerektiği)$/i,'nasıl değerlendirilmelidir?'],
  [/(?:başlatılması\s+gerektiği|başlatılması\s+zorunluluğu)$/i,'başlatılması zorunlu mudur?'],
  [/(?:incelenmesi\s+gerektiği)$/i,'nasıl incelenmelidir?'],
  [/(?:dolmuş\s+olması\s+gerektiği)$/i,'dolmuş olması zorunlu mudur?'],
  [/(?:esas\s+alınması\s+gereken\s+tarih)$/i,'hangi tarih esas alınmalıdır?'],
  [/(?:aranan\s+şartların\s+neler\s+olduğu)$/i,'aranan şartlar nelerdir?'],
  [/(?:yetkilerinin\s+ne\s+olduğu)$/i,'yetkileri nelerdir?'],
  [/(?:aranması\s+gerektiği)$/i,'aranır mı?'],
  [/(?:aranmayacağı)$/i,'aranır mı?'],

  // İşlem
  [/(?:hakkında\s+yapılacak\s+işlem|yapılacak\s+işlem|yapılacak\s+işlemler|işlem\s+yapılacağı)$/i,'hakkında nasıl bir işlem yapılır?'],
  [/(?:hakkında\s+uygulanacak\s+işlem|uygulanacak\s+işlem)$/i,'hakkında nasıl bir işlem uygulanır?'],
  [/(?:hakkında\s+tesis\s+edilecek\s+işlem|tesis\s+edilecek\s+işlem)$/i,'hakkında ne gibi bir işlem tesis edilir?'],
  [/(?:nasıl\s+tespit\s+edileceği)$/i,'nasıl tespit edilir?'],
  [/(?:nasıl\s+yapılacağı|nasıl\s+yapılacağına|göre\s+mi\s+yapılacağı)$/i,'nasıl yapılır?'],
  [/(?:nasıl\s+uygulanacağı)$/i,'nasıl uygulanır?'],
  [/(?:ne\s+şekilde\s+dikkate\s+alınacağı)$/i,'ne şekilde dikkate alınır?'],

  // Olumsuz fiiller (-amayacağı / -meyeceği / -mayacağı)
  [/(?:atanamayacağı|atanmayacağı|atanamayacakları|atanmayacakları)$/i,'atanabilir mi?'],
  [/(?:yararlanamayacağı|yararlanmayacağı|yararlanamayacakları|yararlanılamayacağı)$/i,'yararlanılabilir mi?'],
  [/(?:faydalanamayacağı|faydalanmayacağı)$/i,'faydalanabilir mi?'],
  [/(?:uygulanamayacağı|uygulanmayacağı)$/i,'uygulanabilir mi?'],
  [/(?:ödenemeyeceği|ödenmeyeceği)$/i,'ödenebilir mi?'],
  [/(?:verilemeyeceği|verilmeyeceği|verilemeyeceğine)$/i,'verilebilir mi?'],
  [/(?:kullanılamayacağı|kullanılmayacağı)$/i,'kullanılabilir mi?'],
  [/(?:sayılamayacağı|sayılmayacağı)$/i,'sayılabilir mi?'],
  [/(?:alınamayacağı|alınmayacağı)$/i,'alınabilir mi?'],
  [/(?:yapılamayacağı|yapılmayacağı)$/i,'yapılabilir mi?'],
  [/(?:olamayacağı|olamayacakları)$/i,'olabilir mi?'],
  [/(?:olmayacağı)$/i,'olur mu?'],
  [/(?:yaptırılmaması|yaptırılmaması\s+gerektiği)$/i,'yaptırılabilir mi?'],
  [/(?:düzenlenemeyeceği)$/i,'düzenlenebilir mi?'],
  [/(?:geçirilemeyeceği)$/i,'geçirilebilir mi?'],
  [/(?:çıkamayacağı)$/i,'çıkabilir mi?'],
  [/(?:gidemeyeceği)$/i,'gidebilir mi?'],
  [/(?:yürütemeyeceği)$/i,'yürütebilir mi?'],
  [/(?:belirlenemeyeceği)$/i,'belirlenebilir mi?'],
  [/(?:değerlendirilemeyeceği|değerlendirilemeyeceğine)$/i,'değerlendirilebilir mi?'],
  [/(?:kullandırılıp\s+kullandırılmayacağı|kullandırılıp\s+kullandırılamayacağı)$/i,'kullandırılabilir mi?'],

  // Olumlu fiiller (-abileceği / -eceği)
  [/(?:atanabileceği|atanabilecekleri|atabileceği|atanabileceğine)$/i,'atanabilir mi?'],
  [/(?:yararlanabileceği|yararlanabilecekleri|yararlanabileceğine)$/i,'yararlanabilir mi?'],
  [/(?:faydalanabileceği|faydalanabilecekleri)$/i,'faydalanabilir mi?'],
  [/(?:kullanabileceği|kullanabilecekleri)$/i,'kullanabilir mi?'],
  [/(?:ödenebileceği|ödenebileceğine)$/i,'ödenebilir mi?'],
  [/(?:verilebileceği|verilebileceğine|verilebilecekleri)$/i,'verilebilir mi?'],
  [/(?:yapılabileceği|yapılabileceğine)$/i,'yapılabilir mi?'],
  [/(?:sayılabileceği|sayılabileceğine)$/i,'sayılabilir mi?'],
  [/(?:alınabileceği|alınabileceğine)$/i,'alınabilir mi?'],
  [/(?:geçebileceği|geçebilecekleri)$/i,'geçebilir mi?'],
  [/(?:olabileceği|olabilecekleri)$/i,'olabilir mi?'],
  [/(?:kabul\s+edilebileceği)$/i,'kabul edilebilir mi?'],
  [/(?:görev\s+alabileceklerine|görev\s+alabileceği)$/i,'görev alabilirler mi?'],
  [/(?:ataması|atamasının\s+yapılması|atamanızın\s+yapılması)$/i,'ataması yapılabilir mi?'],
  [/(?:memur\s+kadrosuna\s+atanması|pozisyonlarına\s+atanmaları)$/i,'atanabilir mi?'],
  [/(?:naklen\s+atanması|naklen\s+atama)$/i,'naklen atanması mümkün müdür?'],
  [/(?:asalet\s+tasdiki|asaletinin\s+tasdiki)$/i,'asalet tasdiki nasıl yapılır?'],
  [/(?:bekleme\s+süreleri)$/i,'bekleme süreleri nasıl uygulanır?'],
  [/(?:çalışma\s+saatleri)$/i,'çalışma saatleri nasıl belirlenir?'],
  [/(?:ek\s+göstergeleri|ek\s+gösterge)$/i,'ek göstergesi neye göre belirlenir?'],
  [/(?:kullanacağı\s+izin)$/i,'izin nasıl kullanılır?'],
  [/(?:senelik\s+izin|yıllık\s+izni|yıllık\s+izin|izninin\s+kullanımı)$/i,'yıllık izin nasıl kullandırılır?'],
  [/(?:kavramının\s+tanımı)$/i,'kavramı nasıl tanımlanır?'],
  [/(?:uygun\s+görüşünün\s+talep\s+edilmesi)$/i,'nasıl düzenlenmelidir?'],
  [/(?:başlangıç\s+tarihi|başlangıç\s+tarihleri|zaman\s+başlayacağı)$/i,'başlangıç tarihi nedir?'],
  [/(?:bunların\s+uygulanması|fıkrasının\s+uygulanması)$/i,'nasıl uygulanır?'],
  [/(?:verilecek\s+izinler|verilecek\s+izin)$/i,'hangi izinler verilir?'],
  [/(?:aktarıp\s+aktaramayacağı)$/i,'aktarabilir mi?']
 ];

 for(const [re,rep] of rules){
  if(re.test(s)){
   let res=s.replace(re,rep).trim();
   res=res.charAt(0).toLocaleUpperCase('tr')+res.slice(1);
   if(res.length<=215)return res;
  }
 }

 let konu=s;
 if(konu.length>85){
  const tokens=konu.split(/,\s*|\s+ile\s+/);
  if(tokens.length>1&&tokens[0].length>=20)konu=tokens[0].trim();
 }
 const q=`${konu} hakkında DPB'nin hukuki değerlendirmesi ve mütalaası nedir?`;
 return q.length<=215?q:`${konu.slice(0,150)}... hakkında DPB görüşü nedir?`;
}

// Bülten tek bir personel olayı değildir. Her görüşün özeti ve kendisine ait
// sonuç paragrafı birlikte değerlendirilir; başka görüşten cevap taşınmaz.
export function bultenSorulari(sayfalar:BelgeSayfasi[]):BelgeSorusu[]{
 const gorusler:{baslik:string;sayfalar:BelgeSayfasi[]}[]=[];
 for(const p of sayfalar){
  if(p.no<25)continue;
  for(const parca of p.metin.split(/(?=^Özet\s*:)/m)){
   if(/^Özet\s*:/.test(parca))gorusler.push({baslik:duz(parca.split(/\n\s*\n/)[0]).replace(/^Özet\s*:\s*/,''),sayfalar:[]});
   if(gorusler.length)gorusler.at(-1)!.sayfalar.push({...p,metin:parca});
  }
 }
 return gorusler.flatMap(g=>{
  const q=belgeSorulari(g.baslik,g.sayfalar,'dpb')[0];if(!q)return [];
  return [q];
 }).filter((q,i,all)=>all.findIndex(x=>x.cevap===q.cevap)===i);
}

// Cevaplar yorum üretmez: belge içindeki cümle/paragraflar aynen alıntılanır.
export function belgeSorulari(baslik:string,sayfalar:BelgeSayfasi[],tur:'dpb'|'genelge'):BelgeSorusu[]{
 const paragraphs=sayfalar.flatMap(p=>p.metin.split(/\n\s*\n/).map(duz).filter(s=>s.length>=60).map(text=>({text,sayfa:p.no})));
 if(!paragraphs.length){
  const no=baslik.match(/^([\d/\-]+)/)?.[1];
  return [{soru:no?`${no} numaralı genelgenin konusu nedir?`:`${baslik} hangi belgenin konusudur?`,cevap:baslik,sayfa:1}];
 }

 const alinti=(row:typeof paragraphs[number],son=false)=>{
  const sentences=row.text.split(/(?<=[.!?])\s+(?=[A-ZÇĞİÖŞÜ])/);
  const eligible=sentences.filter(s=>s.length>=60&&s.length<=650);
  const ozet=paragraphs.find(p=>/^ÖZET\s*:/i.test(p.text)&&p.text.length<=650);
  return eligible.length?(son?eligible.at(-1)!:eligible[0]):row.text.length>650&&ozet?ozet.text:row.text;
 };

 if(tur==='dpb'){
  const anaSoru=dpbAnaSorusu(baslik);
  let sonuc=[...paragraphs].reverse().find(p=>/mütalaa|değerlendiril|mümkün|gerekti|uygun bulun|sakınca|rica ederim|arz ederim/i.test(p.text))??paragraphs.at(-1)!;

  const out:BelgeSorusu[]=[{soru:anaSoru,cevap:alinti(sonuc,true),sayfa:sonuc.sayfa}];

  // Soru 2: Mevzuat dayanağı
  const law=paragraphs.find(p=>/\d{3,4}\s*sayılı|657 sayılı|KHK|Kanunun\b/i.test(p.text)&&p.text!==sonuc.text&&!p.text.startsWith('ÖZET'));
  if(law){
   out.push({soru:'Bu görüş hangi mevzuat ve kanun maddelerine dayandırılmıştır?',cevap:alinti(law),sayfa:law.sayfa});
  }

  // Soru 3: Gerekçe, yorum veya temel kural
  const orta=paragraphs.find(p=>p!==law&&p!==sonuc&&p.text.length>=75&&!p.text.startsWith('ÖZET')&&!p.text.includes('dilekçe incelenmiştir'));
  if(orta){
   let ortaSoru='Görüşte yer verilen temel gerekçe ve hukuki şartlar nelerdir?';
   if(/54\s*(?:üncü|\.)\s*madde.*nakil|nakil.*KPSS|KPSS.*nakil/i.test(orta.text)){
    ortaSoru='657 sayılı Kanunun 54. maddesindeki nakil yasağı KPSS merkezi yerleştirmelerini kapsar mı?';
   }else if(/KPSS|merkezi yerleştirme|yarışma sınav/i.test(orta.text)){
    ortaSoru='KPSS veya sınav sonucuna göre atamalarda adaylık ve nakil yasağı nasıl değerlendirilir?';
   }else if(/disiplin|ceza|uyarma|kınama|aylıktan kesme/i.test(orta.text)){
    ortaSoru='Disiplin cezaları ve itiraz sürecine ilişkin temel hukuki değerlendirme nedir?';
   }else if(/izin|hastalık|yıllık izin|mazeret|aylıksız/i.test(orta.text)){
    ortaSoru='İzin haklarının kullanımı ve sürelerin hesabına ilişkin temel kurallar nelerdir?';
   }else if(/sözleşmeli|4\/B|399/i.test(orta.text)){
    ortaSoru='Sözleşmeli personelin statüsü ve haklarına ilişkin esaslar nelerdir?';
   }else if(/ek gösterge|kademe|derece|intibak/i.test(orta.text)){
    ortaSoru='Kazanılmış hak aylığı, derece ve kademe ilerlemesine esas alınan şartlar nelerdir?';
   }
   out.push({soru:ortaSoru,cevap:alinti(orta),sayfa:orta.sayfa});
  }

  return out.map(r=>({...r,sayfa:sayfalar.find(p=>duz(p.metin).includes(r.cevap))?.no??r.sayfa})).filter((r,i)=>out.findIndex(x=>x.cevap===r.cevap)===i);
 }

 // Genelge
 const konular=['aday memur','KPSS','yıllık izin','aylıksız izin','doğum izni','hastalık izni','sözleşmeli personel','ek gösterge','vekalet ücreti','vekâlet ücreti','disiplin','görevde yükselme','askerlik','emeklilik','muvafakat','naklen atama','kazanılmış hak aylığı','sosyal denge','pasaport','mesai','adli yardım','tebligat','bilirkişi','istinabe','adli görüşme','arabuluculuk','uzlaştırma'];
 const temiz=duz(baslik).replace(/\s*\([^)]*\)\s*$/,'').replace(/\s*(?:hk\.?|hakkında|ilişkin)\.?$/i,'').replace(/^\d+[\d/\-]*\s*No['’]?lu\s*(?:Ek\s*)?Genelge\s*/i,'');
 const konu=temiz.length<=95?temiz:konular.find(k=>baslik.toLocaleLowerCase('tr').includes(k))??'Bu genelge';
 let question=genelgeSorusu(baslik)??`${konu} konusunda genelge ne düzenliyor?`;
 let sonuc=[...paragraphs].reverse().find(p=>/mütalaa|değerlendiril|görüş|mümkün|gerekti|uygun|rica ederim|arz ederim/i.test(p.text))??paragraphs[0];
 const stop=new Set(['hangi','nasıl','neden','nedir','ilişk','genel','işlem','uygul','yürüt','konus','hakkı','için','sayıl','belir']);
 const terms=new Set(question.toLocaleLowerCase('tr').split(/[^a-zçğıöşü]+/).filter(w=>w.length>3).map(w=>w.slice(0,5)).filter(w=>!stop.has(w)));
 const puan=(s:string)=>{const words=new Set(s.toLocaleLowerCase('tr').split(/[^a-zçğıöşü]+/).map(w=>w.slice(0,5)));return [...terms].filter(t=>words.has(t)).length*3+(terms.size&&/yapılması|edilmesi|bildirilmesi|gönderilmesi|alınması|düzenlenmesi/.test(s)?2:0);};
 const aday=[...paragraphs].sort((a,b)=>puan(b.text)-puan(a.text));if(aday[0]&&puan(aday[0].text)>2)sonuc=aday[0];

 const out:BelgeSorusu[]=[{soru:question,cevap:alinti(sonuc,true),sayfa:sonuc.sayfa}];
 const law=paragraphs.find(p=>/\d{3,4}\s*sayılı/.test(p.text)&&p.text!==sonuc.text);
 if(law)out.push({soru:`${konu} için metinde hangi mevzuat dayanağı gösteriliyor?`,cevap:alinti(law),sayfa:law.sayfa});
 const sure=paragraphs.find(p=>/\b\d+\s*(?:iş\s*)?(?:gün|ay|yıl)\b/i.test(p.text)&&p!==law&&p!==sonuc);
 if(sure)out.push({soru:`${konu} için belgede hangi süre belirtiliyor?`,cevap:alinti(sure),sayfa:sure.sayfa});
 return out.map(r=>({...r,sayfa:sayfalar.find(p=>duz(p.metin).includes(r.cevap))?.no??r.sayfa})).filter((r,i)=>out.findIndex(x=>x.cevap===r.cevap)===i);
}
