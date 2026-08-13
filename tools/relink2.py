import os, re
from bs4 import BeautifulSoup
SRC="/sessions/awesome-zen-brown/mnt/FIBA-2026/design-system"
CHK="/sessions/awesome-zen-brown/mnt/FIBA-2026/fiba-nl-prototype/system/_check"
FILES=["01-foundations.html","02-elements.html","03a-modules-frame.html",
       "03b-modules-ranking.html","03c-modules-content.html","04-templates.html"]
HREFS=["../../assets/tokens.css","../../assets/base.css","../../assets/elements.css",
       "../../assets/modules.css","../assets/docs.css","../../assets/motion.css"]
for f in FILES:
    raw=open(os.path.join(SRC,f),encoding="utf-8").read()
    soup=BeautifulSoup(raw,"lxml")
    before=len(soup.find_all(True))
    for s in soup.find_all("style"): s.decompose()
    for h in HREFS:
        t=soup.new_tag("link"); t["rel"]="stylesheet"; t["href"]=h; soup.head.append(t)
    m=soup.new_tag("meta"); m["name"]="robots"; m["content"]="noindex"; soup.head.append(m)
    after=len(soup.find_all(True))
    out=str(soup)
    # BeautifulSoup lowercases attribute and tag names; SVG is case-sensitive,
    # so restore every camelCase name harvested from the original file.
    cam = set(re.findall(r"</?([a-zA-Z]*[A-Z][a-zA-Z]*)[\s/>]", raw)) | \
          set(re.findall(r"\s([a-zA-Z-]*[A-Z][a-zA-Z-]*)\s*=", raw))
    for c in sorted({c for c in cam if c.lower()!=c}, key=len, reverse=True):
        lo=c.lower()
        out=re.sub(rf"(?<=\s){lo}(\s*=)", c+r"\1", out)
        out=re.sub(rf"(</?){lo}(?=[\s/>])", r"\1"+c, out)
    open(os.path.join(CHK,f),"w").write(out)
    print(f"{f:26} elements {before:6} -> {after:6}   heads={len(soup.find_all('head'))}  links={len(soup.find_all('link'))}")
