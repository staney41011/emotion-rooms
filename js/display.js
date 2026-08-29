import { getRoom } from './rooms.js';
import { dataService } from './data-service.js';

const cloud = document.querySelector('#wordCloud');
const title = document.querySelector('#cloudTitle');
const count = document.querySelector('#submissionCount');

function aggregate(roomId) {
  const map = new Map();
  dataService.getSubmissions(roomId).forEach((item) => item.words.forEach((raw) => {
    const word = raw.trim();
    if (!word) return;
    map.set(word, (map.get(word) || 0) + 1);
  }));
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

function colorFor(index, total) {
  const hues = [44, 186, 258, 332, 14, 212, 95];
  const h = hues[index % hues.length];
  const light = total > 5 ? 69 : 74;
  return `hsl(${h} 80% ${light}%)`;
}

function renderWaiting() {
  title.innerHTML = '<h1>等待下一段體驗</h1><p>請依現場講師指示進行</p>';
  cloud.innerHTML = '<div class="cloud-empty" style="font-size:clamp(1.4rem,3vw,2.2rem)">完成體驗後，掃描現場 QR Code<br>寫下你真正出現的感受。</div>';
  count.textContent = '待機中';
}

function renderRoom(roomId) {
  const room = getRoom(roomId);
  if (!room) {
    renderWaiting();
    return;
  }

  title.innerHTML = `<h1>第 ${room.number} 間包廂</h1><p>大家剛才寫下的感受</p>`;

  const submissions = dataService.getSubmissions(roomId);
  count.textContent = `${submissions.length} 份投稿`;
  const words = aggregate(roomId);
  cloud.innerHTML = '';

  if (!words.length) {
    cloud.innerHTML = '<div class="cloud-empty">還沒有文字出現。<br>班員送出後，大家的感受會慢慢出現在這裡。</div>';
    return;
  }

  const max = words[0][1];
  words.slice(0, 60).forEach(([word, freq], index) => {
    const span = document.createElement('span');
    span.className = 'cloud-word';
    span.textContent = word;

    const ratio = freq / max;
    const rotation = index % 7 === 0 ? -3 : index % 11 === 0 ? 3 : 0;
    span.style.fontSize = `${26 + ratio * 64}px`;
    span.style.color = colorFor(index, words.length);
    span.style.setProperty('--word-rotation', `${rotation}deg`);
    span.style.animationDelay = `${Math.min(index * 32, 520)}ms`;
    span.title = `${freq} 次`;
    cloud.appendChild(span);
  });
}

function render() {
  const currentRoom = dataService.getCurrentRoom();
  if (currentRoom === 'waiting') {
    renderWaiting();
  } else {
    renderRoom(currentRoom);
  }
}

dataService.subscribe(render);
document.querySelector('#fullscreenBtn').addEventListener('click', () => document.documentElement.requestFullscreen?.());
render();
