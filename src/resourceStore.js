import { upgradeDemoQuestions, withoutQuestionScores } from './questionModel';
export const RESOURCE_STORE = 'ac-teaching-resources-v1';
const names = { audio: '音頻', video: '視頻', questions: '試題' };
export function withDemoMedia(items) {
  return upgradeDemoQuestions(items).map(item => {
    if (item.type === 'questions' && item.kind === 'resource') return withoutQuestionScores(item);
    if (item.kind !== 'resource' || !['audio', 'video'].includes(item.type) || !new RegExp(`^${item.type}-(\\d+|nested)$`).test(item.id) || item.url) return item;
    const index = Number(item.id.split('-')[1]) || 0;
    return { ...item, cover: `/resources/${item.type}-${index % 4}.svg`, url: item.type === 'audio' ? '/resources/greetings.wav' : '/resources/phonics.mp4', duration: item.type === 'audio' ? '00:14' : '00:12', demo: true };
  });
}
function initialItems() {
  return Object.keys(names).flatMap(type => {
    const folder = `${type}-folder`;
    const titles = type === 'audio' ? ['日常問候與自我介紹', '字母發音練習', '聽力練習：我的家庭', '數字與顏色', '課堂常用語', '動物的聲音', '週末活動', '食物與飲料', '旅行中的對話', '天氣與季節', '故事時間', '校園生活', '音樂與節奏'] : type === 'video' ? ['自然拼讀入門', '認識形狀與顏色', '生活中的數學', '英語情境對話', '動物世界', '閱讀方法', '科學小實驗', '課堂互動示範', '寫作入門', '認識四季', '故事與表達', '時間與日期', '複習課堂'] : ['閱讀理解練習', '詞彙與語法', '數學應用題'];
    return [{ id: folder, type, kind: 'folder', parent: null, title: '入門教材', date: '2026-10-12' }, ...titles.map((title, i) => ({ id: `${type}-${i}`, type, kind: 'resource', parent: null, title, ar: `${(1 + i * .2).toFixed(1)}`, duration: `0${3 + i % 6}:${i % 2 ? '30' : '15'}`, stem: type === 'questions' ? '閱讀題目並回答問題。' : '', date: '2026-10-12' })), { id: `${type}-nested`, type, kind: 'resource', parent: folder, title: `${names[type]}入門練習`, ar: '1.0', duration: '03:20', stem: '請完成以下練習。', date: '2026-10-12' }];
  });
}
export function loadResources() {
  try { const saved=JSON.parse(localStorage.getItem(RESOURCE_STORE)); return withDemoMedia(Array.isArray(saved)?saved:initialItems()); }
  catch { return withDemoMedia(initialItems()); }
}
export function persistResources(items) { localStorage.setItem(RESOURCE_STORE,JSON.stringify(withDemoMedia(items))); }
