import { ROOMS, getRoom } from './rooms.js?v=20260829-1';
import { dataService } from './data-service.js?v=20260829-1';

const inputStep = document.querySelector('#inputStep');
const invalidRoom = document.querySelector('#invalidRoom');
const roomHead = document.querySelector('#roomHead');
const form = document.querySelector('#emotionForm');
const successBox = document.querySelector('#successBox');
const inputs = [...document.querySelectorAll('.emotion-input')];
const moreEmotionsBtn = document.querySelector('#moreEmotionsBtn');
const emotionSuggestions = document.querySelector('#emotionSuggestions');
const emotionChips = document.querySelector('#emotionChips');
const emotionSuggestionStatus = document.querySelector('#emotionSuggestionStatus');
const roomExperienceTitle = document.querySelector('#roomExperienceTitle');

const roomId = new URLSearchParams(location.search).get('room');
const currentRoom = getRoom(roomId);
const chineseNumbers = ['', '一', '二', '三', '四', '五', '六', '七', '八'];

function currentWords() {
  return inputs.map((input) => input.value.trim()).filter(Boolean);
}

function updateSuggestionStatus(message = '') {
  if (!emotionSuggestionStatus) return;
  emotionSuggestionStatus.textContent = message;
}

function fillEmotion(word) {
  const existing = inputs.find((input) => input.value.trim() === word);
  if (existing) {
    existing.focus();
    updateSuggestionStatus(`「${word}」已經選過了。`);
    return;
  }

  const target = inputs.find((input) => !input.value.trim());
  if (!target) {
    updateSuggestionStatus('最多可以填 3 個感受，請先修改或刪除其中一個。');
    return;
  }

  target.value = word;
  target.focus();
  target.dispatchEvent(new Event('input', { bubbles: true }));
  updateSuggestionStatus(`已加入「${word}」。`);
}

function renderEmotionSuggestions() {
  if (!currentRoom || !emotionChips) return;
  emotionChips.innerHTML = '';

  currentRoom.examples.forEach((word) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.textContent = word;
    chip.addEventListener('click', () => fillEmotion(word));
    emotionChips.appendChild(chip);
  });
}

if (!currentRoom || !ROOMS.some((room) => room.id === roomId)) {
  invalidRoom.hidden = false;
} else {
  const ordinal = chineseNumbers[currentRoom.number] || String(currentRoom.number);
  const experienceTitle = `第${ordinal}個包廂情緒體驗`;
  if (roomExperienceTitle) roomExperienceTitle.textContent = experienceTitle;
  document.title = `${experienceTitle}｜情緒包廂`;

  document.documentElement.style.setProperty('--room-accent', currentRoom.accent);
  document.documentElement.style.setProperty('--room-soft', currentRoom.soft);
  roomHead.innerHTML = `<div><h1 style="margin-bottom:10px">寫下你剛剛的感受</h1><p>先不要替這段體驗找答案，也不用猜別人會怎麼寫。</p></div>`;
  renderEmotionSuggestions();
  inputStep.hidden = false;
}

moreEmotionsBtn?.addEventListener('click', () => {
  const willOpen = emotionSuggestions.hidden;
  emotionSuggestions.hidden = !willOpen;
  moreEmotionsBtn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
  moreEmotionsBtn.textContent = willOpen ? '收起情緒' : '更多情緒';
  updateSuggestionStatus('');
});

inputs.forEach((input) => {
  input.addEventListener('input', () => updateSuggestionStatus(''));
});

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!currentRoom) return;

  const words = currentWords();
  if (!words.length) {
    inputs[0].focus();
    return;
  }

  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = '送出中…';

  try {
    await dataService.submit(currentRoom.id, {
      words,
      comment: document.querySelector('#comment').value
    });
    form.style.display = 'none';
    successBox.classList.add('show');
  } catch (error) {
    alert(error?.message || '送出失敗，請稍後再試。');
    button.disabled = false;
    button.textContent = '送出我的感受';
  }
});
