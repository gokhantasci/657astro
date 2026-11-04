export function dosyaIndir(blob:Blob,name:string){
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export async function tabloWord(baslik:string,aciklama:string,headers:string[],rows:string[][]){
 const {Document,Packer,Paragraph,TextRun,Table,TableRow,TableCell,WidthType,PageOrientation}=await import('docx');
 const para=(text:string,bold=false)=>new Paragraph({children:[new TextRun({text,bold})]});
 const tableRow=(cells:string[],head=false)=>new TableRow({tableHeader:head,cantSplit:true,children:cells.map(text=>new TableCell({children:[para(text,head)]}))});
 const doc=new Document({creator:'657.com.tr',title:baslik,styles:{default:{document:{run:{font:'Arial',size:20}}}},sections:[{properties:{page:{size:{orientation:PageOrientation.LANDSCAPE},margin:{top:720,bottom:720,left:720,right:720}}},children:[new Paragraph({text:baslik,heading:'Heading1'}),para(aciklama),new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[tableRow(headers,true),...rows.map(r=>tableRow(r))]})]}]});
 return Packer.toBlob(doc);
}
