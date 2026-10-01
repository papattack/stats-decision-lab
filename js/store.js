/* ============================================================
   store.js
   Tiny persistence layer over localStorage. Tracks progress
   through each module's teach→manipulate→quiz sequence and the
   per-category miss counts that Exam Mode adapts to.
   ============================================================ */

const Store = (() => {
  const KEY = 'sdl_progress_v1';

  const blank = () => ({
    // module id -> { taught: bool, easy: 'unseen'|'correct'|'wrong', hard: ... }
    modules: {},
    // conceptual category -> { seen: n, missed: n }
    weakness: {},
    activeTab: 'map'
  });

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return blank();
      const parsed = JSON.parse(raw);
      return Object.assign(blank(), parsed);
    } catch (e) {
      return blank();
    }
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { /* storage might be disabled; app still works in-session */ }
  }

  function moduleState(id) {
    if (!state.modules[id]) {
      state.modules[id] = { taught: false, easy: 'unseen', hard: 'unseen' };
    }
    return state.modules[id];
  }

  function markTaught(id) { moduleState(id).taught = true; save(); }

  function markQuiz(id, level, correct) {
    const m = moduleState(id);
    m[level] = correct ? 'correct' : 'wrong';
    save();
  }

  function recordAnswer(category, correct) {
    if (!state.weakness[category]) state.weakness[category] = { seen: 0, missed: 0 };
    state.weakness[category].seen += 1;
    if (!correct) state.weakness[category].missed += 1;
    save();
  }

  function weaknessRanked() {
    // return categories sorted by miss-rate (desc), then by misses
    return Object.entries(state.weakness)
      .map(([cat, v]) => ({
        cat,
        seen: v.seen,
        missed: v.missed,
        rate: v.seen ? v.missed / v.seen : 0
      }))
      .sort((a, b) => (b.rate - a.rate) || (b.missed - a.missed));
  }

  function setActiveTab(id) { state.activeTab = id; save(); }
  function getActiveTab() { return state.activeTab; }

  function reset() { state = blank(); save(); }

  return {
    moduleState, markTaught, markQuiz,
    recordAnswer, weaknessRanked,
    setActiveTab, getActiveTab, reset
  };
})();
