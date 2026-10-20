const PRIMO = 'https://postech.primo.exlibrisgroup.com';
const VID = '82POSTECH_INST:82POSTECH';

export function normalizeRecord(record) {
  const pnx = record?.pnx || {};
  const holdings = record?.delivery?.holding || [];
  const holding = holdings.find(item => item.subLocationCode === 'c3b' && item.availabilityStatus === 'available');
  const id = pnx.control?.recordid?.[0];
  const title = pnx.display?.title?.[0]?.trim();
  if (!holding?.callNumber || !id?.startsWith('alma') || !title) return null;
  return {
    id,
    title,
    author: pnx.addata?.au?.[0] || pnx.sort?.author?.[0] || '',
    callNumber: holding.callNumber,
    location: `${holding.mainLocation || '박태준학술정보관'} ${holding.subLocation || '단행본3층'}`,
    catalogUrl: `${PRIMO}/discovery/fulldisplay?docid=${encodeURIComponent(id)}&context=L&vid=${encodeURIComponent(VID)}&lang=ko`,
    verified: true,
    pin: null
  };
}

export async function searchCatalog(query, fetchImpl = fetch) {
  const q = String(query || '').trim();
  if (q.length < 2 || q.length > 80) throw new Error('검색어는 2~80자로 입력하세요.');
  const url = new URL('/primaws/rest/pub/pnxs', PRIMO);
  url.searchParams.set('vid', VID);
  url.searchParams.set('lang', 'ko');
  url.searchParams.set('q', `any,contains,${q}`);
  url.searchParams.set('scope', 'MyInstitution');
  url.searchParams.set('limit', '20');
  const response = await fetchImpl(url, {headers: {Accept: 'application/json'}});
  if (!response.ok) throw new Error('POSTECH 검색에 연결하지 못했습니다.');
  const data = await response.json();
  return [...new Map((data.docs || []).map(normalizeRecord).filter(Boolean).map(book => [book.id, book])).values()];
}
