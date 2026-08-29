import { ROOMS, getRoom } from './rooms.js?v=20260829-2';
import { dataService } from './data-service.js?v=20260829-1';

const statGrid = document.querySelector('#statGrid');
const list = document.querySelector('#submissionList');
const filter = document.querySelector('#roomFilter');
const actionRoom = document.querySelector('#actionRoom');
const lockBtn = document.querySelector('#lockBtn');
const seedRoomBtn = document.querySelector('#seedRoomBtn');
const projectionControls = document.querySelector('#projectionControls');
const projectionStatus = document.querySelector('#projectionStatus');

filter.innerHTML = '<option value="all">全部包廂</option>' + ROOMS.map(r => `<option value="${r.id}">${r.number}. ${r.name}</option>`).join('');
actionRoom.innerHTML = ROOMS.map(r => `<option value="${r.id}">${r.number}. ${r.name}</option>`).join('');

const projectionOptions = [
  { id: 'waiting', label: '待機畫面' },
  ...ROOMS.map(room => ({ id: room.id, label: `第 ${room.number} 間` }))
];

projectionOptions.forEach((option) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = option.id === 'waiting' ? 'btn soft' : 'btn primary';
  button.dataset.projection = option.id;
  button.textContent = option.label;
  button.addEventListener('click', async () => {
    try {
      await dataService.setCurrentRoom(option.id);
    } catch (error) {
      showError(error);
    }
  });
  projectionControls.appendChild(button);
});

function renderProjectionControl() {
  const rawCurrent = dataService.getCurrentRoom();
  const currentRoom = getRoom(rawCurrent);
  const current = rawCurrent === 'waiting' || currentRoom ? rawCurrent : 'waiting';

  projectionStatus.textContent = current === 'waiting'
    ? '目前投影：待機畫面'
    : `目前投影：第 ${currentRoom.number} 間（講師對照：${currentRoom.name}）`;

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
  statGrid.innerHTML = ROOMS.map(room => `<div class="stat-card"><div>${room.emoji} ${room.name}</div><div class="count">${stats[room.id] || 0}</div><div class="small-note">份投稿</div></div>`).join('');
  lockBtn.textContent = dataService.isLocked() ? '重新開放投稿' : '暫停投稿';
  const roomId = filter.value;
  const items = dataService.getAllSubmissions().filter(item => roomId === 'all' || item.roomId === roomId).slice(0, 80);
  list.innerHTML = items.length ? items.map(item => {
    const room = getRoom(item.roomId);
    if (!room) return '';
    const time = new Date(item.createdAt).toLocaleTimeString('zh-TW', {hour:'2-digit', minute:'2-digit'});
    return `<article class="submission"><div class="meta">${room.emoji} ${room.name} · ${time}</div><div class="words">${item.words.join('　')}</div>${item.comment ? `<div class="comment">${escapeHtml(item.comment)}</div>` : ''}</article>`;
  }).join('') : '<div class="small-note">目前沒有投稿。</div>';
}

function escapeHtml(text) { return text.replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function showError(error) { alert(error?.message || '操作失敗，請稍後再試。'); }

filter.addEventListener('change', render);
lockBtn.addEventListener('click', async () => {
  try {
    await dataService.setLocked(!dataService.isLocked());
  } catch (error) {
    showError(error);
  }
});

if (dataService.mode === 'firebase' && seedRoomBtn) seedRoomBtn.hidden = true;

seedRoomBtn?.addEventListener('click', async () => {
  const room = getRoom(actionRoom.value);
  try {
    await dataService.seedDemo(room.id, room.examples);
  } catch (error) {
    showError(error);
  }
});

document.querySelector('#clearRoomBtn').addEventListener('click', async () => {
  if (!confirm('確定清空這間包廂的投稿？')) return;
  try {
    await dataService.clearRoom(actionRoom.value);
  } catch (error) {
    showError(error);
  }
});

document.querySelector('#clearAllBtn').addEventListener('click', async () => {
  if (!confirm('確定清空全部投稿？')) return;
  try {
    await dataService.clearAll();
  } catch (error) {
    showError(error);
  }
});

dataService.subscribe(render);
render();
