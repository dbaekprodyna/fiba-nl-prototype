import re, os, json, collections
SRC="/sessions/awesome-zen-brown/mnt/FIBA-2026/design-system"
def style(f):
    t=open(os.path.join(SRC,f),encoding="utf-8").read()
    return re.sub(r"/\*.*?\*/","", "\n".join(re.findall(r"<style>(.*?)</style>",t,re.S)), flags=re.S)

def parse(css, ctx=""):
    out,i,n,buf=[],0,len(css),""
    while i<n:
        if css[i]=="{":
            d,j=1,i+1
            while j<n and d:
                if css[j]=="{":d+=1
                elif css[j]=="}":d-=1
                j+=1
            head,body=buf.strip(),css[i+1:j-1]
            if head.startswith("@") and not head.startswith("@font-face"):
                if head.startswith("@keyframes"): out.append((ctx,head,body.strip(),True))
                else: out.extend(parse(body,(ctx+" "+head).strip()))
            else:
                out.append((ctx,head," ".join(body.split()),False))
            buf="";i=j
        else: buf+=css[i];i+=1
    return out

base = parse(style("04-templates.html"))
el   = {(c,h):d for c,h,d,k in parse(style("02-elements.html"))}
fnd  = parse(style("01-foundations.html"))

MODERN = lambda d: "--of:" in d or "--n:" in d
merged=[]; upgraded=[]
for ctx,head,decls,iskf in base:
    key=(ctx,head)
    if not iskf and key in el and el[key]!=decls:
        if MODERN(el[key]) and not MODERN(decls):
            decls=el[key]; upgraded.append(head)
        elif head==".t-h2" or head==".lbl":
            decls=el[key]
    merged.append((ctx,head,decls,iskf))

# union :root from both variants
roots=[d for c,h,d,k in base+list((c,h,d,False) for (c,h),d in el.items())+fnd if h==":root"]
allvars={}
for d in roots:
    for p in d.split(";"):
        if ":" in p:
            k,v=p.split(":",1); allvars[k.strip()]=v.strip()

# foundations-only selectors
seen={(c,h) for c,h,d,k in base}
fnd_only=[(c,h,d,k) for c,h,d,k in fnd if (c,h) not in seen and h!=":root"]

print(f"merged rules       : {len(merged)}")
print(f"upgraded to cut-border fix : {len(upgraded)}")
print(f"tokens (:root vars): {len(allvars)}")
print(f"foundations-only   : {len(fnd_only)}")

DOC_PREFIX = (".doc",".el-block",".el-head",".el-purpose",".el-states",".el-state",".el-note",
              ".ds-name",".m-block",".m-head",".m-states",".m-state",".m-frame",".m-family",
              ".tpl-block",".tpl-head",".tpl-frame",".fn-",".bs-box",".sw",".spec",".gridcol",".tok")
BASE_SEL = re.compile(r"^(\*|body|b|html|\.cut|\.cutfill|\.t-[a-z0-9-]+|\.lbl|\.focus-ring)$")

def bucket(head):
    h=head.split()[0].split(":")[0]
    if any(h.startswith(p) for p in DOC_PREFIX): return "docs"
    if BASE_SEL.match(h): return "base"
    return None

cnt=collections.Counter()
for c,h,d,k in merged+fnd_only:
    b=bucket(h) or ("elements" if (c,h) in el else "modules")
    cnt[b]+=1
print("\n=== bucket split ===")
for b,n in cnt.most_common(): print(f"  {b:10} {n:5}")
json.dump({"vars":allvars,"upgraded":upgraded}, open("merged.json","w"), indent=1)
