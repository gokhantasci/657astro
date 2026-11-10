import csv, json, statistics
from collections import Counter
from pathlib import Path

p = Path('artifacts/site-sagligi-20261105')
def rows(name):
    return [json.loads(l) for l in (p/name).read_text(encoding='utf-8').splitlines() if l.strip()]
http = list({x['url']: x for x in rows('http.jsonl')}.values())
lh = list({x['url']: x for x in rows('lighthouse.jsonl')}.values()) if (p/'lighthouse.jsonl').exists() else []
def pct(values, percent):
    a = sorted(values)
    return round(a[max(0, min(len(a)-1, int((len(a)-1)*percent)))], 2) if a else None
def http_summary(data):
    ok = [x for x in data if x.get('status') == 200]
    return {'count':len(data), 'status':dict(Counter(str(x.get('status','error')) for x in data)),
        'errors':sum(bool(x.get('error')) for x in data),
        'headers_ms_p50':pct([x['headersMs'] for x in ok], .5),
        'headers_ms_p95':pct([x['headersMs'] for x in ok], .95),
        'body_complete_ms_p50':pct([x['totalMs'] for x in ok], .5),
        'body_complete_ms_p95':pct([x['totalMs'] for x in ok], .95),
        'headers_over_1000ms':sum(x['headersMs']>1000 for x in ok),
        'decoded_html_bytes_p95':pct([x['decodedBytes'] for x in ok], .95),
        'cache':dict(Counter(str(x.get('cfCache')) for x in data))}
valid=[x for x in lh if x.get('scores',{}).get('performance') is not None and not x.get('runtimeError')]
sitemap=[x for x in http if x['kind']=='sitemap']
alerts=[x for x in sitemap if x.get('status')!=200 or x.get('noindex') or not x.get('canonical') or x.get('refresh')]
summary={'all':http_summary(http),'sitemap':http_summary(sitemap),'sitemap_alerts':len(alerts),
    'lighthouse':{'tested':len(lh),'valid':len(valid),'averages':{k:round(statistics.mean(x['scores'][k] for x in valid if x['scores'].get(k) is not None),2) for k in ['performance','accessibility','best-practices','seo']} if valid else {},
    'performance_below_90':sum(x['scores']['performance']<90 for x in valid),
    'lcp_over_2500ms':sum(x['metrics'].get('largest-contentful-paint',0)>2500 for x in valid),
    'cls_over_01':sum(x['metrics'].get('cumulative-layout-shift',0)>.1 for x in valid)}}
(p/'summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf-8')
(p/'sitemap-alerts.json').write_text(json.dumps(alerts,ensure_ascii=False,indent=2),encoding='utf-8')
fields=['url','kind','status','headersMs','totalMs','decodedBytes','cfCache','contentEncoding','location','noindex','canonical','refresh','error']
with (p/'tum-sayfalar-hiz.csv').open('w',encoding='utf-8-sig',newline='') as f:
    w=csv.DictWriter(f,fieldnames=fields,extrasaction='ignore');w.writeheader();w.writerows(http)
with (p/'mobil-lighthouse.csv').open('w',encoding='utf-8-sig',newline='') as f:
    fields=['url','group','performance','accessibility','best-practices','seo','LCP_ms','TBT_ms','CLS','error']
    w=csv.DictWriter(f,fieldnames=fields);w.writeheader()
    for x in lh:w.writerow({'url':x['url'],'group':x.get('group'),**x.get('scores',{}),'LCP_ms':x.get('metrics',{}).get('largest-contentful-paint'),'TBT_ms':x.get('metrics',{}).get('total-blocking-time'),'CLS':x.get('metrics',{}).get('cumulative-layout-shift'),'error':x.get('error') or x.get('runtimeError')})
print(json.dumps(summary,ensure_ascii=False,indent=2))
