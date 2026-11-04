"""One-time, lossless conversion of the approved landing into editable fields."""
from html.parser import HTMLParser
from html import unescape
from pathlib import Path
import json

root = Path(__file__).resolve().parent.parent
if (root / 'template.html').exists():
    raise SystemExit('La plantilla ya existe. Este inicializador no debe ejecutarse sobre contenido editado.')
source = (root / 'index.html').read_text(encoding='utf-8')
line_starts = [0]
for line in source.splitlines(keepends=True):
    line_starts.append(line_starts[-1] + len(line))

class Extractor(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.stack = []
        self.fields = []
        self.values = {}
        self.edits = []
        self.group = 'General'

    def pos(self):
        line, col = self.getpos()
        return line_starts[line-1] + col

    def field(self, kind, value, label):
        key = f'campo_{len(self.fields)+1:03}'
        self.fields.append({'key': key, 'kind': kind, 'group': self.group, 'label': label})
        self.values[key] = value
        return key

    def handle_starttag(self, tag, pairs):
        attrs = dict(pairs)
        if tag == 'section':
            self.group = {'hero':'Portada', 'intro':'Experiencia', 'moments':'Momentos', 'photo-break':'Fotografía', 'about':'Quiénes somos', 'promise':'Cómo trabajamos', 'faq':'Preguntas', 'contact':'Contacto'}.get(attrs.get('class','').split(' ')[0], self.group)
        if tag == 'footer': self.group = 'Pie de página'
        raw = self.get_starttag_text()
        replacements = []
        marker = ''
        import re
        if tag == 'img':
            key = self.field('image', attrs.get('src', ''), attrs.get('alt', 'Imagen'))
            replacements.append(('src', key))
            marker = f' data-edit-field="{key}"'
            alt_key = self.field('text', attrs.get('alt', ''), 'Descripción de la imagen')
            replacements.append(('alt', alt_key))
        elif tag == 'a' and attrs.get('href','').startswith(('https://', 'mailto:')):
            key = self.field('link', attrs['href'], 'Destino: ' + attrs['href'][:65])
            replacements.append(('href', key))
            marker = f' data-edit-link="{key}"'
        elif tag == 'meta' and attrs.get('name') == 'description':
            key = self.field('text', attrs.get('content',''), 'Descripción para buscadores')
            replacements.append(('content', key))
        for attr, key in replacements:
            raw = re.sub(r'\b' + attr + r'="[^"]*"', attr + '="{{' + key + '}}"', raw, count=1)
        if marker:
            raw = raw[:-1] + marker + '>'
        if replacements:
            self.edits.append((self.pos(), self.pos()+len(self.get_starttag_text()), raw))
        if tag not in ('img','br','meta','link','input','hr','source','wbr'):
            self.stack.append((tag, attrs))

    def handle_endtag(self, tag):
        for i in range(len(self.stack)-1,-1,-1):
            if self.stack[i][0] == tag:
                self.stack = self.stack[:i]
                break

    def handle_data(self, text):
        if not text.strip() or text.strip() in ('+', '↗', '↓', '*', '2026'):
            return
        if any(t in ('script','style','form','label','button') for t,a in self.stack): return
        eligible = any(t in ('h1','h2','h3','p','summary','title','a') or a.get('class') in ('hero-caption','hero-note','photo-label') for t,a in self.stack)
        if not eligible: return
        value = text.strip()
        key = self.field('text', unescape(value), unescape(value)[:80])
        prefix = text[:len(text)-len(text.lstrip())]
        suffix = text[len(text.rstrip()):]
        tag = self.stack[-1][0]
        replacement = '{{' + key + '}}' if tag == 'title' else '<dtup-text data-edit-field="' + key + '">{{' + key + '}}</dtup-text>'
        self.edits.append((self.pos(), self.pos()+len(text), prefix+replacement+suffix))

extractor = Extractor()
extractor.feed(source)
for start,end,replacement in sorted(extractor.edits, reverse=True):
    source = source[:start] + replacement + source[end:]
source = source.replace('</head>', '  <script src="/preview.js" defer></script>\n</head>')
phone_key = extractor.field('phone', '34691889566', 'Teléfono de WhatsApp (prefijo incluido)')
source = source.replace('<body>', '<body data-whatsapp="{{' + phone_key + '}}">')
(root/'data').mkdir(exist_ok=True)
(root/'template.html').write_text(source, encoding='utf-8')
(root/'schema.json').write_text(json.dumps(extractor.fields, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
(root/'data'/'content.json').write_text(json.dumps({'siteId':'de-todo-un-poco','schemaVersion':1,'values':extractor.values}, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print(f'{len(extractor.fields)} campos preparados; diseño original conservado.')
