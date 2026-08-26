import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js';
import {
  getDatabase,
  ref,
  push,
  onValue,
  get,
  set,
  remove,
  update
} from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js';

const STORE_KEY = 'emotionRoomsDemoV1';
const CHANNEL_NAME = 'emotionRoomsDemoChannel';
const ROOT_PATH = 'emotionRooms/v1';
const channel = 'BroadcastChannel' in window ? new BroadcastChannel(CHANNEL_NAME) : null;
const subscribers = new Set();

function emptyState() {
  return { submissions: {}, locked: false, updatedAt: Date.now() };
}

function isFirebaseConfigured() {
  return Boolean(
    firebaseConfig &&
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.databaseURL &&
    firebaseConfig.appId
  );
}

const firebaseEnabled = isFirebaseConfigured();
let database = null;
let auth = null;
let authPromise = null;
let firebaseStarted = false;
let firebaseCache = emptyState();

if (firebaseEnabled) {
  const app = initializeApp(firebaseConfig);
  database = getDatabase(app);
  auth = getAuth(app);
}

function readDemoState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? { ...emptyState(), ...JSON.parse(raw) } : emptyState();
  } catch {
    return emptyState();
  }
}

function writeDemoState(state) {
  state.updatedAt = Date.now();
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
  channel?.postMessage({ type: 'changed', at: state.updatedAt });
}

function currentState() {
  return firebaseEnabled ? firebaseCache : readDemoState();
}

function notifySubscribers() {
  subscribers.forEach((callback) => callback(currentState()));
  if (!firebaseEnabled) {
    window.dispatchEvent(new CustomEvent('emotion-data-changed'));
  }
}

function normalizePublicWords(raw) {
  const submissions = {};
  Object.entries(raw || {}).forEach(([roomId, records]) => {
    submissions[roomId] = Object.entries(records || {}).map(([id, item]) => ({
      id,
      roomId,
      words: Array.isArray(item?.words) ? item.words : Object.values(item?.words || {}),
      comment: '',
      createdAt: Number(item?.createdAt || 0)
    }));
  });
  return submissions;
}

function startFirebaseSubscription() {
  if (!firebaseEnabled || firebaseStarted) return;
  firebaseStarted = true;

  onValue(
    ref(database, `${ROOT_PATH}/publicWords`),
    (snapshot) => {
      firebaseCache.submissions = normalizePublicWords(snapshot.val());
      firebaseCache.updatedAt = Date.now();
      notifySubscribers();
    },
    (error) => console.error('Firebase public word subscription failed:', error)
  );

  onValue(
    ref(database, `${ROOT_PATH}/locked`),
    (snapshot) => {
      firebaseCache.locked = snapshot.val() === true;
      firebaseCache.updatedAt = Date.now();
      notifySubscribers();
    },
    (error) => console.error('Firebase lock subscription failed:', error)
  );
}

function makeSubmission(roomId, payload, id = null) {
  return {
    ...(id ? { id } : {}),
    roomId,
    words: payload.words.map((w) => w.trim()).filter(Boolean).slice(0, 3),
    comment: (payload.comment || '').trim().slice(0, 180),
    createdAt: Date.now()
  };
}

function getRoomList(state, roomId) {
  return [...(state.submissions[roomId] || [])].sort((a, b) => b.createdAt - a.createdAt);
}

function authErrorMessage(error) {
  if (error?.code === 'auth/operation-not-allowed') {
    return new Error('Firebase 已連線，但 Anonymous Authentication 尚未啟用。請到 Firebase Authentication → Sign-in method 開啟 Anonymous。');
  }
  if (error?.code === 'auth/network-request-failed') {
    return new Error('目前無法連線 Firebase，請檢查網路後再試。');
  }
  return error;
}

function ensureStudentAuth() {
  if (!firebaseEnabled) return Promise.resolve(null);
  if (auth?.currentUser) return Promise.resolve(auth.currentUser);
  if (authPromise) return authPromise;

  authPromise = new Promise((resolve, reject) => {
    let settled = false;
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        if (!user || settled) return;
        settled = true;
        unsubscribe();
        resolve(user);
      },
      (error) => {
        if (settled) return;
        settled = true;
        unsubscribe();
        reject(authErrorMessage(error));
      }
    );

    signInAnonymously(auth).catch((error) => {
      if (settled) return;
      settled = true;
      unsubscribe();
      reject(authErrorMessage(error));
    });
  }).catch((error) => {
    authPromise = null;
    throw error;
  });

  return authPromise;
}

function firebaseAdminMessage(error) {
  if (error?.code === 'PERMISSION_DENIED' || error?.code === 'permission-denied') {
    return new Error('Firebase 已連線，但講師管理權限尚未設定。下一步接管理員登入後即可使用此功能。');
  }
  return error;
}

export const dataService = {
  mode: firebaseEnabled ? 'firebase' : 'demo',

  async submit(roomId, payload) {
    if (firebaseEnabled) {
      await ensureStudentAuth();

      const lockSnapshot = await get(ref(database, `${ROOT_PATH}/locked`));
      if (lockSnapshot.val() === true) throw new Error('目前已暫停投稿');

      const submission = makeSubmission(roomId, payload);
      const newRef = push(ref(database, `${ROOT_PATH}/publicWords/${roomId}`));
      const id = newRef.key;
      if (!id) throw new Error('無法建立投稿編號，請再試一次。');

      await update(ref(database, ROOT_PATH), {
        [`publicWords/${roomId}/${id}`]: {
          roomId,
          words: submission.words,
          createdAt: submission.createdAt
        },
        [`privateComments/${roomId}/${id}`]: {
          roomId,
          comment: submission.comment,
          createdAt: submission.createdAt
        }
      });
      return;
    }

    const state = readDemoState();
    if (state.locked) throw new Error('目前已暫停投稿');
    const list = state.submissions[roomId] || [];
    list.push(makeSubmission(roomId, payload, crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`));
    state.submissions[roomId] = list;
    writeDemoState(state);
    notifySubscribers();
  },

  getSubmissions(roomId) {
    return getRoomList(currentState(), roomId);
  },

  getAllSubmissions() {
    return Object.values(currentState().submissions).flat().sort((a, b) => b.createdAt - a.createdAt);
  },

  getStats() {
    const stats = {};
    Object.entries(currentState().submissions).forEach(([roomId, list]) => {
      stats[roomId] = list.length;
    });
    return stats;
  },

  isLocked() {
    return !!currentState().locked;
  },

  async setLocked(locked) {
    if (firebaseEnabled) {
      try {
        await set(ref(database, `${ROOT_PATH}/locked`), !!locked);
      } catch (error) {
        throw firebaseAdminMessage(error);
      }
      return;
    }
    const state = readDemoState();
    state.locked = !!locked;
    writeDemoState(state);
    notifySubscribers();
  },

  async clearRoom(roomId) {
    if (firebaseEnabled) {
      try {
        await update(ref(database, ROOT_PATH), {
          [`publicWords/${roomId}`]: null,
          [`privateComments/${roomId}`]: null
        });
      } catch (error) {
        throw firebaseAdminMessage(error);
      }
      return;
    }
    const state = readDemoState();
    delete state.submissions[roomId];
    writeDemoState(state);
    notifySubscribers();
  },

  async clearAll() {
    if (firebaseEnabled) {
      try {
        await remove(ref(database, `${ROOT_PATH}/publicWords`));
        await remove(ref(database, `${ROOT_PATH}/privateComments`));
      } catch (error) {
        throw firebaseAdminMessage(error);
      }
      return;
    }
    const state = emptyState();
    writeDemoState(state);
    notifySubscribers();
  },

  async seedDemo(roomId, words) {
    if (firebaseEnabled) {
      throw new Error('正式 Firebase 模式不提供 Demo 資料寫入。');
    }

    const sample = words.length ? words : ['緊張', '期待', '不安', '開心'];
    const generated = [];
    sample.forEach((word, index) => {
      const repeats = Math.max(1, 7 - Math.floor(index / 2));
      for (let i = 0; i < repeats; i += 1) {
        generated.push({
          roomId,
          words: [word],
          comment: i === 0 ? `示範留言：${word}` : '',
          createdAt: Date.now() - (index * 10000 + i * 1000)
        });
      }
    });

    const state = readDemoState();
    const list = state.submissions[roomId] || [];
    state.submissions[roomId] = [
      ...list,
      ...generated.map((item, index) => ({ ...item, id: `demo-${roomId}-${Date.now()}-${index}` }))
    ];
    writeDemoState(state);
    notifySubscribers();
  },

  subscribe(callback) {
    subscribers.add(callback);

    if (firebaseEnabled) {
      startFirebaseSubscription();
      callback(firebaseCache);
      return () => subscribers.delete(callback);
    }

    const handler = () => callback(readDemoState());
    window.addEventListener('storage', handler);
    window.addEventListener('emotion-data-changed', handler);
    if (channel) channel.addEventListener('message', handler);
    callback(readDemoState());

    return () => {
      subscribers.delete(callback);
      window.removeEventListener('storage', handler);
      window.removeEventListener('emotion-data-changed', handler);
      if (channel) channel.removeEventListener('message', handler);
    };
  }
};
