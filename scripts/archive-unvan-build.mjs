import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
export async function archiveSalaryBuild(dir,projectRoot=new URL('../',import.meta.url)){
 const data=JSON.parse(await readFile(new URL('unvan-maaslari/yayin.json',dir),'utf8'));
 if(data.surum!==1||data.tur!=='hesap'||data.donemId!==data.baslangic||!/^\d{4}-\d{2}-\d{2}$/.test(data.donemId)||!data.kayitlar?.length)throw new Error('Maaş arşivi için geçerli derleme çıktısı yok.');
 for(const k of data.kayitlar)for(const field of ['dusuk','yuksek'])if(k[field]!==null&&(!Number.isFinite(k[field])||k[field]<0))throw new Error('Geçersiz maaş sonucu.');
 const folder=new URL('src/data/maas-arsivleri/',projectRoot);await mkdir(folder,{recursive:true});
 const output=new URL(data.donemId+'.json',folder),temporary=new URL(data.donemId+'.json.tmp',folder);
 const body=JSON.stringify(data,null,1)+'\n';
 const vergi=data.hesapBaglami?.katsayilar?.vergi;
 if(vergi&&vergi.yil!==data.yil)throw new Error('Maaş yayını ile vergi tarifesinin yılı uyuşmuyor.');
 if(vergi&&Number.isInteger(vergi.yil)){
  const taxFolder=new URL('src/data/vergi-arsivleri/',projectRoot);await mkdir(taxFolder,{recursive:true});
  const taxOutput=new URL(vergi.yil+'.json',taxFolder),taxTemporary=new URL(vergi.yil+'.json.tmp',taxFolder);
  await writeFile(taxTemporary,JSON.stringify(vergi,null,1)+'\n','utf8');await rename(taxTemporary,taxOutput);
 }
 try{if(await readFile(output,'utf8')===body)return;}catch(e){if(e.code!=='ENOENT')throw e;}
 await writeFile(temporary,body,'utf8');await rename(temporary,output);
 console.log(`[maaş arşivi] ${data.donemId}: ${data.kayitlar.length} unvan kaydedildi.`);
}
