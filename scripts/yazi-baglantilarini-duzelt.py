"""Eski etiket bağlantılarını yeni yazı+araç aramasına çevirir. İdempotent."""
from pathlib import Path
import re,html
from urllib.parse import unquote,quote
def duzelt(text):
 def tag(m):
  konu=unquote(m[2]).strip('/').replace('-',' ')
  return 'href='+m[1]+'/araclar/?q='+quote(konu)+'#ara'+m[1]
 text=re.sub(r'href=([\'"])(?:https?://(?:www\.)?657\.com\.tr)?/tag/([^\'"]+)\1',tag,text)
 # WordPress'in eski /posts/<adres>/ kalıcı bağlantıları: yazı sitede varsa ona, yoksa yazı dizinine.
 def posts(m):
  slug=unquote(m[2])
  hedef='/'+slug+'/' if (Path('src/content/yazilar')/(slug+'.md')).exists() or (Path('src/content/yazilar')/(m[2]+'.md')).exists() else '/yazilar/'
  return 'href='+m[1]+ESLEME.get(hedef,hedef)+m[1]
 text=re.sub(r'href=([\'"])(?:https?://(?:www\.)?657\.com\.tr)?/posts/([^\'"/]+)/?\1',posts,text)
 for eski,yeni in ESLEME.items():
  text=re.sub(r'href=([\'"])(?:https?://(?:www\.)?657\.com\.tr)?'+re.escape(eski)+r'\1',lambda m:'href='+m[1]+yeni+m[1],text)
 # Boşlukla bozulmuş bağlantı: href="/web-sitesi-guncellemesi/ https://eski.657.com.tr/"
 return re.sub(r'href=([\'"])/[^\'"\s]+/\s+(https?://[^\'"\s]+)\1',lambda m:'href='+m[1]+m[2]+m[1],text)
# Taşınmış ya da adı değişmiş sayfalar.
ESLEME={'/enflasyon-farki-hesaplama/':'/enflasyon-farki-hesaplama-robotu/','/hukuk-mahkemeleri/ayarlar/':'/hukuk-mahkemeleri/',
 '/sendika-uyesi-memur-olmayandan-51-₺-daha-az-maas-alacak/':'/sendika-uyesi-memur-olmayandan-51-e282ba-daha-az-maas-alacak/'}
if __name__=='__main__':
 count=0
 for p in Path('src/content/yazilar').glob('*.md'):
  old=p.read_text(encoding='utf-8');new=duzelt(old)
  if new!=old:p.write_text(new,encoding='utf-8');count+=1
 print(f'{count} yazının eski etiket bağlantısı güncellendi.')
