import {normalize} from './normalize.ts';
// Kişisel görevlendirme listeleri ve bütün kararname haberleri yayımlanmaz.
export function yayinDisi(baslik:string,metin=''){
 const b=normalize(baslik),m=normalize(metin);
 return /kararname|atama kararlari|ust duzey gorev degisimi|nakil sonuclari|atama sonuclari|uyeliklerine secme kararlari/.test(b)
  || /sicil\s*(no|numara)|adi\s*(ve\s*)?soyadi|ad\s*soyad/.test(m)&&/gorev yeri|atan|nakil|kararname/.test(m);
}
