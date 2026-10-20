/* A field operator pins one verified physical marker. Visitors scan its printed QR to place the blue dot. */
const startQuery = new URLSearchParams(location.search);
const startParam = startQuery.get('start');
const operatorMode = startQuery.get('operator') === '1';

function validStartPoint(value) {
  if (!/^\d{1,3}(?:\.\d{1,2})?,\d{1,3}(?:\.\d{1,2})?$/.test(value || '')) return null;
  const [x, y] = value.split(',').map(Number);
  if (x < 0 || x > 100 || y < 0 || y > 100) return null;
  const p = {x, y};
  return BookgilAccess.corridor(p);
}

function startLink(p) {
  const url = new URL(location.pathname, location.origin);
  url.searchParams.set('start', `${p.x.toFixed(2)},${p.y.toFixed(2)}`);
  const configured = verifiedBooks.flatMap(({id}) => {
    const b = book(id);
    const access = BookgilAccess.accessPoints(b);
    if (!access.length) return [];
    const at = side => access.find(a => a.side === side)?.point || null;
    const compact = point => point ? [Number(point.x.toFixed(2)), Number(point.y.toFixed(2))] : null;
    return [[id, compact(b.pin), compact(at('inner')), compact(at('outer'))]];
  });
  if (configured.length) url.searchParams.set('books', JSON.stringify(configured));
  return url.href;
}

function loadBookPins(value) {
  if (!value || value.length > 1000) return 0;
  let rows;
  try { rows = JSON.parse(value); } catch { return 0; }
  if (!Array.isArray(rows) || rows.length > verifiedBooks.length) return 0;
  let loaded = 0;
  for (const row of rows) {
    if (!Array.isArray(row) || row.length !== 4) continue;
    const [id,pin,inner,outer] = row;
    if (!verifiedBooks.some(b => b.id === id)) continue;
    const makePoint = pair => Array.isArray(pair) && pair.length === 2 ? {x:pair[0],y:pair[1]} : null;
    const candidate = {pin:makePoint(pin),approaches:{inner:makePoint(inner),outer:makePoint(outer)}};
    const access = BookgilAccess.accessPoints(candidate);
    if (!access.length) continue;
    const target = book(id);
    target.pin = candidate.pin;
    target.approaches = Object.fromEntries(access.map(a => [a.side,a.point]));
    loaded++;
  }
  if (loaded) persist();
  return loaded;
}

function renderOperatorBooks() {
  const container = $('operatorBooks');
  if (!container) return;
  container.innerHTML = '<strong>테스트할 두 책의 서가·접근 통로</strong><p>현장에서 확인한 책 위치와 실제 접근 통로를 표시하면 QR에 함께 담겨 참가자 폰으로 전달됩니다.</p>'
    + verifiedBooks.map(({id,title}) => {
      const ready = BookgilAccess.accessPoints(book(id)).length;
      return '<div class="operator-book"><span>'+esc(title)+'<small>'+(ready?'접근 통로 '+ready+'곳 표시됨':'위치 확인 필요')+'</small></span><button type="button" data-operator-pin="'+esc(id)+'">위치 표시</button></div>';
    }).join('');
  container.querySelectorAll('[data-operator-pin]').forEach(button => button.onclick = () => openPin(button.dataset.operatorPin));
}

function openStartQr() {
  const start = BookgilAccess.corridor(state.start);
  if (!start) {
    $('startLabel').textContent = '먼저 QR을 붙일 실제 통로 위치를 정확히 표시하세요. 구조물 가까이 찍힌 지점은 사용할 수 없어요.';
    return;
  }
  const link = startLink(start);
  const qr = qrcode(0, 'M');
  qr.addData(link);
  qr.make();
  $('startQrCode').innerHTML = qr.createSvgTag({cellSize: 6, margin: 4});
  $('startQrLink').value = link;
  const ready = verifiedBooks.filter(({id}) => BookgilAccess.accessPoints(book(id)).length).length;
  $('startQrStatus').textContent = '이 QR을 표시한 바로 그 위치에 붙이세요. '+(ready ? `책 ${ready}권의 서가 접근 통로가 포함됐어요.` : '책 위치는 아직 포함되지 않았어요. 참가자가 직접 표시해야 합니다.');
  $('startQrDialog').showModal();
}

async function copyStartQrLink() {
  try {
    await navigator.clipboard.writeText($('startQrLink').value);
    $('startQrStatus').textContent = '링크를 복사했어요. QR도 같은 위치에 붙여야 정확합니다.';
  } catch {
    $('startQrLink').select();
    $('startQrStatus').textContent = '링크를 선택했어요. 복사해서 공유하세요.';
  }
}

$('makeStartQr').onclick = openStartQr;
$('closeStartQr').onclick = () => $('startQrDialog').close();
$('copyStartQr').onclick = copyStartQrLink;
$('printStartQr').onclick = () => window.print();

if (startParam !== null) {
  const anchor = validStartPoint(startParam);
  if (anchor) {
    const loadedBooks = loadBookPins(startQuery.get('books'));
    state.start = anchor;
    state.current = anchor;
    state.reference = null;
    state.mapOffset = null;
    state.stepUnit = null;
    document.body.classList.add('participant-intro-mode');
    show('setup');
    document.querySelector('#setupView .subcopy').textContent = '시작 QR 위치가 지도에 표시됐어요. 실제 QR 앞에 서 있는지 확인한 뒤 책 검색을 시작하세요.'+(loadedBooks ? ` 책 ${loadedBooks}권의 서가 접근 통로도 준비됐어요.` : ' 책 위치는 카트에서 확인해 표시하세요.');
    document.querySelector('.start-qr-maker').hidden = true;
    const begin = document.createElement('button');
    begin.id = 'beginBookSearch';
    begin.type = 'button';
    begin.className = 'primary full';
    begin.textContent = '책 검색 시작 →';
    begin.onclick = () => {
      document.body.classList.remove('participant-intro-mode');
      begin.remove();
      document.querySelector('#setupView .subcopy').textContent = 'QR에서 출발점을 불러왔어요. 실제 위치와 맞으면 바로 지도 길안내를 시작하세요. 자동 블루닷 이동은 선택해서 설정할 수 있어요.';
      show('search');
    };
    $('startLabel').after(begin);
    $('startLabel').textContent = '파란 점이 QR에 저장된 출발 위치입니다.';
  } else {
    $('searchStatus').textContent = '시작 QR의 위치를 확인할 수 없습니다. 현장 운영자에게 알려주세요.';
  }
} else if (operatorMode) {
  document.body.classList.add('operator-mode');
  show('setup');
  const operatorBooks = document.createElement('div');
  operatorBooks.id = 'operatorBooks';
  operatorBooks.className = 'operator-books';
  document.querySelector('.start-qr-maker').before(operatorBooks);
  renderOperatorBooks();
  $('pinDialog').addEventListener('close', renderOperatorBooks);
  document.querySelector('#setupView .subcopy').textContent = '진행자 단계입니다. QR을 붙일 실제 통로에 서서 지도에 그 지점을 표시하고 QR을 만드세요. 참가자는 QR을 찍고 책을 골라 바로 지도 경로를 볼 수 있습니다. 자동 블루닷 이동은 선택해서 설정합니다.';
  $('startLabel').textContent = '현장에서 확인한 QR 설치 위치를 지도에 표시하세요.';
}
