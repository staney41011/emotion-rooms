const STORE_KEY = 'emotionRoomsDemoV1';
const CHANNEL_NAME = 'emotionRoomsDemoChannel';
const channel = 'BroadcastChannel' in window ? new BroadcastChannel(CHANNEL_NAME) : null;

function emptyState() {
  return { submissions: {}, locked: false, updatedAt: Date.now() };
}

function readState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? { ...emptyState(), ...JSON.parse(raw) } : emptyState();
  } catch {
    return emptyState();
  }
}

function writeState(state) {
  state.updatedAt = Date.now();
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
  channel?.postMessage({ type: 'changed', at: state.updatedAt });
}

function emitLocal() {
  window.dispatchEvent(new CustomEvent('emotion-data-changed'));
}

function notify(state) {
  writeState(state);
  emitLocal();
}

export const dataService = {
  mode: 'demo',

  async submit(roomId, payload) {
    const state = readState();
    if (state.locked) throw new Error('目前已暫停投稿');
    const list = state.submissions[roomId] || [];
    list.push({
      id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
      roomId,
      words: payload.words.map((w) => w.trim()).filter(Boolean).slice(0, 3),
      comment: (payload.comment || '').trim().slice(0, 180),
      createdAt: Date.now()
    });
    state.submissions[roomId] = list;
    notify(state);
  },

  getSubmissions(roomId) {
    const state = readState();
    return [...(state.submissions[roomId] || [])].sort((a, b) => b.createdAt - a.createdAt);
  },

  getAllSubmissions() {
    const state = readState();
    return Object.values(state.submissions).flat().sort((a, b) => b.createdAt - a.createdAt);
  },

  getStats() {
    const state = readState();
    const stats = {};
    Object.entries(state.submissions).forEach(([roomId, list]) => { stats[roomId] = list.length; });
    return stats;
  },

  isLocked() {
    return !!readState().locked;
  },

  setLocked(locked) {
    const state = readState();
    state.locked = !!locked;
    notify(state);
  },

  clearRoom(roomId) {
    const state = readState();
    delete state.submissions[roomId];
    notify(state);
  },

  clearAll() {
    const state = emptyState();
    writeState(state);
    emitLocal();
  },

  seedDemo(roomId, words) {
    const state = readState();
    const list = state.submissions[roomId] || [];
    const sample = words.length ? words : ['緊張', '期待', '不安', '開心'];
    const generated = [];
    sample.forEach((word, index) => {
      const repeats = Math.max(1, 7 - Math.floor(index / 2));
      for (let i = 0; i < repeats; i += 1) {
        generated.push({
          id: `demo-${roomId}-${Date.now()}-${index}-${i}`,
          roomId,
          words: [word],
          comment: i === 0 ? `示範留言：${word}` : '',
          createdAt: Date.now() - (index * 10000 + i * 1000)
        });
      }
    });
    state.submissions[roomId] = [...list, ...generated];
    notify(state);
  },

  subscribe(callback) {
    const handler = () => callback(readState());
    window.addEventListener('storage', handler);
    window.addEventListener('emotion-data-changed', handler);
    if (channel) channel.addEventListener('message', handler);
    callback(readState());
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener('emotion-data-changed', handler);
      if (channel) channel.removeEventListener('message', handler);
    };
  }
};
