import { ROOMS, getRoom } from './rooms.js';
import { dataService } from './data-service.js';

const tabs = document.querySelector('#roomTabs');
const cloud = document.querySelector('#wordCloud');
const title = document.querySelector('#cloudTitle');
const count = document.querySelector('#submissionCount');
let currentId = new URLSearchParams(location.search).get('room') || ROOMS[0].id;

ROOMS.forEach((room) => {
  const button = document.createElement('button'); button.className = 'room-tab'; button.textContent = `${room.emoji} ${room.name.replace('包廂','')}`;
  button.dataset.room = room.id; button.addEventListener('click', () => { currentId = room.id; history.replaceState(null, '', `?room=${room.id}`); render(); });
  tabs.appendChild(button);
});

function aggregate(roomId) {
  const map = new Map();
  dataService.getSubmissions(roomId).forEach((item) => item.words.forEach((raw) => {
    const word = raw.trim(); if (!word) return; map.set(word, (map.get(word) || 0) + 1);
  }));
  return [...map.entries()].sort((a,b) => b[1] - a[1]);
}

function colorFor(index, total) {
  const hues = [44, 186, 258, 332, 14, 212, 95];
  const h = hues[index % hues.length]; const light = total > 5 ? 69 : 74;
  return `hsl(${h} 80% ${light}%)`;
}

function render() {
  const room = getRoom(currentId);
  [...tabs.children].forEach((el) => el.classList.toggle('active', el.dataset.room === currentId));
  title.innerHTML = `<div class="emoji">${room.emoji}</div><h1>${room.name}</h1><p>${room.subtitle}</p>`;
  const submissions = dataService.getSubmissions(currentId); count.textContent = `${submissions.length} 份投稿`;
  const words = aggregate(currentId); cloud.innerHTML = '';
  if (!words.length) { cloud.innerHTML = '<div class="cloud-empty">還沒有文字出現。<br>班員送出後，情緒會慢慢長到這片雲上。</div>'; return; }
  const max = words[0][1];
  words.slice(0, 60).forEach(([word, freq], index) => {
    const span = document.createElement('span'); span.className = 'cloud-word'; span.textContent = word;
    const ratio = freq / max; span.style.fontSize = `${26 + ratio * 64}px`; span.style.color = colorFor(index, words.length);
    span.style.transform = `rotate(${index % 7 === 0 ? -3 : index % 11 === 0 ? 3 : 0}deg)`;
    span.title = `${freq} 次`; cloud.appendChild(span);
  });
}

dataService.subscribe(render);
document.querySelector('#seedBtn').addEventListener('click', () => { const room = getRoom(currentId); dataService.seedDemo(currentId, room.examples); });
document.querySelector('#fullscreenBtn').addEventListener('click', () => document.documentElement.requestFullscreen?.());
render();
