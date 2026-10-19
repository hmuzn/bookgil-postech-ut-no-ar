const assert = require('node:assert/strict');
const routing = require('../routing.js');
const access = require('../access-routing.js');

const point = (x,y) => ({x:x/15.8,y:y/13.7});
const shelf = {
  pin: point(1050,985),
  approaches: {
    inner: point(1010,980),
    outer: point(1170,980)
  }
};

const fromInside = access.route(point(790,900),shelf);
const fromOutside = access.route(point(1200,1000),shelf);
assert.equal(fromInside?.side,'inner','inner corridor start should use the inner access');
assert.equal(fromOutside?.side,'outer','outer corridor start should use the outer access');
assert.equal(access.route(point(1200,1000),shelf,'inner')?.side,'inner','the selected side stays fixed while walking');
assert.ok(fromInside.path.every(routing.walkablePoint));
assert.ok(fromOutside.path.every(routing.walkablePoint));
assert.equal(access.route(point(790,900),{pin:shelf.pin}),null,'an old shelf-only pin cannot be routed');
assert.equal(access.corridor(point(760,620)),null,'the central opening is not a corridor');
assert.equal(access.route(point(790,900),{pin:shelf.pin,approaches:{inner:point(600,450)}}),null,'a distant aisle cannot be registered as shelf access');
const suggested = access.suggestAccess(shelf.pin);
assert.ok(suggested,'the map should suggest a nearby corridor from a shelf point');
assert.equal(access.accessPoints({pin:shelf.pin,approaches:{inner:suggested}}).length,1);
assert.ok(access.pixelDistance(shelf.pin,suggested)>=35);
assert.equal(access.suggestAccess(point(760,620)),null,'no corridor may be suggested from the central opening');

console.log('Shelf access routing checks passed');
