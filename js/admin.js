import { ROOMS, getRoom } from './rooms.js';
import { dataService } from './data-service.js';

const statGrid = document.querySelector('#statGrid');
const list = document.querySelector('#submissionList');
const filter = document.querySelector('#roomFilter');
const actionRoom = document.querySelector('#actionRoom');
const lockBtn = document.querySelector('#lockBtn');
const seedRoomBtn = document.querySelector('#seedRoomBtn');

filter.innerHTML = '<option value="all">全部包廂</option>' + ROOMS.map(r => `<option value="${r.id}">${r.number}. ${r.name}</option>`).join('');
actionRoom.innerHTML = ROOMS.map(r => `<option value="${r.id}">${r.number}. ${r.name}</option>`).join('');

function render() {
  const stats = dataService.getStats();
  statGrid.innerHTML = ROOMS.map(room => `<div class="stat-card"><div>${room.emoji} ${room.name}</div><div class="count">${stats[room.id] || 0}</div><div class="small-note">份投稿</div></div>`).join('');
  lockBtn.textContent = dataService.isLocked() ? '重新開放投稿' : '暫停投稿';
  const roomId = filter.value;
  const items = dataService.getAllSubmissions().filter(item => roomId === 'all' || item.roomId === roomId).slice(0, 80);
  list.innerHTML = items.length ? items.map(item => {
    const room = getRoom(item.roomId); const time = new Date(item.createdAt).toLocaleTimeString('zh-TW', {hour:'2-digit', minute:'2-digit'});
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

if (dataService.mode === 'firebase' && seedRoomBtn) {
  seedRoomBtn.hidden = true;
}

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
