/* ============================================================
   app.js
   Boots the app: builds the tab bar, routes to the active
   module, and wires the reset button. Each module exposes
   { id, title, icon, render(viewEl) }.
   ============================================================ */

(function () {
  const MODULES = [
    MapModule,
    ChooseTestModule,
    SignificanceModule,
    ConfidenceModule,
    RiskModule,
    RegressionModule,
    ErrorsModule,
    ExamModule
  ];

  const tabbar = document.getElementById('tabbar');
  const view = document.getElementById('view');
  const byId = {};
  MODULES.forEach(m => (byId[m.id] = m));

  function buildTabs() {
    UI.clear(tabbar);
    MODULES.forEach(m => {
      const btn = UI.el('button.tab', {
        type: 'button',
        'data-id': m.id,
        onclick: () => activate(m.id)
      }, [
        UI.el('span.tab-icon', { text: m.icon }),
        UI.el('span.tab-label', { text: m.title }),
        progressDot(m.id)
      ]);
      tabbar.appendChild(btn);
    });
  }

  function progressDot(id) {
    const st = Store.moduleState(id);
    let cls = 'tab-dot';
    if (st.easy === 'correct' && st.hard === 'correct') cls += ' done';
    else if (st.taught) cls += ' started';
    return UI.el('span.' + cls.replace(/ /g, '.'), { title: dotTitle(st) });
  }
  function dotTitle(st) {
    if (st.easy === 'correct' && st.hard === 'correct') return 'Completed';
    if (st.taught) return 'Started';
    return 'Not started';
  }

  function activate(id) {
    Store.setActiveTab(id);
    tabbar.querySelectorAll('.tab').forEach(t =>
      t.classList.toggle('active', t.getAttribute('data-id') === id));
    const mod = byId[id] || MODULES[0];
    try {
      mod.render(view);
    } catch (e) {
      UI.clear(view);
      view.appendChild(UI.el('div.error-box', {}, [
        UI.el('h3', { text: 'Something went wrong rendering this module.' }),
        UI.el('pre', { text: String(e && e.stack || e) })
      ]));
      // eslint-disable-next-line no-console
      console.error(e);
    }
    // refresh the progress dots after a module may have marked progress
    refreshDots();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function refreshDots() {
    tabbar.querySelectorAll('.tab').forEach(tab => {
      const id = tab.getAttribute('data-id');
      const old = tab.querySelector('.tab-dot');
      if (old) old.replaceWith(progressDot(id));
    });
  }

  document.getElementById('reset-progress').addEventListener('click', () => {
    if (confirm('Clear everything you\u2019ve learned and answered in this lab?')) {
      Store.reset();
      buildTabs();
      activate('map');
    }
  });

  buildTabs();
  activate(Store.getActiveTab() || 'map');
})();
