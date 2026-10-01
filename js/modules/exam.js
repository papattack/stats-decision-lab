/* ============================================================
   modules/exam.js
   Module 8: Exam mode.
   Multiple-choice questions resembling the course's reasoning.
   Tracks which conceptual CATEGORY you miss and weights future
   questions toward your weak spots. Shows a live weakness
   dashboard so you can see what to review.
   ============================================================ */

const ExamModule = (() => {
  const id = 'exam';
  const el = UI.el;

  let served = [];          // ids/indexes already shown this session-run
  let answeredThisRun = 0;
  let correctThisRun = 0;

  function render(view) {
    UI.clear(view);
    view.appendChild(el('div.module-head', {}, [
      el('h2', { text: '8 \u00b7 Exam Mode (adaptive)' }),
      el('p.lede', { html:
        'Short multiple-choice questions in the style the course emphasizes. ' +
        'The lab tracks the <strong>concept categories you miss</strong> and leans future questions toward them.' })
    ]));

    const dash = el('div#exam-dash', {}, []);
    view.appendChild(dash);

    const host = el('div#exam-host', {}, []);
    view.appendChild(host);

    const controls = el('div.exam-controls', {}, [
      el('button.primary-btn', { type: 'button', onclick: () => nextQuestion(host, dash) }, 'Next question'),
      el('button.ghost-btn', { type: 'button', onclick: () => { served = []; answeredThisRun = 0; correctThisRun = 0; renderDash(dash); host.innerHTML=''; nextQuestion(host, dash); } }, 'Restart run')
    ]);
    view.appendChild(controls);

    Store.markTaught(id);
    renderDash(dash);
    nextQuestion(host, dash);
  }

  function pickQuestion() {
    const bank = Content.EXAM_BANK;
    const ranked = Store.weaknessRanked();
    const weakSet = new Set(ranked.filter(r => r.rate >= 0.5 && r.seen > 0).map(r => r.cat));

    // candidate questions not yet served this run
    let pool = bank.map((q, i) => ({ q, i })).filter(x => !served.includes(x.i));
    if (pool.length === 0) { served = []; pool = bank.map((q, i) => ({ q, i })); }

    // if we have identified weak categories, prefer those
    const weakPool = pool.filter(x => weakSet.has(x.q.category));
    const chooseFrom = weakPool.length ? weakPool : pool;

    const choice = chooseFrom[Math.floor(Math.random() * chooseFrom.length)];
    served.push(choice.i);
    return choice;
  }

  function nextQuestion(host, dash) {
    UI.clear(host);
    const { q } = pickQuestion();

    const catLabel = Content.CATEGORY_LABELS[q.category] || q.category;
    const card = el('div.exam-card', {}, [
      el('div.exam-cat', {}, [ UI.badge(catLabel, 'cat') ])
    ]);

    const mcqNode = UI.mcq({
      moduleId: null,            // exam doesn't change module teach-state
      level: null,
      category: q.category,
      stem: q.stem,
      choices: q.choices
    }, (correct) => {
      answeredThisRun++;
      if (correct) correctThisRun++;
      renderDash(dash);
      // auto-offer the next one
      const cont = el('div.exam-next', {}, [
        el('button.primary-btn', { type: 'button', onclick: () => nextQuestion(host, dash) }, 'Next question \u2192')
      ]);
      host.appendChild(cont);
    });

    card.appendChild(mcqNode);
    host.appendChild(card);
  }

  function renderDash(dash) {
    UI.clear(dash);
    const ranked = Store.weaknessRanked();

    const summary = el('div.exam-summary', {}, [
      el('span', { html: 'This run: <strong>' + correctThisRun + ' / ' + answeredThisRun + '</strong> correct' })
    ]);

    if (ranked.length === 0) {
      dash.appendChild(summary);
      dash.appendChild(el('p.dash-empty', { text:
        'Answer a few questions and your per-concept accuracy will appear here. ' +
        'Weak areas get prioritized automatically.' }));
      return;
    }

    const bars = el('div.weak-bars', {}, ranked.map(r => {
      const label = Content.CATEGORY_LABELS[r.cat] || r.cat;
      const acc = r.seen ? Math.round((1 - r.rate) * 100) : 0;
      const weak = r.rate >= 0.5 && r.seen > 0;
      return el('div.weak-row', {}, [
        el('span.weak-label', { text: label }),
        el('span.weak-track', {}, [
          el('span.weak-fill' + (weak ? '.weak' : ''), { style: 'width:' + acc + '%' })
        ]),
        el('span.weak-num', { text: acc + '% (' + (r.seen - r.missed) + '/' + r.seen + ')' })
      ]);
    }));

    dash.appendChild(summary);
    dash.appendChild(el('h3.dash-title', { text: 'Your accuracy by concept' }));
    dash.appendChild(bars);

    const worst = ranked.find(r => r.rate >= 0.5 && r.seen > 0);
    if (worst) {
      dash.appendChild(el('p.dash-focus', { html:
        'Focusing your next questions on your weakest area: <strong>' +
        (Content.CATEGORY_LABELS[worst.cat] || worst.cat) + '</strong>.' }));
    }
  }

  return { id, title: 'Exam Mode', icon: '\uD83C\uDF93', render };
})();
