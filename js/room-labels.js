const STORAGE_KEY = 'emotionRoomCustomLabelsV1';
const ROOM_IDS = ['room1', 'room2', 'room3', 'room4', 'room5', 'room6'];

export function defaultRoomLabel(roomId) {
  const number = Number(String(roomId).replace('room', '')) || 0;
  return number ? `第 ${number} 間包廂` : '包廂';
}

function cleanLabel(value, roomId) {
  const text = String(value || '').trim().slice(0, 24);
  return text || defaultRoomLabel(roomId);
}

export function getStoredRoomLabels() {
  const fallback = Object.fromEntries(ROOM_IDS.map((id) => [id, defaultRoomLabel(id)]));
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    ROOM_IDS.forEach((id) => {
      if (parsed?.[id]) fallback[id] = cleanLabel(parsed[id], id);
    });
  } catch {}
  return fallback;
}

export function saveStoredRoomLabels(labels = {}) {
  const cleaned = Object.fromEntries(ROOM_IDS.map((id) => [id, cleanLabel(labels[id], id)]));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
  window.dispatchEvent(new CustomEvent('emotion-room-labels-changed', { detail: cleaned }));
  return cleaned;
}

function labelsFromSearch(search = location.search) {
  const params = new URLSearchParams(search);
  const packed = params.get('labels');
  if (!packed) return {};
  try {
    const parsed = JSON.parse(packed);
    return Object.fromEntries(ROOM_IDS.filter((id) => parsed?.[id]).map((id) => [id, cleanLabel(parsed[id], id)]));
  } catch {
    return {};
  }
}

export function getRoomLabels(search = location.search) {
  return { ...getStoredRoomLabels(), ...labelsFromSearch(search) };
}

export function getRoomLabel(roomId, search = location.search) {
  const params = new URLSearchParams(search);
  const direct = params.get('label');
  if (direct) return cleanLabel(direct, roomId);
  return getRoomLabels(search)[roomId] || defaultRoomLabel(roomId);
}

export function packedRoomLabels(labels = getStoredRoomLabels()) {
  const cleaned = Object.fromEntries(ROOM_IDS.map((id) => [id, cleanLabel(labels[id], id)]));
  return JSON.stringify(cleaned);
}

export const ROOM_LABEL_IDS = ROOM_IDS;
