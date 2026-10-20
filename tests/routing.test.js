const assert = require('node:assert/strict');
const routing = require('../routing.js');

const point = (x, y) => ({x: x / 1580 * 100, y: y / 1370 * 100});
const pixelDistance = (a, b) => Math.hypot((a.x - b.x) * 15.8, (a.y - b.y) * 13.7);

const start = point(790, 900);
const shelf = point(1050, 985);
const route = routing.plan(start, shelf);
assert.ok(route, 'screenshot example must have a corridor route');
assert.ok(route.distance > pixelDistance(start, shelf) + 80, 'the route must detour around shelves');
assert.ok(route.path.every(routing.walkablePoint), 'the path must stay outside the central opening and rooms');
assert.ok(route.path.every((p, i) => i === 0 || pixelDistance(p, route.path[i - 1]) <= 12), 'path cells must be adjacent');

assert.equal(routing.plan(point(760, 620), shelf), null, 'a start in the central opening is rejected');
assert.equal(routing.plan(start, point(760, 620)), null, 'a destination in the central opening is rejected');
assert.equal(routing.straightWalkable(point(500, 650), point(1060, 650)), false, 'walking calibration cannot cross the opening');
assert.ok(routing.plan(point(500, 650), point(1060, 650)).distance > 560, 'opposite sides route around the opening');
const sameCorridorCell = routing.snap(start, 28).point;
assert.equal(routing.straightWalkable(sameCorridorCell, sameCorridorCell), true, 'staying in one walkable cell is valid');

console.log('Routing checks passed');
