/* ============================================================
   modules/risk.js
   Module 5: Risk calculator.
   Teach AR, ARR, RR, RRR, OR, NNT one at a time, then an
   editable 2x2 table recomputes every measure live and explains
   what each means in real patients. Numbers default to the
   lecture's heparin RCT (L3).
   ============================================================ */

const RiskModule = (() => {
  const id = 'risk';
  const el = UI.el;

  // heparin example defaults (L3):
  // Experimental (heparin): a=50 events, b=350 none
  // Control (no heparin):   c=175 events, d=225 none
  let a = 50, b = 350, c = 175, d = 225;

  function render(view) {
    UI.clear(view);
    view.appendChild(el('div.module-head', {}, [
      el('h2', { text: '5 \u00b7 Risk Calculator' }),
      el('p.lede', { html:
        'Learn each risk measure one at a time, then <strong>edit the 2\u00d72 table</strong> and watch every ' +
        'measure \u2014 and its plain-English meaning \u2014 update together.' })
    ]));

    const measures = ['absoluteRisk', 'arr', 'relativeRisk', 'rrr', 'oddsRatio', 'nnt'];
    view.appendChild(el('section.teach-wrap', {}, [
      el('h3', { text: 'Teach them one at a time' }),
      ...measures.map(m => UI.teachCard(Content.VOCAB[m]))
    ]));
    Store.markTaught(id);

    view.appendChild(el('h3.section-divider', { text: 'Now manipulate the 2\u00d72 table' }));
    view.appendChild(el('p.table-note', { html:
      'Defaults are the lecture\u2019s heparin trial. Change any of the four counts to see the measures move.' }));

    const tableHost = el('div#risk-table', {}, []);
    view.appendChild(tableHost);

    const resultsHost = el('div#risk-results', {}, []);
    view.appendChild(resultsHost);

    view.appendChild(el('div.preset-row', {}, [
      el('span.preset-label', { text: 'Lecture presets:' }),
      el('button.preset-btn', { type: 'button', onclick: () => { set(50,350,175,225); } },
        'Heparin RCT'),
      el('button.preset-btn', { type: 'button', onclick: () => { set(25,75,50,50); } },
        'Vaccine 50%\u219225% risk'),
      el('button.preset-btn', { type: 'button', onclick: () => { set(1,99,2,98); } },
        'Vaccine 2%\u21921% risk (same RRR!)')
    ]));

    // questions
    view.appendChild(el('h3.section-divider', { text: 'Check yourself' }));
    view.appendChild(UI.mcq({
      moduleId: id, level: 'easy', category: 'risk-measures',
      stem: 'Control event rate is 43.8% and experimental is 12.5%. The <em>absolute</em> risk reduction is\u2026',
      choices: [
        { text: '31.3 percentage points', correct: true, why: 'ARR = CER \u2212 EER = 43.8% \u2212 12.5% = 31.3 pp.' },
        { text: '28.5%', why: 'That is the relative risk (EER/CER).' },
        { text: '71.5%', why: 'That is the relative risk reduction (1 \u2212 RR).' }
      ]
    }));
    view.appendChild(UI.mcq({
      moduleId: id, level: 'hard', category: 'risk-measures',
      stem: 'Two scenarios have the SAME relative risk reduction of 50% (risk 50%\u219225%, and risk 2%\u21921%). Why does the course warn about reporting only RRR?',
      choices: [
        { text: 'Because the absolute benefit (ARR) and NNT are wildly different \u2014 25 pp vs 1 pp, NNT 4 vs 100', correct: true,
          why: 'Identical RRR can hide a tiny absolute effect. Try the two vaccine presets: same RRR, very different ARR and NNT.' },
        { text: 'Because RRR cannot be calculated for rare diseases', why: 'RRR is defined fine; the issue is it can look impressive while the absolute change is tiny.' },
        { text: 'Because RRR and RR are the same number', why: 'They are different (RRR = 1 \u2212 RR); the warning is about absolute vs relative framing.' }
      ]
    }));

    function set(na, nb, nc, nd) { a=na; b=nb; c=nc; d=nd; drawTable(); drawResults(); }
    function drawTable() {
      UI.clear(tableHost);
      tableHost.appendChild(buildTable());
    }

    function buildTable() {
      const cell = (val, key) => el('td', {}, [
        el('input.cell-input', {
          type: 'number', min: 0, value: val,
          oninput: (e) => {
            const n = Math.max(0, parseInt(e.target.value || '0', 10));
            if (key === 'a') a = n; if (key === 'b') b = n;
            if (key === 'c') c = n; if (key === 'd') d = n;
            drawResults();
          }
        })
      ]);
      const t = el('table.twobytwo', {}, [
        el('thead', {}, [ el('tr', {}, [
          el('th', { text: '' }),
          el('th', { html: 'Adverse event<br>occurs' }),
          el('th', { html: 'Adverse event<br>does NOT occur' }),
          el('th', { text: 'Row total' })
        ])]),
        el('tbody', {}, [
          el('tr', {}, [
            el('th.rowlabel', { html: 'Experimental<br>(treatment)' }),
            cell(a, 'a'), cell(b, 'b'),
            el('td.total', { id: 'tot-exp' })
          ]),
          el('tr', {}, [
            el('th.rowlabel', { html: 'Control' }),
            cell(c, 'c'), cell(d, 'd'),
            el('td.total', { id: 'tot-ctrl' })
          ])
        ])
      ]);
      return t;
    }

    function drawResults() {
      // keep row totals fresh
      const te = document.getElementById('tot-exp');
      const tc = document.getElementById('tot-ctrl');
      if (te) te.textContent = String(a + b);
      if (tc) tc.textContent = String(c + d);

      const EER = (a + b) ? a / (a + b) : 0;
      const CER = (c + d) ? c / (c + d) : 0;
      const ARR = CER - EER;
      const RR  = CER ? EER / CER : NaN;
      const RRR = (CER && !isNaN(RR)) ? 1 - RR : NaN;
      const OR  = (b && c) ? (a * d) / (b * c) : NaN;
      const NNT = ARR ? 1 / ARR : NaN;

      UI.clear(resultsHost);

      resultsHost.appendChild(el('div.risk-grid', {}, [
        rcard('Absolute risk \u2014 experimental (EER)', pct(EER),
          'Of treated patients, ' + pct(EER) + ' had the event.'),
        rcard('Absolute risk \u2014 control (CER)', pct(CER),
          'Of control patients, ' + pct(CER) + ' had the event.'),
        rcard('Absolute risk reduction (ARR)', ppText(ARR),
          'Per 100 treated patients, about ' + Math.abs(ARR * 100).toFixed(1) +
          (ARR >= 0 ? ' fewer' : ' MORE') + ' had the event than per 100 controls.'),
        rcard('Relative risk (RR)', fix(RR),
          isNaN(RR) ? 'Undefined (control risk is 0).' :
            'The treated group\u2019s event rate is ' + fix(RR) + '\u00d7 the control group\u2019s rate (' +
            (RR < 1 ? 'lower' : RR > 1 ? 'higher' : 'equal') + ').'),
        rcard('Relative risk reduction (RRR)', isNaN(RRR) ? '\u2014' : pct(RRR),
          isNaN(RRR) ? 'Undefined.' :
            'Treatment cut the event rate by about ' + pct(RRR) + ' relative to control.'),
        rcard('Odds ratio (OR)', fix(OR),
          isNaN(OR) ? 'Undefined (a zero cell).' :
            'Odds of the event with treatment are ' + fix(OR) + '\u00d7 the odds without (' +
            (OR < 1 ? 'lower' : OR > 1 ? 'higher' : 'equal') + ').'),
        rcard('Number needed to treat (NNT)', isNaN(NNT) ? '\u2014' : (NNT < 0 ? '\u2014 (harm)' : nnt(NNT)),
          isNaN(NNT) || NNT < 0 ? 'NNT needs a positive risk reduction.' :
            'Treat about ' + Math.ceil(NNT) + ' patients for one to benefit (exact ' + NNT.toFixed(1) + ').')
      ]));

      // significance-value reminder tying back to the map rules
      resultsHost.appendChild(el('div.why-box.compact', {}, [
        el('p', { html:
          '<strong>Significance reminder:</strong> RR and OR are <em>ratios</em> \u2014 their 95% CI is judged against ' +
          '<strong>1</strong>. ARR is a <em>difference</em> \u2014 its CI is judged against <strong>0</strong>.' })
      ]));
    }

    drawTable();
    drawResults();
  }

  function rcard(label, value, meaning) {
    return el('div.risk-card', {}, [
      el('span.risk-label', { text: label }),
      el('span.risk-value', { text: value }),
      el('span.risk-meaning', { text: meaning })
    ]);
  }

  function pct(x) { return isFinite(x) ? (x * 100).toFixed(1) + '%' : '\u2014'; }
  function ppText(x) { return isFinite(x) ? (x * 100).toFixed(1) + ' pp' : '\u2014'; }
  function fix(x) { return isFinite(x) ? x.toFixed(2) : '\u2014'; }
  function nnt(x) { return x.toFixed(1); }

  return { id, title: 'Risk Calculator', icon: '\uD83E\uDE7A', render };
})();
