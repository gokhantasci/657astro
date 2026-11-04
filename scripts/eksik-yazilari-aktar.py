"""Kullanıcının kendi WordPress sitesinden seçili, kişisel liste içermeyen haberler."""
import subprocess,json,re,html
from pathlib import Path
from wp_common import Clean
root=Path(__file__).resolve().parents[1]
slugs=['sosyal-medyalarin-turkiye-temsilcilikleri','basit-yargilama-usulu-kapsamindaki-suclara-iliskin-liste']
for slug in slugs:
 url='https://657.com.tr/wp-json/wp/v2/posts?slug='+slug
 cmd=['ssh','-o','BatchMode=yes','kickhex-production','curl -ks --resolve "657.com.tr:443:$(hostname -I | cut -d" " -f1)" '+url]
 rows=json.loads(subprocess.run(cmd,capture_output=True,check=True).stdout)
 if len(rows)!=1:raise ValueError(f'Yazı bulunamadı: {slug}')
 r=rows[0];title=html.unescape(re.sub('<[^>]+>','',r['title']['rendered']))
 body=r['content']['rendered']
 if re.search('kararname|sicil numara|adı soyadı',title+' '+body,re.I):raise ValueError('Kişisel içerik kontrolü: '+slug)
 clean=Clean();clean.feed(body);body=''.join(clean.out)
 desc=html.unescape(re.sub('<[^>]+>',' ',body));desc=re.sub(r'\s+',' ',desc).strip()[:160]
 fields={'title':title,'description':desc,'date':r['date'][:10],'updated':r['modified'][:10],'kategori':['Faydalı'],'kaynak':'https://657.com.tr/'+slug+'/'}
 out='---\n'+'\n'.join(k+': '+json.dumps(v,ensure_ascii=False) for k,v in fields.items())+'\n---\n\n'+body+'\n'
 (root/'src/content/yazilar'/f'{slug}.md').write_text(out,encoding='utf-8')
 print(slug,'aktarıldı')
