/* ============================================================
   modules/significance.js
   Module 3: Statistical-significance playground.
   Teach the vocabulary (null, test statistic, critical value,
   rejection region, alpha) THEN let the learner drag a test
   statistic along a t/normal curve and watch the p-value and
   shaded rejection regions update live.
   ============================================================ */

const SignificanceModule = (() => {
  const id = 'significance';
  const el = UI.el;

  // drawing constants
  const W = 640, H = 320, PAD = 36;
  const XMIN = -4, XMAX = 4;         // z/t axis range
  let df = 29;                        // default df (APGAR example used df 29)
  let stat = 2.52;                    // draggable test statistic (APGAR t)
  let useNormal = false;

  let coachRef = null;

  function render(view) {
    UI.clear(view);
    view.appendChild(el('div.module-head', {}, [
      el('h2', { text: '3 \u00b7 Significance \u2014 drag it and see' })
    ]));

    // DO FIRST: one-line prompt, then straight into the curve.
    view.appendChild(UI.prompt(
      '<strong>Grab the green dot and drag it left/right.</strong> It\u2019s your "test statistic." ' +
      'Watch what happens to the p-value and the red "reject" zones as you move it.'));

    coachRef = UI.coach(
      'Drag the dot outward (toward the red tails) and I\u2019ll tell you what it means\u2026');
    view.appendChild(coachRef.node);
    Store.markTaught(id);

    const controls = el('div.playground-controls', {}, [
      el('label.pg-label', {}, [
        el('span', { text: 'Distribution:' }),
        (() => {
          const sel = el('select.pg-select', {
            onchange: (e) => { useNormal = e.target.value === 'normal'; redraw(); }
          }, [
            el('option', { value: 't' }, 't-distribution (sample)'),
            el('option', { value: 'normal' }, 'standard normal (z)')
          ]);
          return sel;
        })()
      ]),
      el('label.pg-label', {}, [
        el('span', { text: 'Sample size (n), sets df = n\u22121:' }),
        (() => {
          const input = el('input.pg-range', {
            type: 'range', min: 3, max: 120, value: 30, step: 1,
            oninput: (e) => { df = Math.max(1, parseInt(e.target.value, 10) - 1); redraw(); }
          });
          return input;
        })()
      ])
    ]);
    view.appendChild(controls);

    const canvasWrap = el('div.canvas-wrap', {}, []);
    const canvas = el('canvas#sig-canvas', { width: W, height: H });
    canvas.style.touchAction = 'none';
    canvasWrap.appendChild(canvas);
    view.appendChild(canvasWrap);

    const readout = el('div#sig-readout.readout', {}, []);
    view.appendChild(readout);

    // dragging
    let dragging = false;
    const toStat = (clientX) => {
      const rect = canvas.getBoundingClientRect();
      const x = (clientX - rect.left) * (W / rect.width);
      const frac = (x - PAD) / (W - 2 * PAD);
      return clamp(XMIN + frac * (XMAX - XMIN), XMIN, XMAX);
    };
    canvas.addEventListener('pointerdown', (e) => {
      dragging = true; canvas.setPointerCapture(e.pointerId);
      stat = toStat(e.clientX); redraw();
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      stat = toStat(e.clientX); redraw();
    });
    canvas.addEventListener('pointerup', () => { dragging = false; });

    // preset buttons tie back to the APGAR example (p-value ladder, L4)
    view.appendChild(el('div.preset-row', {}, [
      el('span.preset-label', { text: 'Jump to a lecture value:' }),
      presetBtn('t = 2.14 (critical)', 2.14, redraw, () => stat = 2.14),
      presetBtn('t = 2.52 (APGAR)', 2.52, redraw, () => stat = 2.52),
      presetBtn('t = 2.95', 2.95, redraw, () => stat = 2.95),
      presetBtn('t = 3.11', 3.11, redraw, () => stat = 3.11)
    ]));

    // the words, on demand (step-by-step mode A lives here, never forced)
    const terms = ['testStatistic', 'criticalValue', 'nullHypothesis', 'alpha', 'statSignificance'];
    view.appendChild(UI.stuck(terms.map(t => UI.teachCard(Content.VOCAB[t])),
      'Stuck? What do "test statistic", "critical value" and "p-value" mean?'));

    view.appendChild(el('details.stuck', {}, [
      el('summary.stuck-summary', { html: '<span class="stuck-icon">\uD83D\uDD0E</span> Why doesn\u2019t t = 2.52 give exactly p = 0.022 like the slide?' }),
      el('div.stuck-body', {}, [ el('p.table-note', { html:
        'The live p-value is computed from the distribution you pick, so for the APGAR statistic ' +
        '(t = 2.52) it reads ~0.018 under a plain t with these df. The lecture quotes 0.022 because ' +
        'the APGAR example used an unequal-variance (Welch) t-test with fewer effective degrees of ' +
        'freedom. Either way it is &lt; 0.05 \u2014 same conclusion: reject H\u2080, statistically significant.' }) ])
    ]));

    // easy + hard questions
    view.appendChild(el('h3.section-divider', { text: 'Quick check' }));
    view.appendChild(UI.mcq({
      moduleId: id, level: 'easy', category: 'significance-pvalue',
      stem: 'You drag the test statistic from 1.0 out toward 3.0. The p-value\u2026',
      choices: [
        { text: 'gets smaller', correct: true, why: 'Farther into the tail = more extreme = smaller p = stronger evidence against H\u2080.' },
        { text: 'gets larger', why: 'Moving outward makes the result rarer under H\u2080, so p falls.' },
        { text: 'stays at 0.05', why: '0.05 is the threshold set by \u03b1, not the live p-value.' }
      ]
    }));
    view.appendChild(UI.mcq({
      moduleId: id, level: 'hard', category: 'significance-pvalue',
      stem: 'With n = 30 (df = 29), the t critical value is about 2.05, but the standard-normal critical value is 1.96. Dragging to a statistic of 2.00 would be\u2026',
      choices: [
        { text: 'significant under the normal (2.00 &gt; 1.96) but not under this t (2.00 &lt; ~2.05)', correct: true,
          why: 't critical values are a bit larger than 1.96, so a borderline statistic can clear the normal cutoff yet miss the t cutoff. Try it on the curve.' },
        { text: 'significant under both', why: 'Under the t with df 29 the cutoff (~2.05) is just above 2.00, so it is not significant there.' },
        { text: 'never significant under either', why: '2.00 exceeds the normal\u2019s 1.96, so it IS significant under the normal.' }
      ]
    }));

    function redraw() { draw(canvas, readout); }
    redraw();
  }

  function presetBtn(label, value, redraw, setter) {
    return el('button.preset-btn', { type: 'button', onclick: () => { setter(); redraw(); } }, label);
  }

  function draw(canvas, readout) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);

    const crit = useNormal ? 1.96 : StatsMath.tCritical(df, 0.05);
    const pdf = (x) => useNormal ? StatsMath.normalPdf(x) : StatsMath.tPdf(x, df);
    const peak = pdf(0);

    const xPix = (x) => PAD + ((x - XMIN) / (XMAX - XMIN)) * (W - 2 * PAD);
    const yPix = (y) => (H - PAD) - (y / peak) * (H - 2 * PAD);

    // shaded rejection regions (both tails, |x| >= crit)
    shadeTail(ctx, pdf, xPix, yPix, crit, XMAX, 'rgba(220,80,80,0.28)');
    shadeTail(ctx, pdf, xPix, yPix, XMIN, -crit, 'rgba(220,80,80,0.28)');

    // the curve
    ctx.beginPath();
    for (let i = 0; i <= 300; i++) {
      const x = XMIN + (i / 300) * (XMAX - XMIN);
      const px = xPix(x), py = yPix(pdf(x));
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = '#2b3a67';
    ctx.lineWidth = 2;
    ctx.stroke();

    // baseline
    ctx.beginPath();
    ctx.moveTo(PAD, H - PAD); ctx.lineTo(W - PAD, H - PAD);
    ctx.strokeStyle = '#99a';
    ctx.lineWidth = 1;
    ctx.stroke();

    // critical lines
    drawVLine(ctx, xPix(crit), yPix, pdf(crit), '#c85050', 'crit +' + crit.toFixed(2));
    drawVLine(ctx, xPix(-crit), yPix, pdf(crit), '#c85050', 'crit \u2212' + crit.toFixed(2));

    // the draggable statistic
    const sx = xPix(stat);
    ctx.beginPath();
    ctx.moveTo(sx, yPix(0)); ctx.lineTo(sx, yPix(pdf(stat)));
    ctx.strokeStyle = '#1c7c54';
    ctx.lineWidth = 3;
    ctx.stroke();
    // handle
    ctx.beginPath();
    ctx.arc(sx, yPix(pdf(stat)), 7, 0, Math.PI * 2);
    ctx.fillStyle = '#1c7c54';
    ctx.fill();

    // axis ticks
    ctx.fillStyle = '#556';
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    for (let t = XMIN; t <= XMAX; t++) {
      ctx.fillText(String(t), xPix(t), H - PAD + 14);
    }

    // readout
    const p = useNormal
      ? StatsMath.twoTailedP_normal(stat)
      : StatsMath.twoTailedP_t(stat, df);
    const inReject = Math.abs(stat) >= crit;

    UI.clear(readout);
    readout.appendChild(el('div.readout-row', {}, [
      chip('Test statistic', stat.toFixed(2)),
      chip('Critical value', '\u00b1' + crit.toFixed(2)),
      chip('Two-tailed p-value', p < 0.0001 ? '< 0.0001' : p.toFixed(4)),
      chip(useNormal ? 'Distribution' : 'df', useNormal ? 'standard normal' : String(df))
    ]));
    readout.appendChild(el('div.verdict.' + (inReject ? 'verdict-sig' : 'verdict-notsig'), {},
      inReject
        ? el('span', { html: '|statistic| \u2265 critical value \u2192 it is in the <strong>rejection region</strong>. ' +
            'Reject H\u2080 \u2014 <strong>statistically significant</strong> (p &lt; 0.05).' })
        : el('span', { html: '|statistic| &lt; critical value \u2192 it is in the "do not reject" middle. ' +
            '<strong>Fail to reject H\u2080</strong> \u2014 not statistically significant (p &gt; 0.05).' })
    ));

    // reactive coaching -- speaks to what the learner just did
    if (coachRef) {
      const absS = Math.abs(stat);
      if (absS < crit - 0.4) {
        coachRef.say('You\u2019re near the middle \u2014 a result like this is <strong>common</strong> if nothing is going on. ' +
          'p = ' + fmtP(p) + ', well above 0.05. Keep dragging outward\u2026', 'notsig');
      } else if (absS < crit) {
        coachRef.say('So close! You\u2019re just <em>inside</em> the critical value \u00b1' + crit.toFixed(2) +
          '. Nudge a touch further into the red and it flips to significant.', 'edge');
      } else if (absS < crit + 0.7) {
        coachRef.say('You crossed into the <strong>red rejection zone</strong>. p just dropped to ' + fmtP(p) +
          ' (&lt; 0.05) \u2192 <strong>significant</strong>. That red tail is only 2.5% of the curve \u2014 a rare result if H\u2080 were true.', 'sig');
      } else {
        coachRef.say('Way out in the tail now \u2014 p = ' + fmtP(p) + '. The farther out you drag, ' +
          'the <strong>smaller p gets</strong> and the stronger the evidence against "nothing is going on."', 'sig');
      }
    }
  }

  function fmtP(p) { return p < 0.0001 ? '&lt; 0.0001' : p.toFixed(4); }

  // tiny helper used above (defined after to keep draw readable)
  function chip(label, value) {
    return el('span.chip', {}, [
      el('span.chip-label', { text: label }),
      el('span.chip-value', { text: value })
    ]);
  }

  function shadeTail(ctx, pdf, xPix, yPix, from, to, fill) {
    if (from >= to) return;
    ctx.beginPath();
    ctx.moveTo(xPix(from), yPix(0));
    for (let i = 0; i <= 100; i++) {
      const x = from + (i / 100) * (to - from);
      ctx.lineTo(xPix(x), yPix(pdf(x)));
    }
    ctx.lineTo(xPix(to), yPix(0));
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  }

  function drawVLine(ctx, px, yPix, topY, color, label) {
    ctx.beginPath();
    ctx.moveTo(px, yPix(0)); ctx.lineTo(px, yPix(topY));
    ctx.strokeStyle = color;
    ctx.setLineDash([4, 3]);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = color;
    ctx.font = '10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, px, yPix(0) + 26);
  }

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  return { id, title: 'Significance Playground', icon: '\uD83D\uDCC9', render };
})();
