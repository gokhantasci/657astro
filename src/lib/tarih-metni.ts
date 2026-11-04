export function tarihMetni(text:string){
 return text.split(/(https?:\/\/[^\s<>"']+)/).map((part,i)=>i%2?part:part.replace(/\b(?:(\d{4})-(\d{2})-(\d{2})|(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4}))\b/g,(full,y,m,d,g,a,s)=>{
  const year=Number(y??s),month=Number(m??a),day=Number(d??g),date=new Date(Date.UTC(year,month-1,day));
  if(year<1800||year>2200||date.getUTCFullYear()!==year||date.getUTCMonth()+1!==month||date.getUTCDate()!==day)return full;
  return `${String(day).padStart(2,'0')}/${String(month).padStart(2,'0')}/${year}`;
 })).join('');
}
