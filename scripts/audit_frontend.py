"""Dependency-free source audit; browser layout and computed accessibility need manual QA."""
from collections import Counter, defaultdict
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import json
import re

ROOT = Path(__file__).resolve().parents[1]
VOID = set('area base br col embed hr img input link meta param source track wbr'.split())
OPTIONAL = set('html head body p li dt dd rt rp optgroup option colgroup thead tbody tfoot tr td th'.split())

class Document(HTMLParser):
    def __init__(self, path):
        super().__init__(convert_charrefs=True)
        self.path = path
        self.nodes = []
        self.stack = []
        self.issues = []

    def issue(self, code, line, detail):
        self.issues.append(dict(file=self.path.relative_to(ROOT).as_posix(), line=line, code=code, detail=detail))

    def handle_starttag(self, tag, attrs):
        node = dict(tag=tag, attrs=dict(attrs), line=self.getpos()[0], text='', ancestors=self.stack.copy(), source=self.get_starttag_text())
        self.nodes.append(node)
        if tag not in VOID:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID:
            self.stack.pop()

    def handle_data(self, data):
        for node in self.stack:
            node['text'] += data

    def handle_endtag(self, tag):
        indexes = [i for i, node in enumerate(self.stack) if node['tag'] == tag]
        if not indexes:
            self.issue('unmatched-close', self.getpos()[0], tag)
            return
        index = indexes[-1]
        for node in self.stack[index + 1:]:
            if node['tag'] not in OPTIONAL:
                self.issue('unclosed-tag', node['line'], f"<{node['tag']}> implicitly closed by </{tag}>")
        self.stack = self.stack[:index]

    def finish(self):
        for node in self.stack:
            if node['tag'] not in OPTIONAL:
                self.issue('unclosed-tag', node['line'], node['tag'])
        ids = Counter(n['attrs']['id'] for n in self.nodes if 'id' in n['attrs'])
        labels = {n['attrs'].get('for') for n in self.nodes if n['tag'] == 'label'}
        for node in self.nodes:
            tag, a, line = node['tag'], node['attrs'], node['line']
            hidden = any('hidden' in n['attrs'] or n['attrs'].get('aria-hidden') == 'true' for n in [node] + node['ancestors'])
            if a.get('id') and ids[a['id']] > 1:
                self.issue('duplicate-id', line, a['id'])
            for attr in ['aria-labelledby', 'aria-describedby', 'aria-controls']:
                for target in (a.get(attr) or '').split():
                    if target not in ids:
                        self.issue('missing-aria-target', line, f'{attr}="{target}"')
            if tag == 'label' and a.get('for') not in ids and a.get('for'):
                self.issue('missing-label-target', line, a['for'])
            if tag == 'img' and 'alt' not in a:
                self.issue('missing-alt', line, a.get('src', ''))
            if tag in ['input', 'textarea', 'select'] and a.get('type') not in ['hidden', 'button', 'submit', 'reset'] and not hidden:
                if not (a.get('aria-label') or a.get('aria-labelledby') or a.get('id') in labels or any(n['tag'] == 'label' for n in node['ancestors'])):
                    self.issue('unlabelled-control', line, node['source'])
            if tag in ['a', 'button'] and not hidden and not (node['text'].strip() or a.get('aria-label') or a.get('aria-labelledby') or a.get('title')):
                descendants = [n for n in self.nodes if any(parent is node for parent in n['ancestors'])]
                if not any(n['attrs'].get('alt') for n in descendants):
                    self.issue('unnamed-control', line, node['source'])
            if tag == 'a' and a.get('href') == '#':
                self.issue('placeholder-link', line, node['text'].strip() or node['source'])
            if tag == 'form' and any(n['tag'] == 'form' for n in node['ancestors']):
                self.issue('nested-form', line, node['source'])
            for attr in ['href', 'src']:
                target = a.get(attr)
                if not target or target.startswith(('http:', 'https:', '//', 'mailto:', 'tel:', 'data:', 'javascript:')):
                    continue
                url = urlsplit(target)
                dest = self.path.parent / unquote(url.path) if url.path else self.path
                if url.path and not dest.exists():
                    self.issue('missing-file', line, target)
                elif not url.path and url.fragment and unquote(url.fragment) not in ids:
                    self.issue('missing-fragment', line, target)
        if not any(n['tag'] == 'meta' and n['attrs'].get('name') == 'viewport' for n in self.nodes):
            self.issue('missing-viewport', 1, 'No viewport meta')

def css_rules(text):
    """Collect rule declarations with enclosing at-rules; retain physical line numbers."""
    clean = re.sub(r'/\*.*?\*/', lambda m: re.sub(r'[^\n]', ' ', m.group()), text, flags=re.S)
    tokens = re.finditer(r'''"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[{}]''', clean)
    stack, start, rules = [], 0, []
    for token in tokens:
        if token.group() == '{':
            header = clean[start:token.start()].strip()
            # @import and other statements before first qualified rule.
            header = header.rsplit(';', 1)[-1].strip()
            offset = clean.find(header, start) if header else start
            stack.append((header, token.end(), 1 + clean.count('\n', 0, offset)))
            start = token.end()
        elif token.group() == '}':
            if not stack:
                raise ValueError('Unmatched CSS closing brace')
            header, body, line = stack.pop()
            if not header.startswith('@'):
                rules.append(dict(selector=header, line=line, context=[item[0] for item in stack], body=clean[body:token.start()].strip()))
            start = token.end()
    if stack:
        raise ValueError('Unclosed CSS rule')
    return rules

def audit():
    html_paths = sorted(ROOT.rglob('*.html'))
    css_paths = sorted(ROOT.rglob('*.css'))
    docs, findings, rules, inline = [], [], [], []
    for path in html_paths:
        doc = Document(path)
        doc.feed(path.read_text(encoding='utf-8'))
        doc.finish()
        docs.append(doc)
        findings.extend(doc.issues)
        for node in doc.nodes:
            if node['tag'] == 'style':
                for rule in css_rules(node['text']):
                    rule['line'] += node['line'] - 1
                    rule['file'] = path.relative_to(ROOT).as_posix()
                    rules.append(rule)
            if 'style' in node['attrs']:
                inline.append(dict(file=path.relative_to(ROOT).as_posix(), line=node['line'], style=node['attrs']['style']))
    by_path = {doc.path.resolve(): doc for doc in docs}
    for doc in docs:
        for node in doc.nodes:
            target = node['attrs'].get('href', '')
            url = urlsplit(target)
            if url.scheme or url.netloc or not url.path or not url.fragment:
                continue
            other = by_path.get((doc.path.parent / unquote(url.path)).resolve())
            if other and not any(n['attrs'].get('id') == unquote(url.fragment) for n in other.nodes):
                findings.append(dict(file=doc.path.relative_to(ROOT).as_posix(), line=node['line'], code='missing-fragment', detail=target))
    for path in css_paths:
        for rule in css_rules(path.read_text(encoding='utf-8')):
            rule['file'] = path.relative_to(ROOT).as_posix()
            rules.append(rule)
    duplicate_rules = defaultdict(list)
    for rule in rules:
        duplicate_rules[(rule['file'], tuple(rule['context']), rule['selector'])].append(rule)
    duplicates = [group for group in duplicate_rules.values() if len(group) > 1]
    # Candidates only: JS may construct selectors and class names dynamically.
    usage = '\n'.join(path.read_text(encoding='utf-8') for path in html_paths + list((ROOT / 'assets/js').glob('*.js')))
    unused = []
    for rule in rules:
        names = re.findall(r'\.([a-zA-Z_][\w-]*)', re.sub(r'\[[^]]*\]', '', rule['selector']))
        if names and any(not re.search(r'(?<![\w-])' + re.escape(name) + r'(?![\w-])', usage) for name in names):
            unused.append({key: rule[key] for key in ['file', 'line', 'selector']})
    result = dict(html_files=len(html_paths), css_files=len(css_paths), css_rules=len(rules), scanned_files=[path.relative_to(ROOT).as_posix() for path in html_paths + css_paths], inline_styles=inline, findings=findings, duplicate_selector_groups=duplicates, unused_selector_candidates=unused)
    output = ROOT / 'docs/frontend-audit-data.json'
    output.write_text(json.dumps(result, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(json.dumps({k: result[k] for k in ['html_files', 'css_files', 'css_rules']}))
    print('Findings:', dict(Counter(item['code'] for item in findings)))
    print('Repeated selectors:', len(duplicates), 'Unused candidates:', len(unused))
    return result

if __name__ == '__main__':
    audit()
