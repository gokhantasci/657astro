"""Kaynak PDF'nin metin bloklarını değiştirmeden, düzenlenebilir Markdown'a aktarır.

Native PDF'de font hiyerarşisi, paragraf blokları ve çizgili tablolar kullanılır.
Tarama metni yalnız ayrıca kontrol edilmiş Markdown dosyasından alınır.
Kaynak PDF'ler ve SHA256 kimlikleri değiştirilmez.
"""
import argparse,hashlib,html,json,re,unicodedata
from pathlib import Path
import pymupdf

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'src/content/belgeler'

def escape(text):
    text=re.sub(r'([\\`*\[\]_|])',r'\\\1',html.escape(text,quote=False))
    text=re.sub(r'^(\d+)([.)])(?=\s)',r'\1\\\2',text)
    return re.sub(r'^([+-])(?=\s)',r'\\\1',text)

def join_lines(lines):
    # PDF dizgisindeki satır sonları paragraf sonu değildir. Sözcüğün dizgi
    # nedeniyle bölünmesi dışında hiçbir harf veya noktalama düzeltilmez.
    text=''
    for line in lines:
        line=line.strip()
        if not line: continue
        if text.endswith('-') and re.search(r'[a-zçğıöşü]-$',text) and re.match(r'^[a-zçğıöşü]',line):
            text=text[:-1]+line
        else:text+=(' ' if text else '')+line
    return re.sub(r'\s+',' ',text).strip()

def visible_span_text(span):
    # Bazı resmî PDF'lerin ToUnicode haritası tek İ glifini "İhb" gibi bir
    # diziye açıyor. Sonraki harflerin kutusu sıfır genişlikte; PDF'de görünmez.
    # Gerçek ligatürler ve birleştirici işaretler korunur.
    groups=[]
    for c in span['chars']:
        if c['bbox'][2]-c['bbox'][0]>.01 or not groups:groups.append([])
        groups[-1].append(c)
    out=[]
    for group in groups:
        value=''.join(c['c'] for c in group)
        non_latin=bool(value) and value[0].isalpha() and 'LATIN' not in unicodedata.name(value[0],'')
        if value.isspace() or non_latin or re.fullmatch(r'\d+/\d+',value) or value.strip().casefold() in {'ff','fi','fl','ffi','ffl','ft','st','ae','oe','th','ct'}:out.append(value);continue
        origin=group[0]['origin']
        out.extend(c['c'] for c in group if c['bbox'][2]-c['bbox'][0]>.01 or c.get('synthetic') or unicodedata.category(c['c'][0]).startswith('M') or abs(c['origin'][0]-origin[0])>.01 or abs(c['origin'][1]-origin[1])>.01)
    return ''.join(out)

def native_page(page,number,book=False,repair_cmap=False):
    blocks=[]
    if book and number==1 and page.get_images():
        image=page.parent.extract_image(page.get_images()[0][0])
        dest=ROOT/'public/dosyalar/belge-gorselleri'/('dpb-bulten-kapak.'+image['ext'])
        dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(image['image'])
        blocks.append((0,'![Devlet Personel Başkanlığı amblemi](/dosyalar/belge-gorselleri/'+dest.name+')'))
    tables=[]
    # Yalnız çizgilerle belirlenmiş hücreler; metindeki boşluklardan hayalî
    # tablo oluşturulmaz. Hücre içerikleri kaynak sırasıyla aktarılır.
    found=page.find_tables(strategy='lines_strict').tables
    for table in found:
        rows=table.extract()
        if len(rows)<2 or max(map(len,rows),default=0)<2:continue
        data=[]
        for row in rows:
            data.append('| '+' | '.join(escape(join_lines((c or '').splitlines())) for c in row)+' |')
        data.insert(1,'| '+' | '.join('---' for _ in rows[0])+' |')
        tables.append(table.bbox)
        blocks.append((table.bbox[1],'\n'.join(data)))
    source_blocks=page.get_text('rawdict' if repair_cmap else 'dict')['blocks']
    if repair_cmap:
        for b in source_blocks:
            if b['type']!=0:continue
            for line in b['lines']:
                for span in line['spans']:span['text']=visible_span_text(span)
                # MuPDF bozuk çoklu eşlemenin ardından glifin üstüne sahte
                # boşluk ekleyebiliyor. Fiziksel harfler bitişikse bunu taşıma.
                spans=line['spans']
                for i,span in enumerate(spans):
                    if not span['text'].isspace() or not all(c.get('synthetic') for c in span['chars']):continue
                    prev=next((s for s in reversed(spans[:i]) if s['text'].strip()),None)
                    following=next((s for s in spans[i+1:] if s['text'].strip()),None)
                    if prev and following and following['bbox'][0]-prev['bbox'][2]<=1.5:span['text']=''
    for block in source_blocks:
        if block['type']!=0:continue
        box=block['bbox']
        if any(box[0]>=t[0]-1 and box[2]<=t[2]+1 and box[1]>=t[1]-1 and box[3]<=t[3]+1 for t in tables):continue
        spans=[s for l in block['lines'] for s in l['spans'] if s['text'].strip()]
        if not spans:continue
        if repair_cmap:
            rows=[]
            for line in block['lines']:
                value=''.join(s['text'] for s in line['spans'])
                if not value:continue
                baseline=line['spans'][0]['origin'][1]
                x,_,right,_=line['bbox']
                if rows and abs(rows[-1]['baseline']-baseline)<.8 and x>=rows[-1]['left']:
                    gap=x-rows[-1]['right'];rows[-1]['text']=rows[-1]['text'].rstrip(' ')+(' ' if gap>1.5 else '')+value.lstrip(' ');rows[-1]['right']=max(right,rows[-1]['right'])
                else:rows.append({'text':value,'baseline':baseline,'left':x,'right':right})
            lines=[r['text'] for r in rows]
        else:lines=[''.join(s['text'] for s in l['spans']) for l in block['lines']]
        text=join_lines(lines)
        if not text:continue
        # Dekoratif sayfa numarası ve DPB filigranı gövde paragrafı değildir.
        if text.isdigit() and (box[1]>page.rect.height*.88 or box[3]<page.rect.height*.06):continue
        bold=sum(len(s['text']) for s in spans if s['flags']&16)/sum(len(s['text']) for s in spans)>.9
        if book and 5<=number<=24:
            match=re.match(r'^(.*?)\.{3,}\s*(\d+)\s*$',text)
            if match:
                label=match[1].rstrip();target=int(match[2])+24
                blocks.append((box[1],f'[{escape(label)}](#belge-sayfa-{target}) · {match[2]}'))
                continue
        body=escape(text)
        if re.match(r'^T\.C\. (?:DEVLET PERSONEL BAŞKANLIĞI|ADALET BAKANLIĞI)$',text):
            blocks.append((box[1],'**T.C.**  \n**'+escape(text[5:])+'**'));continue
        if bold:
            if len(text)<150 and (text.isupper() or re.search(r'Hakkında|Haklarına Dair|Hizmetine Dair',text)) and not re.match(r'^(?:ÖZET|Özet|ANKARA|TEMMUZ|T\.C)',text):body='## '+body
            elif re.match(r'^Ö[Zz][Ee][Tt]\s*:',text):body='### '+body
            else:body='**'+body+'**'
        elif re.fullmatch(r'(?:T\.?C\.?|ADALET BAKANLIĞI|DEVLET PERSONEL BAŞKANLIĞI|GENELGE|GENELGE NO\s*:.*)',text):body='**'+body+'**'
        if repair_cmap:
            paragraphs=[[]]
            for line in lines:
                if paragraphs[-1] and re.match(r'^(?:\(?\d+[.)-]|[a-zçğıöşü]\))\s*',line.strip()):paragraphs.append([])
                paragraphs[-1].append(line)
            if len(paragraphs)>1:body='\n\n'.join(escape(join_lines(part)) for part in paragraphs)
        # Kaynaktaki 1-, a), (1) numaraları Markdown tarafından yeniden
        # numaralandırılmaz; metnin kendi işaretleri aynen bırakılır.
        if re.match(r'^\d+\.\s',body):body=re.sub(r'^(\d+)\.',r'\1\\.',body)
        blocks.append((box[1],body))
    blocks.sort(key=lambda b:b[0])
    if not blocks:return ''
    return f'<section class="kaynak-sayfa" id="belge-sayfa-{number}" data-kaynak-sayfa="{number}">\n\n'+'\n\n'.join(b[1] for b in blocks)+f'\n\n<div class="kaynak-sayfa-no" aria-label="Kaynak PDF sayfası {number}">{number}</div>\n\n</section>'

def write(tur,id,title,sha,body,pages):
    target=OUT/tur/(id+'.md');target.parent.mkdir(parents=True,exist_ok=True)
    meta={'title':title,'tur':tur,'belgeId':id,'sha256':sha,'sayfa':pages}
    target.write_text('---\n'+'\n'.join(k+': '+json.dumps(v,ensure_ascii=False) for k,v in meta.items())+'\n---\n\n'+body.strip()+'\n',encoding='utf-8')

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--genelge-cache',type=Path);ap.add_argument('--kontrollu-ocr',type=Path);ap.add_argument('--yalniz-genelge',action='store_true');args=ap.parse_args()
    dpb=json.loads((ROOT/'src/data/dpb-gorusleri.json').read_text(encoding='utf-8'))
    for r in ([] if args.yalniz_genelge else dpb):
        pdf=ROOT/'public'/r['dosya'].lstrip('/');assert hashlib.sha256(pdf.read_bytes()).hexdigest()==r['sha256'],r['id']
        d=pymupdf.open(pdf);book=r['id']=='dpb_mutalaa_ozel'
        body='\n\n'.join(native_page(p,n+1,book) for n,p in enumerate(d))
        title='Mütalaalar Özel Bülteni · Temmuz 2013' if book else r['baslik']
        write('dpb',r['id'],title,r['sha256'],body,len(d))
    if not args.yalniz_genelge:print('DPB Markdown:',len(dpb),flush=True)
    if not args.genelge_cache:return
    rows=json.loads((ROOT/'src/data/adalet-genelgeleri.json').read_text(encoding='utf-8'));seen=set();done=0;pending=[]
    for r in rows:
        if r['sha256'] in seen:continue
        seen.add(r['sha256'])
        key=hashlib.sha256(r['kaynak'].encode()).hexdigest()[:12]
        pdf=args.genelge_cache/(key+'.pdf')
        assert hashlib.sha256(pdf.read_bytes()).hexdigest()==r['sha256'],r['id']
        d=pymupdf.open(pdf);pages=[]
        for n,p in enumerate(d,1):
            if r['sayfalar'][n-1]['yontem']=='pdf':pages.append(native_page(p,n,repair_cmap=True))
            else:
                file=args.kontrollu_ocr/r['sha256']/f'{n}.md' if args.kontrollu_ocr else None
                if not file or not file.exists():pending.append((r['id'],n));break
                pages.append(f'<section class="kaynak-sayfa" id="belge-sayfa-{n}" data-kaynak-sayfa="{n}">\n\n'+file.read_text(encoding='utf-8').strip()+f'\n\n<div class="kaynak-sayfa-no">{n}</div>\n\n</section>')
        else:
            write('genelge',r['id'],r['baslik'],r['sha256'],'\n\n'.join(pages),len(d));done+=1
    print('Genelge Markdown:',done,'Bekleyen belge:',len(pending),flush=True)
    if pending:print(json.dumps(pending,ensure_ascii=False),flush=True)

if __name__=='__main__':main()
