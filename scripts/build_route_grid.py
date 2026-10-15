from PIL import Image, ImageDraw
from collections import deque
from pathlib import Path
import json
src=Path(__file__).resolve().parents[1] / 'assets/postech-3f-stacks.png'
im=Image.open(src).convert('RGB'); w,h=im.size; S=8; cols=(w+S-1)//S; rows=(h+S-1)//S
floor=[(515,258),(1185,258),(1270,335),(1335,470),(1370,620),(1360,775),(1310,930),(1215,1060),(1105,1150),(950,1210),(800,1235),(660,1210),(550,1170),(505,1110),(470,1000),(445,900),(355,815),(295,740),(265,630),(290,510),(355,385),(465,275)]
void=[(630,420),(690,390),(760,385),(830,390),(910,425),(970,485),(1000,560),(1010,640),(1000,715),(965,790),(905,845),(830,875),(750,880),(680,860),(610,815),(555,745),(520,670),(520,590),(630,590)]
mask=Image.new('L',(w,h),0); draw=ImageDraw.Draw(mask);draw.polygon(floor,fill=255);draw.polygon(void,fill=0)
# Study rooms and facilities occupy this lower-left wedge.
draw.polygon([(0,720),(420,720),(485,850),(530,1030),(560,1210),(0,1370)],fill=0)
pix=im.load(); allowed=mask.load(); arr=[]
for gy in range(rows):
 for gx in range(cols):
  x=min(w-1,gx*S+S//2);y=min(h-1,gy*S+S//2)
  ok=allowed[x,y]>0
  if ok:
   for yy in range(max(0,y-5),min(h,y+6),2):
    for xx in range(max(0,x-5),min(w,x+6),2):
     r,g,b=pix[xx,yy]
     if max(r,g,b)<125:ok=False;break
    if not ok:break
  arr.append(1 if ok else 0)
# Connected components
seen=set(); comps=[]
for i,v in enumerate(arr):
 if not v or i in seen:continue
 q=deque([i]);seen.add(i);comp=[]
 while q:
  j=q.popleft();comp.append(j);x=j%cols;y=j//cols
  for nx,ny in ((x+1,y),(x-1,y),(x,y+1),(x,y-1)):
   k=ny*cols+nx
   if 0<=nx<cols and 0<=ny<rows and arr[k] and k not in seen:seen.add(k);q.append(k)
 comps.append(comp)
comps.sort(key=len,reverse=True)
print(cols,rows,'walkable',sum(arr),'components',len(comps),'largest',[(len(c)) for c in comps[:10]])
# Keep only largest navigable component. This rejects isolated voids/rooms.
keep=set(comps[0]);arr=[int(i in keep) for i in range(len(arr))]
# Bitset, base64 for runtime.
import base64
bits=bytearray((len(arr)+7)//8)
for i,v in enumerate(arr):
 if v:bits[i>>3]|=1<<(i&7)
Path(__file__).with_name('walkgrid.json').write_text(json.dumps({'width':w,'height':h,'cell':S,'cols':cols,'rows':rows,'bits':base64.b64encode(bits).decode()}))
vis=im.copy(); d=ImageDraw.Draw(vis,'RGBA')
for gy in range(rows):
 for gx in range(cols):
  if arr[gy*cols+gx]: d.rectangle((gx*S,gy*S,(gx+1)*S,(gy+1)*S),fill=(40,150,255,65))
vis.save('/private/tmp/bookgil-walkgrid-preview.png')
