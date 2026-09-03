import { ROOMS, getRoom } from './rooms.js?v=20260903-1';
import { getStoredRoomLabels, saveStoredRoomLabels, getRoomLabel, packedRoomLabels } from './room-labels.js?v=20260903-1';
import { dataService } from './data-service.js?v=20260903-1';

const statGrid = document.querySelector('#statGrid');
const list = document.querySelector('#submissionList');
const filter = document.querySelector('#roomFilter');
const actionRoom = document.querySelector('#actionRoom');
const lockBtn = document.querySelector('#lockBtn');
const seedRoomBtn = document.querySelector('#seedRoomBtn');
const projectionControls = document.querySelector('#projectionControls');
const projectionStatus = document.querySelector('#projectionStatus');
const roomNameInputs = [...document.querySelectorAll('.room-name-input')];
const roomNameStatus = document.querySelector('#roomNameStatus');
const displayPageLink = document.querySelector('#displayPageLink');
const qrcodePageLink = document.querySelector('#qrcodePageLink');

function labels() { return getStoredRoomLabels(); }

function updateShareLinks() {
  const packed = packedRoomLabels(labels());
  if (displayPageLink) {
    const url = new URL('display.html', location.href);
    url.searchParams.set('labels', packed);
    displayPageLink.href = url.href;
  }
  if (qrcodePageLink) {
    const url = new URL('qrcodes.html', location.href);
    url.searchParams.set('labels', packed);
    qrcodePageLink.href = url.href;
  }
}

function populateRoomSelectors() {
  const filterValue = filter.value || 'all';
  const actionValue = actionRoom.value || 'room1';
  filter.innerHTML = '<option value="all">全部包廂</option>' + ROOMS.map(r => `<option value="${r.id}">${getRoomLabel(r.id)}（內部：${r.name}）</option>`).join('');
  actionRoom.innerHTML = ROOMS.map(r => `<option value="${r.id}">${getRoomLabel(r.id)}（內部：${r.name}）</option>`).join('');
  filter.value = [...filter.options].some(o => o.value === filterValue) ? filterValue : 'all';
  actionRoom.value = [...actionRoom.options].some(o => o.value === actionValue) ? actionValue : 'room1';
}

function buildProjectionControls() {
  projectionControls.innerHTML = '';
  const projectionOptions = [
    { id: 'waiting', label: '待機畫面' },
    ...ROOMS.map(room => ({ id: room.id, label: getRoomLabel(room.id) }))
  ];
  projectionOptions.forEach((option) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = option.id === 'waiting' ? 'btn soft' : 'btn primary';
    button.dataset.projection = option.id;
    button.textContent = option.label;
    button.addEventListener('click', async () => {
      try { await dataService.setCurrentRoom(option.id); } catch (error) { showError(error); }
    });
    projectionControls.appendChild(button);
  });
}

function renderProjectionControl() {
  const rawCurrent = dataService.getCurrentRoom();
  const currentRoom = getRoom(rawCurrent);
  const current = rawCurrent === 'waiting' || currentRoom ? rawCurrent : 'waiting';
  projectionStatus.textContent = current === 'waiting'
    ? '目前投影：待機畫面'
    : `目前投影：${getRoomLabel(currentRoom.id)}（內部：${currentRoom.name}）`;
  [...projectionControls.children].forEach((button) => {
    const active = button.dataset.projection === current;
    button.style.outline = active ? '4px solid rgba(124,131,253,.24)' : '';
    button.style.transform = active ? 'translateY(-2px)' : '';
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}

function render() {
  renderProjectionControl();
  const stats = dataService.getStats();
  statGrid.innerHTML = ROOMS.map(room => `<div class="stat-card"><div>${getRoomLabel(room.id)}</div><div class="small-note" style="margin-top:3px">內部：${room.name}</div><div class="count">${stats[room.id] || 0}</div><div class="small-note">份投稿</div></div>`).join('');
  lockBtn.textContent = dataService.isLocked() ? '重新開放投稿' : '暫停投稿';
  const roomId = filter.value;
  const items = dataService.getAllSubmissions().filter(item => roomId === 'all' || item.roomId === roomId).slice(0, 80);
  list.innerHTML = items.length ? items.map(item => {
    const room = getRoom(item.roomId);
    if (!room) return '';
    const time = new Date(item.createdAt).toLocaleTimeString('zh-TW', {hour:'2-digit', minute:'2-digit'});
    return `<article class="submission"><div class="meta">${getRoomLabel(room.id)} · ${time}</div><div class="words">${item.words.join('　')}</div>${item.comment ? `<div class="comment">${escapeHtml(item.comment)}</div>` : ''}</article>`;
  }).join('') : '<div class="small-note">目前沒有投稿。</div>';
}

function escapeHtml(text) { return text.replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function showError(error) { alert(error?.message || '操作失敗，請稍後再試。'); }

const initialLabels = labels();
roomNameInputs.forEach((input) => { input.value = initialLabels[input.dataset.roomName] || ''; });
updateShareLinks();
populateRoomSelectors();
buildProjectionControls();

filter.addEventListener('change', render);
lockBtn.addEventListener('click', async () => {
  try { await dataService.setLocked(!dataService.isLocked()); } catch (error) { showError(error); }
});

if (dataService.mode === 'firebase' && seedRoomBtn) seedRoomBtn.hidden = true;

seedRoomBtn?.addEventListener('click', async () => {
  const room = getRoom(actionRoom.value);
  try { await dataService.seedDemo(room.id, room.examples); } catch (error) { showError(error); }
});

document.querySelector('#clearRoomBtn').addEventListener('click', async () => {
  if (!confirm('確定清空這間包廂的投稿？')) return;
  try { await dataService.clearRoom(actionRoom.value); } catch (error) { showError(error); }
});

document.querySelector('#clearAllBtn').addEventListener('click', async () => {
  if (!confirm('確定清空全部投稿？')) return;
  try { await dataService.clearAll(); } catch (error) { showError(error); }
});

document.querySelector('#saveRoomNamesBtn')?.addEventListener('click', () => {
  const next = {};
  roomNameInputs.forEach((input) => { next[input.dataset.roomName] = input.value; });
  const saved = saveStoredRoomLabels(next);
  roomNameInputs.forEach((input) => { input.value = saved[input.dataset.roomName]; });
  populateRoomSelectors();
  buildProjectionControls();
  updateShareLinks();
  render();
  roomNameStatus.textContent = '已儲存。QR Code 與投影連結已同步更新。';
  setTimeout(() => { roomNameStatus.textContent = ''; }, 3200);
});

window.addEventListener('emotion-room-labels-changed', () => {
  populateRoomSelectors();
  buildProjectionControls();
  updateShareLinks();
  render();
});

dataService.subscribe(render);
render();
