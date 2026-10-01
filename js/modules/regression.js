/* ============================================================
   modules/regression.js
   Module 6: Regression interpreter.
   Teach dependent/independent variable, coefficient, model,
   reference group, crude vs adjusted OR, hazard ratio. Then
   show realistic journal output and make the learner CLICK the
   part they should interpret; wrong clicks are explained.
   Tables reproduce lecture examples (RVF logistic; breast-cancer
   insurance ORs; infant-weight linear regression).
   ============================================================ */

const RegressionModule = (() => {
  const id = 'regression';
  const el = UI.el;

  function render(view) {
    UI.clear(view);
    view.appendChild(el('div.module-head', {}, [
      el('h2', { text: '6 \u00b7 Regression Interpreter' }),
      el('p.lede', { html:
        'Learn the words first, then read real journal-style tables and <strong>click the exact number ' +
        'you should interpret</strong>. Wrong clicks get explained.' })
    ]));

    const vocab = ['dependentIndependent', 'coefficient', 'referenceGroup', 'adjustedOR', 'hazardRatio'];
    view.appendChild(el('section.teach-wrap', {}, [
      el('h3', { text: 'Teach it first' }),
      ...vocab.map(v => UI.teachCard(Content.VOCAB[v]))
    ]));
    Store.markTaught(id);

    view.appendChild(el('h3.section-divider', { text: 'Now read the output and click the right cell' }));

    view.appendChild(linearTask());
    view.appendChild(logisticTask());
    view.appendChild(bcTask());

    // harder applied question
    view.appendChild(el('h3.section-divider', { text: 'Application question' }));
    view.appendChild(UI.mcq({
      moduleId: id, level: 'hard', category: 'odds-ratio-reading',
      stem: 'A logistic-regression table shows both an unadjusted OR of 2.74 and an adjusted OR (AOR) of 2.53 for the same exposure. Which do you report, and why?',
      choices: [
        { text: 'The AOR 2.53 \u2014 it accounts for the other variables in the model', correct: true,
          why: 'Adjusted ORs come from the full logistic model and hold the other covariates constant, so they\u2019re what we interpret.' },
        { text: 'The unadjusted 2.74 \u2014 bigger is better', why: 'Size isn\u2019t the criterion; the crude OR ignores confounders.' },
        { text: 'Average them to 2.64', why: 'You never average crude and adjusted ORs; you report the adjusted one.' },
        { text: 'Neither \u2014 ORs can\u2019t be interpreted', why: 'ORs are interpretable: >1 more likely, with the CI deciding significance.' }
      ]
    }));
  }

  /* ---- Linear regression: infant weight on age + mother smokes (L5) ---- */
  function linearTask() {
    const rows = [
      { label: 'Intercept', coef: '\u22121000.99', p: '0.451', interpret: false,
        why: 'We never interpret the intercept \u2014 it\u2019s just the baseline constant.' },
      { label: 'Age (weeks)', coef: '109.26', p: '0.001', interpret: false,
        why: 'Age is significant and interpretable, but this task asks for the SMOKING effect.' },
      { label: 'Mother smokes', coef: '\u2212700.07', p: '0.001', interpret: true,
        why: 'Correct: the "mother smokes" coefficient \u2212700.07 (p = 0.001) means infants weighed ~700 g less, holding age constant \u2014 significant.' }
    ];
    return clickTable({
      caption: 'Linear regression \u2014 infant weight (grams) on age + mother smokes',
      head: ['Variable', 'Coefficient (b)', 'p-value'],
      prompt: 'Click the coefficient that tells you the <strong>effect of the mother smoking</strong> on infant weight.',
      rows: rows.map(r => ({
        cells: [r.label, r.coef, r.p],
        clickCellIndex: 1,
        correct: r.interpret,
        why: r.why
      })),
      category: 'core-definitions'
    });
  }

  /* ---- Logistic regression: Rift Valley fever adjusted ORs (L5) ---- */
  function logisticTask() {
    const rows = [
      { label: 'Consumed products from sick animals', aor: '2.53 (1.78\u20133.61)', p: '<0.0001', interpret: false,
        why: 'Also a valid significant AOR, but the task asks specifically for the herdsperson row.' },
      { label: 'Herdsperson', aor: '1.77 (1.20\u20132.63)', p: '0.0042', interpret: true,
        why: 'Correct: AOR 1.77 with 95% CI (1.20\u20132.63). The CI excludes 1, so a herdsperson is ~77% more likely to develop acute RVF \u2014 significant.' },
      { label: 'Slept outside with herd', aor: 'NS', p: 'NS', interpret: false,
        why: 'This was not statistically significant in the model, so it isn\u2019t the interpreted adjusted effect.' }
    ];
    return clickTable({
      caption: 'Logistic regression \u2014 risk factors for acute Rift Valley fever (adjusted ORs)',
      head: ['Exposure', 'Adjusted OR (95% CI)', 'p-value'],
      prompt: 'Click the <strong>adjusted odds ratio for being a herdsperson</strong>.',
      rows: rows.map(r => ({
        cells: [r.label, r.aor, r.p],
        clickCellIndex: 1,
        correct: r.interpret,
        why: r.why
      })),
      category: 'odds-ratio-reading'
    });
  }

  /* ---- Breast-cancer insurance ORs with a reference group (L5) ---- */
  function bcTask() {
    const rows = [
      { label: 'Insured (reference)', aor: '1.00 (Referent)', p: '\u2014', interpret: false,
        why: 'The reference category always has OR = 1 by definition \u2014 there\u2019s nothing to interpret here.' },
      { label: 'Medicaid', aor: '1.14 (1.07\u20131.21)', p: '<0.001', interpret: true,
        why: 'Correct: vs the Insured reference, Medicaid AOR 1.14 (CI excludes 1) means ~14% more likely to have radiation omitted \u2014 significant.' },
      { label: 'Uninsured', aor: '1.29 (1.14\u20131.47)', p: '<0.001', interpret: false,
        why: 'Also significant (29% more likely), but this task asked for the Medicaid row.' }
    ];
    return clickTable({
      caption: 'Logistic regression \u2014 omission of radiation after breast-conserving surgery (adjusted ORs, reference = Insured)',
      head: ['Insurance status', 'Adjusted OR (95% CI)', 'p-value'],
      prompt: 'Insured is the reference group. Click the AOR that says how <strong>Medicaid</strong> compares to it.',
      rows: rows.map(r => ({
        cells: [r.label, r.aor, r.p],
        clickCellIndex: 1,
        correct: r.interpret,
        why: r.why
      })),
      category: 'odds-ratio-reading'
    });
  }

  /* generic clickable-table builder */
  function clickTable(cfg) {
    const wrap = el('div.reg-task', {}, [
      el('p.reg-prompt', { html: cfg.prompt })
    ]);
    const feedback = el('div.reg-feedback', {}, []);
    let locked = false;

    const thead = el('thead', {}, [
      el('tr', {}, cfg.head.map(h => el('th', { text: h })))
    ]);
    const tbody = el('tbody', {},
      cfg.rows.map((r) =>
        el('tr', {},
          r.cells.map((cellText, ci) => {
            const clickable = ci === r.clickCellIndex;
            const td = el('td' + (clickable ? '.clickable-cell' : ''), { html: cellText });
            if (clickable) td.addEventListener('click', () => resolve(r, td));
            return td;
          })
        )
      )
    );

    function resolve(r, cell) {
      if (locked) return;
      locked = true;
      // mark the correct cell
      tbody.querySelectorAll('.clickable-cell').forEach((td, i) => {
        td.classList.add('resolved');
      });
      // find the correct cell and mark; mark the chosen one
      const chosenCorrect = r.correct;
      if (cell) cell.classList.add(chosenCorrect ? 'cell-correct' : 'cell-wrong');
      // also highlight the actually-correct cell if the pick was wrong
      if (!chosenCorrect) {
        const correctRowIndex = cfg.rows.findIndex(x => x.correct);
        const correctTr = tbody.children[correctRowIndex];
        if (correctTr) {
          const correctTd = correctTr.children[cfg.rows[correctRowIndex].clickCellIndex];
          if (correctTd) correctTd.classList.add('cell-correct');
        }
      }

      feedback.className = 'reg-feedback ' + (chosenCorrect ? 'ok' : 'bad');
      feedback.innerHTML = (chosenCorrect ? '<strong>Correct.</strong> ' : '<strong>Not that one.</strong> ') + r.why;
      if (!chosenCorrect) {
        const right = cfg.rows.find(x => x.correct);
        if (right) feedback.innerHTML += '<br><span class="mcq-right-why"><strong>The right cell:</strong> ' + right.why + '</span>';
      }

      Store.recordAnswer(cfg.category, chosenCorrect);
      Store.markQuiz(id, 'easy', chosenCorrect);
    }

    wrap.appendChild(el('div.reg-table-wrap', {}, [
      el('p.reg-caption', { text: cfg.caption }),
      el('table.reg-table', {}, [thead, tbody])
    ]));
    wrap.appendChild(feedback);
    return wrap;
  }

  return { id, title: 'Regression Interpreter', icon: '\uD83D\uDCCA', render };
})();
