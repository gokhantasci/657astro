import {parse} from 'parse5';
import {tarihMetni as convert} from './tarih-metni.ts';

// Yalnızca görünen metin düğümleri: bağlantılar, datetime, JSON-LD ve kod aynen kalır.
export function gorunenTarihler(html:string){
 if(convert(html)===html)return html;
 const edits:{start:number;end:number;text:string}[]=[];
 type Location={startOffset:number;endOffset:number};
 type Node={nodeName:string;value?:string;childNodes?:Node[];attrs?:{name:string;value:string}[];sourceCodeLocation?:Location&{attrs?:Record<string,Location>}};
 const skip=new Set(['script','style','code','pre','textarea']);
 const walk=(node:Node)=>{
  if(skip.has(node.nodeName)||node.attrs?.some(a=>a.name==='data-metin-koru'))return;
  for(const a of node.attrs??[]){
   if(!['placeholder','title','aria-label','alt'].includes(a.name))continue;
   const loc=node.sourceCodeLocation?.attrs?.[a.name];if(!loc)continue;
   const before=html.slice(loc.startOffset,loc.endOffset),after=convert(before);
   if(before!==after)edits.push({start:loc.startOffset,end:loc.endOffset,text:after});
  }
  if(node.nodeName==='#text'&&node.sourceCodeLocation){
   const {startOffset:start,endOffset:end}=node.sourceCodeLocation;
   const before=html.slice(start,end),after=convert(before);
   if(before!==after)edits.push({start,end,text:after});
  }
  node.childNodes?.forEach(walk);
 };
 walk(parse(html,{sourceCodeLocationInfo:true}) as Node);
 for(const e of edits.sort((a,b)=>b.start-a.start))html=html.slice(0,e.start)+e.text+html.slice(e.end);
 return html;
}
