// İsteğe bağlı aktarım aracı; site ziyaretçisine OCR motoru gönderilmez.
import {createInterface} from 'node:readline';
import {pathToFileURL} from 'node:url';
const modulePath=process.env.OCR_TESSERACT_MODULE;
const {createWorker,createScheduler}=await import(modulePath?pathToFileURL(modulePath).href:'tesseract.js');
const scheduler=createScheduler();
for(let i=0;i<3;i++)scheduler.addWorker(await createWorker('tur',1,{
 cachePath:process.env.OCR_CACHE_PATH??'artifacts/ocr-cache',
 ...(process.env.OCR_CORE_PATH?{corePath:process.env.OCR_CORE_PATH}:{}),
 langPath:'https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/main',gzip:false,
}));
console.log(JSON.stringify({ready:true}));
const pending=new Set();
for await(const line of createInterface({input:process.stdin})){
 const {id,path}=JSON.parse(line);
 const task=scheduler.addJob('recognize',path,{}, {blocks:true}).then(({data})=>{
  console.log(JSON.stringify({id,text:data.text,confidence:data.confidence,
   lowConfidence:(data.blocks??[]).flatMap(b=>b.paragraphs??[]).flatMap(p=>p.lines??[]).filter(l=>l.confidence<75).map(l=>({text:l.text,confidence:l.confidence}))}));
 }).catch(e=>console.log(JSON.stringify({id,error:e.message}))).finally(()=>pending.delete(task));
 pending.add(task);
}
await Promise.all(pending);await scheduler.terminate();
