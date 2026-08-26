import { ROOMS, getRoom } from './rooms.js';
import { dataService } from './data-service.js';

const roomGrid = document.querySelector('#roomGrid');
const roomStep = document.querySelector('#roomStep');
const inputStep = document.querySelector('#inputStep');
const roomHead = document.querySelector('#roomHead');
const exampleChips = document.querySelector('#exampleChips');
const form = document.querySelector('#emotionForm');
const successBox = document.querySelector('#successBox');
const inputs = [...document.querySelectorAll('.emotion-input')];
let currentRoom = null;

ROOMS.forEach((room) => {
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'room-card';
  button.style.setProperty('--room-accent', room.accent);
  button.innerHTML = `<span class="num">0${room.number}</span><div class="emoji">${room.emoji}</div><div class="name">${room.name}</div><div class="subtitle">${room.subtitle}</div>`;
  button.addEventListener('click', () => openRoom(room.id));
  roomGrid.appendChild(button);
});

function openRoom(id) {
  currentRoom = getRoom(id);
  document.documentElement.style.setProperty('--room-accent', currentRoom.accent);
  document.documentElement.style.setProperty('--room-soft', currentRoom.soft);
  roomHead.innerHTML = `<div class="emoji">${currentRoom.emoji}</div><div><div class="small-note">第 ${currentRoom.number} 間</div><h2>${currentRoom.name}：${currentRoom.subtitle}</h2><p>${currentRoom.prompt}</p></div>`;
  exampleChips.innerHTML = '';
  currentRoom.examples.forEach((word) => {
    const chip = document.createElement('button'); chip.type = 'button'; chip.className = 'chip'; chip.textContent = word;
    chip.addEventListener('click', () => {
      const target = inputs.find((input) => !input.value.trim());
      if (target) target.value = word;
    });
    exampleChips.appendChild(chip);
  });
  roomStep.hidden = true; inputStep.hidden = false; form.style.display = ''; successBox.classList.remove('show');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelector('#backToRooms').addEventListener('click', () => { inputStep.hidden = true; roomStep.hidden = false; });
document.querySelector('#submitAgain').addEventListener('click', () => { form.reset(); inputStep.hidden = true; roomStep.hidden = false; });

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const words = inputs.map((input) => input.value.trim()).filter(Boolean);
  if (!words.length) { inputs[0].focus(); return; }
  try {
    await dataService.submit(currentRoom.id, { words, comment: document.querySelector('#comment').value });
    form.style.display = 'none'; successBox.classList.add('show');
  } catch (error) { alert(error.message); }
});
