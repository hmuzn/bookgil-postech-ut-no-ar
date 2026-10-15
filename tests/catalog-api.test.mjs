import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRecord, searchCatalog} from '../catalog-api.mjs';

const record = {
  pnx: {control: {recordid: ['alma991003815753403286']}, display: {title: ['어른의 행복은 조용하다 ']}, addata: {au: ['태수']}},
  delivery: {holding: [
    {subLocationCode: 'c2n', availabilityStatus: 'unavailable', callNumber: 'PL994.14'},
    {subLocationCode: 'c3b', availabilityStatus: 'available', mainLocation: '박태준학술정보관', subLocation: '단행본3층', callNumber: 'PL994.14.T34178 .태56 2024'}
  ]}
};

test('uses available third-floor holding and never infers a shelf pin', () => {
  const book = normalizeRecord(record);
  assert.equal(book.callNumber, 'PL994.14.T34178 .태56 2024');
  assert.equal(book.pin, null);
  assert.equal(book.location, '박태준학술정보관 단행본3층');
});

test('rejects items without an available third-floor holding', () => {
  assert.equal(normalizeRecord({...record, delivery: {holding: [record.delivery.holding[0]]}}), null);
});

test('search encodes query and keeps only eligible books', async () => {
  let requested;
  const books = await searchCatalog('어른의 행복', async url => {
    requested = url;
    return {ok: true, json: async () => ({docs: [record]})};
  });
  assert.equal(requested.searchParams.get('q'), 'any,contains,어른의 행복');
  assert.equal(books.length, 1);
});
