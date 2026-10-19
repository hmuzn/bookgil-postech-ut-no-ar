/* Route only to corridor access points confirmed beside a shelf. */
(function(root){
  const routing = root.BookgilRouting || (typeof require === 'function' ? require('./routing.js') : null);
  const SIDES = ['inner', 'outer'];
  const LABELS = {inner:'책 앞', outer:'추가'};
  const MAX_ACCESS_DISTANCE = 160; // Printed-map pixels, not metres.

  function validPoint(point){
    return point && Number.isFinite(point.x) && Number.isFinite(point.y)
      && point.x >= 0 && point.x <= 100 && point.y >= 0 && point.y <= 100;
  }

  function pixelDistance(a,b){
    return Math.hypot((a.x-b.x)*15.8,(a.y-b.y)*13.7);
  }

  function corridor(point){
    if(!validPoint(point) || !routing.walkablePoint(point)) return null;
    const snapped = routing.snap(point,8);
    return snapped && snapped.distance <= 8 ? snapped.point : null;
  }

  function suggestAccess(pin){
    if(!validPoint(pin) || !routing.walkablePoint(pin)) return null;
    const candidates=[];
    for(let radius=40;radius<=120;radius+=8){
      for(let angle=0;angle<360;angle+=15){
        const radians=angle*Math.PI/180;
        const point={x:pin.x+Math.cos(radians)*radius/15.8,y:pin.y+Math.sin(radians)*radius/13.7};
        const snapped=corridor(point);
        if(!snapped) continue;
        const distance=pixelDistance(pin,snapped);
        if(distance<35 || distance>MAX_ACCESS_DISTANCE) continue;
        candidates.push({point:snapped,distance});
      }
      if(candidates.length) break;
    }
    candidates.sort((a,b)=>a.distance-b.distance);
    return candidates[0]?.point || null;
  }

  function accessPoints(book){
    if(!validPoint(book?.pin) || !routing.walkablePoint(book.pin)) return [];
    return SIDES.flatMap(side=>{
      const marked = book.approaches?.[side];
      const point = corridor(marked);
      return point && pixelDistance(book.pin,point) <= MAX_ACCESS_DISTANCE
        ? [{side,label:LABELS[side],point}] : [];
    });
  }

  function route(from,book,preferredSide=null){
    if(!validPoint(from) || !routing.walkablePoint(from)) return null;
    const options = accessPoints(book).filter(access=>!preferredSide || access.side===preferredSide).map(access=>{
      const planned = routing.plan(from,access.point);
      return planned && planned.endSnap <= 8 ? {...planned,side:access.side,sideLabel:access.label} : null;
    }).filter(Boolean);
    options.sort((a,b)=>a.distance-b.distance);
    return options[0] || null;
  }

  const api = {accessPoints,corridor,suggestAccess,pixelDistance,route};
  root.BookgilAccess = api;
  if(typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
