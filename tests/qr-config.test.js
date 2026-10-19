const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const access = require('../access-routing.js');

const point = (x,y) => ({x:x/15.8,y:y/13.7});
const ids = ['alma991003815753403286','alma991003350079503286'];
const shelf = point(1050,985);
const configured = [
  {id:ids[0],pin:shelf,approaches:{inner:point(1010,980),outer:point(1170,980)}},
  {id:ids[1],pin:point(1050,985),approaches:{inner:point(1010,980)}}
];

function context(books){
  let persisted = 0;
  const sandbox = {
    URL,URLSearchParams,location:{search:'',pathname:'/',origin:'https://bookgil-postech-map-qr-ut.jin30606.chatgpt.site'},
    BookgilAccess:access,verifiedBooks:ids.map(id=>({id})),book:id=>books.find(b=>b.id===id),
    $:()=>({}),persist:()=>persisted++,state:{books},navigator:{},document:{},
    get persistCount(){return persisted}
  };
  vm.runInNewContext(fs.readFileSync(require.resolve('../start-qr.js'),'utf8'),sandbox);
  return sandbox;
}

const operator = context(configured);
const link = operator.startLink(point(790,900));
const participant = context(ids.map(id=>({id,pin:null})));
assert.equal(participant.loadBookPins(new URL(link).searchParams.get('books')),2);
assert.equal(participant.persistCount,1);
assert.equal(access.accessPoints(participant.state.books[0]).length,2);
assert.equal(access.accessPoints(participant.state.books[1]).length,1);
assert.equal(participant.loadBookPins(JSON.stringify([[ids[0],[48,45],[48,44],null]])),0,'central opening cannot be loaded');

console.log('QR book setup transfer checks passed');
