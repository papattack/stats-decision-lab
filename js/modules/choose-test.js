/* ============================================================
   modules/choose-test.js
   Module 1: Choose-the-test simulator.
   TEACHES each test briefly (plain medical examples) BEFORE
   asking the learner to pick. After an answer, visually shows
   WHY that test fits via the data/question cues.
   ============================================================ */

const ChooseTestModule = (() => {
  const id = 'choose-test';
  const el = UI.el;
  const ORDER = ['ttest', 'chisq', 'correlation', 'linreg', 'logreg', 'cox', 'did'];

  function render(view) {
    UI.clear(view);
    view.appendChild(el('div.module-head', {}, [
      el('h2', { text: '1 \u00b7 Which test fits?' })
    ]));

    // DO FIRST: jump straight into a scenario. Teaching is on demand.
    view.appendChild(UI.prompt(
      '<strong>Read the scenario and pick a test.</strong> Guess if you\u2019re not sure \u2014 after you answer, ' +
      'the clues that point to the right test light up. That\u2019s how you\u2019ll learn them.'));

    const quizHost = el('div#ct-quiz', {}, []);
    view.appendChild(quizHost);
    Store.markTaught(id);

    /* --- reference: what each test is for, on demand --- */
    view.appendChild(UI.stuck([
      el('div.mini-test-grid', {},
        ORDER.map(k => {
          const t = Content.TESTS[k];
          return el('div.mini-test', {}, [
            el('h4', { text: t.name }),
            el('p.mini-tag', { text: t.tagline }),
            el('p.mini-ex', { html: '<strong>Use when:</strong> ' + t.questionIn }),
            el('p.mini-ex', { html: '<strong>Example:</strong> ' + t.lectureExample })
          ]);
        })
      )
    ], 'Stuck? Show me a cheat-sheet of what each test is for'));

    let order = shuffle(Content.SCENARIOS.slice());
    let idx = 0;
    let correctCount = 0;

    function showScenario() {
      UI.clear(quizHost);
      if (idx >= order.length) {
        quizHost.appendChild(el('div.quiz-done', {}, [
          el('p', { html: '<strong>Round complete.</strong> You matched ' + correctCount +
            ' of ' + order.length + ' scenarios to the right test.' }),
          el('button.primary-btn', {
            type: 'button',
            onclick: () => { order = shuffle(Content.SCENARIOS.slice()); idx = 0; correctCount = 0; showScenario(); }
          }, 'Shuffle & go again')
        ]));
        return;
      }

      const sc = order[idx];
      const progress = el('p.ct-progress', { text: 'Scenario ' + (idx + 1) + ' of ' + order.length });

      const card = el('div.scenario-card', {}, [
        progress,
        el('p.scenario-stem', { html: sc.stem }),
        el('p.scenario-ask', { text: 'Which statistical test fits best?' })
      ]);

      const choices = el('div.ct-choices', {},
        ORDER.map(k => el('button.ct-choice', {
          type: 'button',
          onclick: () => resolve(k)
        }, Content.TESTS[k].name))
      );

      const feedback = el('div.ct-feedback', {}, []);
      let locked = false;

      function resolve(picked) {
        if (locked) return;
        locked = true;
        const correct = picked === sc.answer;
        if (correct) correctCount++;
        Store.recordAnswer('choosing-a-test', correct);
        Store.markQuiz(id, idx === 0 ? 'easy' : 'hard', correct);

        [...choices.children].forEach((b, i) => {
          b.classList.add('resolved');
          if (ORDER[i] === sc.answer) b.classList.add('is-correct');
          if (ORDER[i] === picked && !correct) b.classList.add('picked-wrong');
        });

        // visual "why it fits": highlight the cues
        feedback.className = 'ct-feedback ' + (correct ? 'ok' : 'bad');
        feedback.appendChild(el('p', { html:
          (correct ? '<strong>Correct.</strong> ' : '<strong>Not quite \u2014 the answer is ' +
            Content.TESTS[sc.answer].name + '.</strong> ') + sc.because }));
        feedback.appendChild(el('p.cue-label', { text: 'The clues that point here:' }));
        feedback.appendChild(el('ul.cue-list', {},
          sc.cues.map(c => el('li', { html: c }))));

        const next = el('button.primary-btn', {
          type: 'button',
          onclick: () => { idx++; showScenario(); }
        }, idx + 1 >= order.length ? 'See results' : 'Next scenario');
        feedback.appendChild(next);
      }

      card.appendChild(choices);
      card.appendChild(feedback);
      quizHost.appendChild(card);
    }

    showScenario();
  }

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  return { id, title: 'Choose the Test', icon: '\uD83E\uDDED', render };
})();
