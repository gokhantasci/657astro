// Alan adı kökü ve GitHub Pages proje yolu aynı kaynakla çalışır.
export function yerelYol(yol:string,taban=import.meta.env?.BASE_URL??'/'){
 const base='/'+taban.replace(/^\/+|\/+$/g,'');
 if(base==='/'||!yol.startsWith('/')||yol.startsWith('//')||yol===base||yol.startsWith(base+'/'))return yol;
 return base+yol;
}
export function yerelHtml(html:string,taban:string){
 return html.replace(/\b(href|src|action)=(['"])(\/(?!\/)[^'"]*)\2/g,(_m,ad,q,yol)=>`${ad}=${q}${yerelYol(yol,taban)}${q}`)
  .replace(/\bsrcset=(['"])(.*?)\1/g,(_m,q,s)=>`srcset=${q}${s.split(',').map((p:string)=>p.replace(/^(\s*)(\/\S+)/,(_m,b,y)=>b+yerelYol(y,taban))).join(',')}${q}`)
  .replace(/\bcontent=(['"])0;url=(\/[^'"]*)\1/g,(_m,q,yol)=>`content=${q}0;url=${yerelYol(yol,taban)}${q}`);
}
