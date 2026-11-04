export function teftisSayfalama(code,size){
 if(!Number.isInteger(size)||size<1)throw Error('Geçerli bir sayfa boyu gerekli.');
 return code.replace(/\b(pageSize\s*[:=]\s*|[A-Z_]*PAGE_SIZE\s*=\s*)\d+/g,(_,prefix)=>prefix+size);
}
