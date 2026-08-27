import { ROOMS, getRoom } from './rooms.js';
import { dataService } from './data-service.js';

const inputStep = document.querySelector('#inputStep');
const invalidRoom = document.querySelector('#invalidRoom');
const roomHead = document.querySelector('#roomHead');
const form = document.querySelector('#emotionForm');
const successBox = document.querySelector('#successBox');
const inputs = [...document.querySelectorAll('.emotion-input')];

const roomId = new URLSearchParams(location.search).get('room');
const currentRoom = getRoom(roomId);

if (!currentRoom || !ROOMS.some((room) => room.id === roomId)) {
  invalidRoom.hidden = false;
} else {
  document.documentElement.style.setProperty('--room-accent', currentRoom.accent);
  document.documentElement.style.setProperty('--room-soft', currentRoom.soft);
  roomHead.innerHTML = `<div><h1 style="margin-bottom:10px">寫下你剛剛的感受</h1><p>先不要替這段體驗找答案，也不用猜別人會怎麼寫。</p></div>`;
  inputStep.hidden = false;
}

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!currentRoom) return;

  const words = inputs.map((input) => input.value.trim()).filter(Boolean);
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
