export const ROOMS = [
  {
    id: 'bored', number: 1, emoji: '😑', name: '無聊包廂', subtitle: '我以為我沒感覺',
    prompt: '剛才你是空白、煩、想滑手機、想逃走，還是真的放鬆？',
    examples: ['無聊', '煩躁', '空', '放空', '想逃', '平靜', '焦急', '麻木'],
    accent: '#7c83fd', soft: '#eef0ff'
  },
  {
    id: 'moved', number: 2, emoji: '🥹', name: '感動包廂', subtitle: '原來我在乎',
    prompt: '哪一幕讓你心裡有一點動？那個動，可能代表你在乎什麼？',
    examples: ['感動', '心酸', '溫暖', '想哭', '懷念', '柔軟', '被理解', '感謝'],
    accent: '#ef7d9d', soft: '#fff0f4'
  },
  {
    id: 'excited', number: 3, emoji: '🤩', name: '興奮包廂', subtitle: '身體比腦袋先知道',
    prompt: '剛才你的身體有什麼反應？想贏、想笑、想衝、怕拖累別人？',
    examples: ['興奮', '開心', '投入', '競爭感', '期待', '急', '怕輸', '害羞'],
    accent: '#f59e0b', soft: '#fff8e6'
  },
  {
    id: 'nervous', number: 4, emoji: '😰', name: '緊張包廂', subtitle: '把壓力畫出來',
    prompt: '你的緊張長什麼樣子？是線、球、牆、刺、風，還是一團亂？',
    examples: ['緊張', '焦慮', '壓迫', '害怕', '急促', '煩', '想控制', '不安'],
    accent: '#0ea5a4', soft: '#eafafa'
  },
  {
    id: 'angry', number: 5, emoji: '😡', name: '生氣包廂', subtitle: '原來我有界線',
    prompt: '你生氣的到底是那件事，還是那件事碰到了你很在乎的東西？',
    examples: ['生氣', '不爽', '煩', '被冒犯', '不公平', '受傷', '失望', '無奈'],
    accent: '#ef4444', soft: '#fff0f0'
  },
  {
    id: 'frustrated', number: 6, emoji: '😤', name: '挫折包廂', subtitle: '為什麼就是做不到',
    prompt: '一直做不到的時候，你第一個出現的反應是什麼？',
    examples: ['挫折', '煩躁', '不甘心', '生氣', '想放棄', '丟臉', '懷疑自己', '越戰越勇'],
    accent: '#8b5cf6', soft: '#f5f0ff'
  },
  {
    id: 'lonely', number: 7, emoji: '🌙', name: '孤單包廂', subtitle: '人很多，也可能一個人',
    prompt: '孤單一定是身邊沒有人嗎？剛剛哪一個畫面讓你最有感覺？',
    examples: ['孤單', '安靜', '失落', '羨慕', '被忽略', '自在', '想有人陪', '平靜'],
    accent: '#64748b', soft: '#f1f5f9'
  },
  {
    id: 'hopeful', number: 8, emoji: '✨', name: '期待包廂', subtitle: '原來我還有想要的事',
    prompt: '想到那件事情的時候，你心裡出現的是什麼？',
    examples: ['期待', '開心', '興奮', '希望', '緊張', '怕失望', '憧憬', '迫不及待'],
    accent: '#22a06b', soft: '#ecfdf5'
  }
];

export function getRoom(id) {
  return ROOMS.find((room) => room.id === id) || ROOMS[0];
}
