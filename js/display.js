import { getRoom } from './rooms.js?v=20260903-1';
import { getRoomLabel } from './room-labels.js?v=20260903-1';
import { dataService } from './data-service.js?v=20260903-1';

const cloud = document.querySelector('#wordCloud');
const title = document.querySelector('#cloudTitle');
const count = document.querySelector('#submissionCount');
let resizeTimer = null;

function aggregate(roomId) {
  const map = new Map();

  dataService.getSubmissions(roomId).forEach((item) => {
    // 同一份投稿重複寫相同詞，只算一人，讓權重代表「有多少人填過」。
    const uniqueWords = new Set();
    (item.words || []).forEach((raw) => {
      const word = String(raw || '').trim().replace(/\s+/g, ' ');
      if (word) uniqueWords.add(word);
    });
    uniqueWords.forEach((word) => map.set(word, (map.get(word) || 0) + 1));
  });

  return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-Hant'));
}

function colorFor(index, total) {
  const hues = [44, 186, 258, 332, 14, 212, 95];
  const h = hues[index % hues.length];
  const light = total > 5 ? 69 : 74;
  return `hsl(${h} 80% ${light}%)`;
}

function setCloudMode(mode) {
  if (mode === 'words') {
    cloud.style.display = 'block';
    cloud.style.position = 'relative';
    cloud.style.height = 'clamp(430px, 58vh, 650px)';
    cloud.style.minHeight = '430px';
    cloud.style.padding = '18px 24px';
    cloud.style.overflow = 'hidden';
  } else {
    cloud.style.display = 'flex';
    cloud.style.position = 'relative';
    cloud.style.height = 'auto';
    cloud.style.minHeight = '340px';
    cloud.style.padding = '26px';
    cloud.style.alignItems = 'center';
    cloud.style.justifyContent = 'center';
    cloud.style.alignContent = 'center';
  }
}

function renderWaiting() {
  title.innerHTML = '<h1>等待下一段體驗</h1><p>請依現場講師指示進行</p>';
  setCloudMode('empty');
  cloud.innerHTML = '<div class="cloud-empty" style="font-size:clamp(1.4rem,3vw,2.2rem)">完成體驗後，掃描現場 QR Code<br>寫下你真正出現的感受。</div>';
  count.textContent = '待機中';
}

function overlaps(a, b, gap = 9) {
  return !(
    a.right + gap <= b.left ||
    a.left >= b.right + gap ||
    a.bottom + gap <= b.top ||
    a.top >= b.bottom + gap
  );
}

function placeWord(node, index, total, freq, maxFreq, minFreq, placed, width, height) {
  const padX = 16;
  const padY = 14;
  const centerX = width / 2;
  const centerY = height / 2;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  const rankRatio = total <= 1 ? 0 : index / (total - 1);
  let frequencyDistance;
  if (maxFreq === minFreq) {
    frequencyDistance = rankRatio;
  } else {
    frequencyDistance = (maxFreq - freq) / (maxFreq - minFreq);
  }

  // 主要由填寫人數決定離中心距離；排名只用來把同頻率的詞稍微錯開。
  let preferred = Math.min(1, Math.pow(frequencyDistance, 0.68) * 0.88 + Math.pow(rankRatio, 0.82) * 0.12);
  if (index === 0) preferred = 0;

  const originalSize = parseFloat(node.style.fontSize) || 32;

  for (let shrink = 0; shrink < 4; shrink += 1) {
    if (shrink > 0) node.style.fontSize = `${Math.max(25, originalSize * (1 - shrink * 0.09))}px`;

    const wordWidth = node.offsetWidth;
    const wordHeight = node.offsetHeight;
    const maxX = Math.max(0, width / 2 - padX - wordWidth / 2);
    const maxY = Math.max(0, height / 2 - padY - wordHeight / 2);

    if (index === 0) {
      const rect = {
        left: centerX - wordWidth / 2,
        top: centerY - wordHeight / 2,
        right: centerX + wordWidth / 2,
        bottom: centerY + wordHeight / 2,
      };
      if (!placed.some((other) => overlaps(rect, other))) return rect;
    }

    for (let attempt = 0; attempt < 240; attempt += 1) {
      const layer = Math.floor(attempt / 30);
      const layerMagnitude = Math.ceil(layer / 2) * 0.055;
      const radialShift = layer === 0 ? 0 : (layer % 2 === 1 ? layerMagnitude : -layerMagnitude);
      const radial = Math.max(0.035, Math.min(1, preferred + radialShift));
      const angle = index * goldenAngle + (attempt % 30) * (Math.PI * 2 / 30);
      const x = centerX + Math.cos(angle) * maxX * radial;
      const y = centerY + Math.sin(angle) * maxY * radial;
      const rect = {
        left: x - wordWidth / 2,
        top: y - wordHeight / 2,
        right: x + wordWidth / 2,
        bottom: y + wordHeight / 2,
      };

      if (rect.left < padX || rect.top < padY || rect.right > width - padX || rect.bottom > height - padY) continue;
      if (placed.some((other) => overlaps(rect, other, shrink >= 2 ? 5 : 9))) continue;
      return rect;
    }
  }

  return null;
}

function layoutWordCloud(entries, nodes) {
  if (!entries.length || !nodes.length) return;

  const width = cloud.clientWidth;
  const height = cloud.clientHeight;
  if (!width || !height) return;

  const maxFreq = entries[0][1];
  const minFreq = entries[entries.length - 1][1];
  const placed = [];

  nodes.forEach((node, index) => {
    const [word, freq] = entries[index];
    const rect = placeWord(node, index, nodes.length, freq, maxFreq, minFreq, placed, width, height);

    if (!rect) {
      node.style.display = 'none';
      return;
    }

    placed.push(rect);
    node.style.left = `${rect.left}px`;
    node.style.top = `${rect.top}px`;
    node.style.zIndex = `${1000 - index}`;
    node.title = `${freq} 人填寫「${word}」`;
  });
}

function renderRoom(roomId) {
  const room = getRoom(roomId);
  if (!room) {
    renderWaiting();
    return;
  }

  title.innerHTML = `<h1>${getRoomLabel(room.id)}</h1><p>大家剛才寫下的感受</p>`;

  const submissions = dataService.getSubmissions(roomId);
  count.textContent = `${submissions.length} 份投稿`;
  const words = aggregate(roomId).slice(0, 60);
  cloud.innerHTML = '';

  if (!words.length) {
    setCloudMode('empty');
    cloud.innerHTML = '<div class="cloud-empty">還沒有文字出現。<br>班員送出後，大家的感受會慢慢出現在這裡。</div>';
    return;
  }

  setCloudMode('words');

  const maxFreq = words[0][1];
  const nodes = [];

  words.forEach(([word, freq], index) => {
    const span = document.createElement('span');
    span.className = 'cloud-word';
    span.textContent = word;

    let fontSize;
    if (maxFreq <= 1) {
      fontSize = 38;
    } else {
      const normalized = Math.max(0, Math.min(1, (freq - 1) / (maxFreq - 1)));
      fontSize = 30 + Math.pow(normalized, 0.72) * 78;
    }

    span.style.position = 'absolute';
    span.style.whiteSpace = 'nowrap';
    span.style.fontSize = `${fontSize}px`;
    span.style.color = colorFor(index, words.length);
    span.style.animationDelay = `${Math.min(index * 28, 500)}ms`;
    span.style.visibility = 'hidden';
    cloud.appendChild(span);
    nodes.push(span);
  });

  const runLayout = () => {
    nodes.forEach((node) => { node.style.visibility = 'visible'; });
    layoutWordCloud(words, nodes);
  };

  requestAnimationFrame(() => requestAnimationFrame(runLayout));
  document.fonts?.ready?.then(() => requestAnimationFrame(() => layoutWordCloud(words, nodes)));
}

function render() {
  const currentRoom = dataService.getCurrentRoom();
  if (currentRoom === 'waiting') renderWaiting();
  else renderRoom(currentRoom);
}

dataService.subscribe(render);
window.addEventListener('emotion-room-labels-changed', render);
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(render, 140);
});
document.querySelector('#fullscreenBtn').addEventListener('click', () => document.documentElement.requestFullscreen?.());
render();
