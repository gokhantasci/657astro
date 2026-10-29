import html,json
from urllib.request import Request,urlopen
from html.parser import HTMLParser

def fetch(url):
    with urlopen(Request(url,headers={'User-Agent':'657-static-migration/1.0'})) as response:
        return json.load(response),int(response.headers.get('X-WP-TotalPages',1))

class Clean(HTMLParser):
    allowed={'p','strong','em','b','i','br','ul','ol','li','h2','h3','h4','table','thead','tbody','tr','th','td','blockquote','a'}
    def __init__(self):super().__init__(convert_charrefs=True);self.out=[];self.skip=0
    def handle_starttag(self,tag,attrs):
        if tag in {'script','style','iframe'}:self.skip+=1
        if self.skip:return
        if tag in self.allowed:
            attr=''
            if tag=='a':
                href=dict(attrs).get('href','')
                if href.startswith(('https://','http://','/','#')):attr=' href="'+html.escape(href,quote=True)+'"'
            self.out.append('<'+tag+attr+'>')
    def handle_endtag(self,tag):
        if tag in {'script','style','iframe'}:self.skip=max(0,self.skip-1);return
        if not self.skip and tag in self.allowed and tag not in {'br','img'}:self.out.append('</'+tag+'>')
    def handle_data(self,data):
        if not self.skip:self.out.append(html.escape(data))
