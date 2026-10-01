/* ============================================================
   modules/errors.js
   Module 7: Error & power simulator.
   Teach Type I, Type II, alpha, beta, power from scratch using
   the diagnostic-test framing (H0: patient does NOT have the
   disease). Then sliders for sample size and effect size drive
   a live power readout and a two-curve picture (null vs
   alternative) with the rejection region shaded.
   ============================================================ */

const ErrorsModule = (() => {
  const id = 'errors';
  const el = UI.el;

  const W = 640, H = 300, PAD = 36;
  let nPerGroup = 30;      // sample size per group
  let effect = 0.5;        // true standardized effect size (Cohen's d-ish)

  function render(view) {
    UI.clear(view);
    view.appendChild(el('div.module-head', {}, [
      el('h2', { text: '7 \u00b7 Error & Power Simulator' }),
      el('p.lede', { html:
        'Learn the four ideas with a diagnostic-test story, then <strong>slide sample size and effect size</strong> ' +
        'and watch statistical power rise and fall.' })
    ]));

    // TEACH with the pregnancy/diagnostic framing from the slides
    view.appendChild(el('section.teach-wrap', {}, [
      el('h3', { text: 'Teach it first' }),
      el('div.why-box', {}, [
        el('h4', { text: 'Set up the hypothesis like a diagnostic test' }),
        el('p', { html:
          'H\u2080: the patient does <strong>not</strong> have the disease. H\u2090: the patient <strong>does</strong>.' }),
        el('ul', {}, [
          el('li', { html: '<strong>Type I error</strong> = the test says "diseased" when the patient is healthy ' +
            '(reject a true H\u2080) \u2014 a <em>false positive</em>. Think: telling a man "you\u2019re pregnant."' }),
          el('li', { html: '<strong>Type II error</strong> = the test says "healthy" when the patient is diseased ' +
            '(fail to reject a false H\u2080) \u2014 a <em>false negative</em>. Think: telling a visibly pregnant woman "you\u2019re not pregnant."' })
        ])
      ]),
      UI.teachCard(Content.VOCAB.typeI),
      UI.teachCard(Content.VOCAB.typeII),
      UI.teachCard(Content.VOCAB.alpha)
    ]));
    Store.markTaught(id);

    // 2x2 truth table
    view.appendChild(truthTable());

    // VISUAL + MANIPULATE
    view.appendChild(el('h3.section-divider', { text: 'Now manipulate it' }));
    view.appendChild(el('p.table-note', { html:
      'The left curve is the world if H\u2080 is true; the right curve is the world if the real effect is as large as ' +
      'you set. <span class="swatch swatch-alpha"></span> = Type I (\u03b1); ' +
      '<span class="swatch swatch-beta"></span> = Type II (\u03b2); power = 1 \u2212 \u03b2.' }));

    const controls = el('div.playground-controls', {}, [
      slider('Sample size per group (n)', 3, 200, nPerGroup, 1, (v) => { nPerGroup = v; redraw(); }, () => nPerGroup),
      slider('True effect size (standardized)', 0, 2, effect, 0.05, (v) => { effect = v; redraw(); }, () => effect.toFixed(2))
    ]);
    view.appendChild(controls);

    const canvasWrap = el('div.canvas-wrap', {}, []);
    const canvas = el('canvas#pow-canvas', { width: W, height: H });
    canvasWrap.appendChild(canvas);
    view.appendChild(canvasWrap);

    const readout = el('div#pow-readout.readout', {}, []);
    view.appendChild(readout);

    // questions
    view.appendChild(el('h3.section-divider', { text: 'Check yourself' }));
    view.appendChild(UI.mcq({
      moduleId: id, level: 'easy', category: 'errors-power',
      stem: 'You slide sample size up while keeping the true effect fixed. Power\u2026',
      choices: [
        { text: 'increases', correct: true, why: 'More data = more information = the two curves separate = higher power (lower \u03b2).' },
        { text: 'decreases', why: 'Bigger samples raise power; smaller samples lower it.' },
        { text: 'is unaffected by sample size', why: 'Power depends directly on sample size and effect size.' }
      ]
    }));
    view.appendChild(UI.mcq({
      moduleId: id, level: 'hard', category: 'errors-power',
      stem: 'A real effect exists but a study has a tiny sample and a small effect size, so it fails to reach p &lt; 0.05. What happened, in the course\u2019s terms?',
      choices: [
        { text: 'A Type II error from low power \u2014 small effect size and small sample', correct: true,
          why: 'Failing to reject a false H\u2080 is a Type II error; its usual causes are a small effect size and/or a small sample (low power).' },
        { text: 'A Type I error', why: 'Type I is a false positive \u2014 rejecting a true H\u2080; here we failed to detect a real effect.' },
        { text: 'The null hypothesis was proven true', why: 'Failing to reject H\u2080 never "proves" it; it may just reflect low power.' },
        { text: 'Alpha was set too low', why: 'The described cause is low power from small n and effect, not the \u03b1 level.' }
      ]
    }));

    function redraw() { draw(canvas, readout); }
    redraw();
  }

  function truthTable() {
    return el('div.truth-wrap', {}, [
      el('table.truth-table', {}, [
        el('thead', {}, [ el('tr', {}, [
          el('th', { text: '' }),
          el('th', { html: 'Disease PRESENT<br>(H\u2080 false)' }),
          el('th', { html: 'Disease ABSENT<br>(H\u2080 true)' })
        ])]),
        el('tbody', {}, [
          el('tr', {}, [
            el('th', { html: 'Test POSITIVE<br>(reject H\u2080)' }),
            el('td.cell-good', { html: 'True positive \u2713' }),
            el('td.cell-type1', { html: '<strong>Type I error</strong><br>false positive (\u03b1)' })
          ]),
          el('tr', {}, [
            el('th', { html: 'Test NEGATIVE<br>(fail to reject H\u2080)' }),
            el('td.cell-type2', { html: '<strong>Type II error</strong><br>false negative (\u03b2)' }),
            el('td.cell-good', { html: 'True negative \u2713' })
          ])
        ])
      ])
    ]);
  }

  function slider(label, min, max, value, step, onInput, valueGetter) {
    const valSpan = el('span.slider-val', { text: String(valueGetter()) });
    const input = el('input.pg-range', {
      type: 'range', min, max, value, step,
      oninput: (e) => {
        const v = parseFloat(e.target.value);
        onInput(step < 1 ? v : Math.round(v));
        valSpan.textContent = String(valueGetter());
      }
    });
    return el('label.pg-label', {}, [ el('span', { text: label }), input, valSpan ]);
  }

  function draw(canvas, readout) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);

    // standardized: null centered at 0, alternative at noncentrality delta.
    // delta grows with effect size and sqrt(n) -- the usual power relationship.
    const delta = effect * Math.sqrt(nPerGroup / 2);
    const crit = 1.96;                       // two-sided z cutoff at alpha .05
    const alpha = 0.05;
    const power = StatsMath.approxPower(delta, crit);
    const beta = 1 - power;

    // plot range covers both curves
    const XMIN = -4, XMAX = Math.max(6, delta + 4);
    const pdf0 = (x) => StatsMath.normalPdf(x);
    const pdf1 = (x) => StatsMath.normalPdf(x - delta);
    const peak = StatsMath.normalPdf(0);

    const xPix = (x) => PAD + ((x - XMIN) / (XMAX - XMIN)) * (W - 2 * PAD);
    const yPix = (y) => (H - PAD) - (y / peak) * (H - 2 * PAD);

    // shade Type I (alpha): null curve beyond +crit
    shade(ctx, pdf0, xPix, yPix, crit, XMAX, 'rgba(220,80,80,0.30)');
    // shade Type II (beta): alternative curve BELOW +crit (failed to reject)
    shade(ctx, pdf1, xPix, yPix, XMIN, crit, 'rgba(70,110,200,0.28)');

    // curves
    curve(ctx, pdf0, xPix, yPix, XMIN, XMAX, '#2b3a67');  // null
    curve(ctx, pdf1, xPix, yPix, XMIN, XMAX, '#1c7c54');  // alternative

    // baseline + crit line
    ctx.strokeStyle = '#99a'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(PAD, H - PAD); ctx.lineTo(W - PAD, H - PAD); ctx.stroke();

    ctx.strokeStyle = '#c85050'; ctx.setLineDash([4, 3]); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(xPix(crit), yPix(0)); ctx.lineTo(xPix(crit), yPix(peak)); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#c85050'; ctx.font = '10px system-ui, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('reject H\u2080 \u2192', xPix(crit) + 34, yPix(0) + 14);

    // labels for the two curves
    ctx.fillStyle = '#2b3a67'; ctx.textAlign = 'center';
    ctx.fillText('H\u2080 true', xPix(0), yPix(peak) - 6);
    ctx.fillStyle = '#1c7c54';
    ctx.fillText('real effect', xPix(delta), yPix(peak) - 6);

    UI.clear(readout);
    readout.appendChild(el('div.readout-row', {}, [
      chip('n per group', String(nPerGroup)),
      chip('Effect size', effect.toFixed(2)),
      chip('\u03b1 (Type I)', alpha.toFixed(2)),
      chip('\u03b2 (Type II)', beta.toFixed(2)),
      chip('Power (1\u2212\u03b2)', (power * 100).toFixed(0) + '%')
    ]));
    const strong = power >= 0.8;
    readout.appendChild(el('div.verdict.' + (strong ? 'verdict-sig' : 'verdict-notsig'), {},
      strong
        ? el('span', { html: 'Power \u2265 80% \u2014 this study is reasonably likely to <strong>detect the real effect</strong>. ' +
            'Notice: raising n or the effect size pushed the green curve right, shrinking \u03b2.' })
        : el('span', { html: 'Power &lt; 80% \u2014 a real effect could easily be <strong>missed (Type II error)</strong>. ' +
            'The usual fixes: a bigger sample or a larger true effect.' })
    ));
  }

  function chip(label, value) {
    return el('span.chip', {}, [ el('span.chip-label', { text: label }), el('span.chip-value', { text: value }) ]);
  }
  function curve(ctx, pdf, xPix, yPix, XMIN, XMAX, color) {
    ctx.beginPath();
    for (let i = 0; i <= 300; i++) {
      const x = XMIN + (i / 300) * (XMAX - XMIN);
      const px = xPix(x), py = yPix(pdf(x));
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
  }
  function shade(ctx, pdf, xPix, yPix, from, to, fill) {
    if (from >= to) return;
    ctx.beginPath();
    ctx.moveTo(xPix(from), yPix(0));
    for (let i = 0; i <= 120; i++) {
      const x = from + (i / 120) * (to - from);
      ctx.lineTo(xPix(x), yPix(pdf(x)));
    }
    ctx.lineTo(xPix(to), yPix(0));
    ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
  }

  return { id, title: 'Errors & Power', icon: '\u2696\uFE0F', render };
})();
