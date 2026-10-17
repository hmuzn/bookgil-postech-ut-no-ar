/* A field operator pins one verified physical marker. Visitors scan its printed QR to place the blue dot. */
const startQuery = new URLSearchParams(location.search);
const startParam = startQuery.get('start');
const operatorMode = startQuery.get('operator') === '1';

function validStartPoint(value) {
  if (!/^\d{1,3}(?:\.\d{1,2})?,\d{1,3}(?:\.\d{1,2})?$/.test(value || '')) return null;
  const [x, y] = value.split(',').map(Number);
  if (x < 0 || x > 100 || y < 0 || y > 100) return null;
  const p = {x, y};
  return BookgilRouting.walkablePoint(p) ? BookgilRouting.snap(p, 28)?.point || null : null;
}

function startLink(p) {
  const url = new URL(location.pathname, location.origin);
  url.searchParams.set('start', `${p.x.toFixed(2)},${p.y.toFixed(2)}`);
  return url.href;
}

function openStartQr() {
  if (!state.start || !BookgilRouting.walkablePoint(state.start)) {
    $('startLabel').textContent = '먼저 현장에서 QR을 붙일 실제 통로 위치를 지도에 표시하세요.';
    return;
  }
  const link = startLink(state.start);
  const qr = qrcode(0, 'M');
  qr.addData(link);
  qr.make();
  $('startQrCode').innerHTML = qr.createSvgTag({cellSize: 6, margin: 4});
  $('startQrLink').value = link;
  $('startQrStatus').textContent = '인쇄한 QR을 지도에서 표시한 바로 그 위치에 붙이세요.';
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
    state.start = anchor;
    state.current = anchor;
    state.reference = null;
    state.mapOffset = null;
    state.stepUnit = null;
    document.body.classList.add('participant-intro-mode');
    show('setup');
    document.querySelector('#setupView .subcopy').textContent = '시작 QR 위치가 지도에 표시됐어요. 실제 QR 앞에 서 있는지 확인한 뒤 책 검색을 시작하세요.';
    document.querySelector('.start-qr-maker').hidden = true;
    const begin = document.createElement('button');
    begin.id = 'beginBookSearch';
    begin.type = 'button';
    begin.className = 'primary full';
    begin.textContent = '책 검색 시작 →';
    begin.onclick = () => {
      document.body.classList.remove('participant-intro-mode');
      begin.remove();
      document.querySelector('#setupView .subcopy').textContent = 'QR에서 출발 위치를 불러왔어요. ② 눈앞에 보이는 기준 지점을 지도에 표시하고, ③ 방향과 ④ 걸음을 보정하세요.';
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
  document.querySelector('#setupView .subcopy').textContent = '진행자 단계입니다. QR을 붙일 실제 통로에 서서 지도에 그 지점을 표시하고 QR을 만드세요. 방향·걸음 보정은 참가자가 QR을 찍은 뒤 각자 진행합니다.';
  $('startLabel').textContent = '현장에서 확인한 QR 설치 위치를 지도에 표시하세요.';
}
