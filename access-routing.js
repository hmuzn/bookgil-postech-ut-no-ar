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

  const api = {accessPoints,corridor,pixelDistance,route};
  root.BookgilAccess = api;
  if(typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
