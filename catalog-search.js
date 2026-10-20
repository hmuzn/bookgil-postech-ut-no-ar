// Public POSTECH catalog results are filtered to available 3F monographs by the same-origin API.
let catalogTimer = 0;
let catalogRequest = 0;

async function searchPostechCatalog() {
  clearTimeout(catalogTimer);
  const query = $('searchInput').value.trim();
  const request = ++catalogRequest;
  renderSearch();
  if (query.length < 2) {
    $('searchStatus').textContent = query ? '두 글자 이상 입력하세요.' : '제목이나 청구기호를 입력하면 POSTECH 소장 자료를 검색합니다.';
    return;
  }
  $('searchStatus').textContent = 'POSTECH 공식 소장 자료를 검색하는 중…';
  catalogTimer = setTimeout(async () => {
    try {
      const response = await fetch('/api/books?q=' + encodeURIComponent(query));
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '검색 실패');
      if (request !== catalogRequest) return;
      for (const item of data.books) {
        const old = book(item.id);
        if (old) Object.assign(old, {...item, pin: old.pin});
        else state.books.push(item);
      }
      $('searchStatus').textContent = data.books.length
        ? `3층에서 이용 가능한 책 ${data.books.length}권을 찾았습니다. 정확한 서가 위치는 아직 확인이 필요합니다.`
        : '3층에서 이용 가능한 검색 결과가 없습니다. 공식 검색에서도 확인해 주세요.';
      renderSearch();
    } catch {
      if (request !== catalogRequest) return;
      $('searchStatus').textContent = '자동 검색 연결에 실패했습니다. 공식 검색에서 확인하거나 잠시 후 다시 검색해 주세요.';
    }
  }, 350);
}

$('searchInput').oninput = searchPostechCatalog;
$('clearSearch').onclick = () => {
  $('searchInput').value = '';
  searchPostechCatalog();
};
