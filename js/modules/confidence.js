/* ============================================================
   modules/confidence.js
   Module 4: Confidence-interval playground.
   Teach what a 95% CI is, then let the learner drag the two
   ends. For DIFFERENCES the "no effect" line sits at 0; for
   RATIOS (OR/RR/HR) it sits at 1. The app shows live whether
   the CI crosses that line and therefore whether it is
   statistically significant -- and WHY 0 and 1 are the no-effect
   values (numerator = denominator; difference = nothing).
   ============================================================ */

const ConfidenceModule = (() => {
  const id = 'confidence';
  const el = UI.el;
  let coachRef = null;

  const W = 640, H = 150, PAD = 46;
  let mode = 'difference';     // 'difference' | 'ratio'
  // interval state per mode (defaults from lecture examples)
  const state = {
    difference: { lo: 0.21, hi: 2.49, min: -3, max: 3 },     // APGAR CI (sig)
    ratio:      { lo: 1.20, hi: 2.63, min: 0.2, max: 4 }      // RVF herdsperson AOR (sig)
  };

  function render(view) {
    UI.clear(view);
    view.appendChild(el('div.module-head', {}, [
      el('h2', { text: '4 \u00b7 Confidence intervals \u2014 drag the bar' })
    ]));

    // DO FIRST
    view.appendChild(UI.prompt(
      '<strong>Grab either end of the blue bar and slide it.</strong> The red dashed line is the ' +
      '"no effect" line. Drag the bar so it <em>touches</em> that line, then pull it clear \u2014 ' +
      'watch the verdict flip.'));

    coachRef = UI.coach('Drag an end of the bar across the red line and I\u2019ll explain what changed\u2026');
    view.appendChild(coachRef.node);
    Store.markTaught(id);

    const modeRow = el('div.ci-mode-row', {}, [
      modeBtn('I\u2019m looking at a difference (means) \u2014 line at 0', 'difference'),
      modeBtn('I\u2019m looking at a ratio (OR / RR / HR) \u2014 line at 1', 'ratio')
    ]);
    view.appendChild(modeRow);

    const canvasWrap = el('div.canvas-wrap', {}, []);
    const canvas = el('canvas#ci-canvas', { width: W, height: H });
    canvas.style.touchAction = 'none';
    canvasWrap.appendChild(canvas);
    view.appendChild(canvasWrap);

    const readout = el('div#ci-readout.readout', {}, []);
    view.appendChild(readout);

    view.appendChild(el('div.preset-row', {}, [
      el('span.preset-label', { text: 'Lecture presets:' }),
      el('button.preset-btn', { type: 'button', onclick: () => {
        mode = 'difference'; state.difference.lo = 0.21; state.difference.hi = 2.49;
        syncModeButtons(modeRow); redraw();
      }}, 'APGAR diff (0.21, 2.49) \u2014 sig'),
      el('button.preset-btn', { type: 'button', onclick: () => {
        mode = 'difference'; state.difference.lo = -0.79; state.difference.hi = 1.49;
        syncModeButtons(modeRow); redraw();
      }}, 'APGAR diff (\u22120.79, 1.49) \u2014 not sig'),
      el('button.preset-btn', { type: 'button', onclick: () => {
        mode = 'ratio'; state.ratio.lo = 1.20; state.ratio.hi = 2.63;
        syncModeButtons(modeRow); redraw();
      }}, 'RVF AOR (1.20, 2.63) \u2014 sig'),
      el('button.preset-btn', { type: 'button', onclick: () => {
        mode = 'ratio'; state.ratio.lo = 0.85; state.ratio.hi = 1.49;
        syncModeButtons(modeRow); redraw();
      }}, 'OR (0.85, 1.49) \u2014 not sig')
    ]));

    // dragging logic: grab whichever endpoint is nearer
    let dragKey = null;
    const toVal = (clientX) => {
      const s = state[mode];
      const rect = canvas.getBoundingClientRect();
      const x = (clientX - rect.left) * (W / rect.width);
      const frac = (x - PAD) / (W - 2 * PAD);
      return clamp(s.min + frac * (s.max - s.min), s.min, s.max);
    };
    canvas.addEventListener('pointerdown', (e) => {
      const s = state[mode];
      const v = toVal(e.clientX);
      dragKey = Math.abs(v - s.lo) <= Math.abs(v - s.hi) ? 'lo' : 'hi';
      canvas.setPointerCapture(e.pointerId);
      applyDrag(v);
    });
    canvas.addEventListener('pointermove', (e) => { if (dragKey) applyDrag(toVal(e.clientX)); });
    canvas.addEventListener('pointerup', () => { dragKey = null; });

    function applyDrag(v) {
      const s = state[mode];
      if (dragKey === 'lo') s.lo = Math.min(v, s.hi - 0.02);
      else s.hi = Math.max(v, s.lo + 0.02);
      redraw();
    }

    // the "why", on demand
    view.appendChild(UI.stuck([
      UI.teachCard(Content.VOCAB.confidenceInterval),
      el('div.why-box', {}, [
        el('h4', { text: 'Why 0 and 1 are the "no effect" values' }),
        el('p', { html:
          'A <strong>difference</strong> is one number minus another. "No effect" means they\u2019re equal, ' +
          'so the difference is <strong>0</strong>. A CI for a difference that includes 0 \u2192 not significant.' }),
        el('p', { html:
          'A <strong>ratio</strong> (OR/RR/HR) is one number divided by another. "No effect" means they\u2019re equal, ' +
          'so the fraction is <strong>1</strong>. A CI for a ratio that includes 1 \u2192 not significant.' })
      ])
    ], 'Stuck? Why is the "no effect" line at 0 for differences but 1 for ratios?'));

    // questions
    view.appendChild(el('h3.section-divider', { text: 'Quick check' }));
    view.appendChild(UI.mcq({
      moduleId: id, level: 'easy', category: 'ci-difference',
      stem: 'A mean difference has 95% CI (\u22120.79, 1.49). Significant?',
      choices: [
        { text: 'No \u2014 it contains 0', correct: true, why: 'For a difference, a CI containing 0 means "no difference" is still plausible \u2192 not significant.' },
        { text: 'Yes \u2014 the upper end is positive', why: 'The sign of one endpoint doesn\u2019t decide it; crossing 0 does.' },
        { text: 'No \u2014 it contains 1', why: 'The "contains 1" rule is for ratios, not differences.' }
      ]
    }));
    view.appendChild(UI.mcq({
      moduleId: id, level: 'hard', category: 'ci-ratio',
      stem: 'Two results: a hazard ratio with 95% CI (0.80, 0.97), and an odds ratio with 95% CI (0.90, 1.10). Which is statistically significant?',
      choices: [
        { text: 'Only the HR (0.80, 0.97) \u2014 it excludes 1', correct: true,
          why: 'Ratios are judged against 1. (0.80, 0.97) excludes 1 \u2192 significant; (0.90, 1.10) includes 1 \u2192 not significant.' },
        { text: 'Only the OR (0.90, 1.10)', why: 'That CI contains 1, so it is NOT significant.' },
        { text: 'Both, because both are below or around 1', why: 'The OR interval straddles 1, so it fails the ratio rule.' }
      ]
    }));

    function redraw() { draw(canvas, readout); }
    syncModeButtons(modeRow);
    redraw();
  }

  function modeBtn(label, m) {
    return el('button.ci-mode-btn', {
      type: 'button', 'data-mode': m,
      onclick: (e) => {
        mode = m;
        syncModeButtons(e.target.closest('.ci-mode-row'));
        draw(document.getElementById('ci-canvas'), document.getElementById('ci-readout'));
      }
    }, label);
  }
  function syncModeButtons(row) {
    if (!row) return;
    row.querySelectorAll('.ci-mode-btn').forEach(b =>
      b.classList.toggle('active', b.getAttribute('data-mode') === mode));
  }

  function draw(canvas, readout) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    const s = state[mode];
    const noEffect = mode === 'ratio' ? 1 : 0;
    const yMid = H / 2;

    const xPix = (v) => PAD + ((v - s.min) / (s.max - s.min)) * (W - 2 * PAD);

    // axis
    ctx.strokeStyle = '#bbc';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(PAD, yMid); ctx.lineTo(W - PAD, yMid); ctx.stroke();

    // ticks
    ctx.fillStyle = '#556';
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    const ticks = mode === 'ratio' ? [0.5, 1, 1.5, 2, 2.5, 3, 3.5] : [-3,-2,-1,0,1,2,3];
    ticks.forEach(t => {
      if (t < s.min || t > s.max) return;
      ctx.strokeStyle = '#dde';
      ctx.beginPath(); ctx.moveTo(xPix(t), yMid - 5); ctx.lineTo(xPix(t), yMid + 5); ctx.stroke();
      ctx.fillText(String(t), xPix(t), yMid + 22);
    });

    // no-effect line
    const nx = xPix(noEffect);
    ctx.strokeStyle = '#c85050';
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(nx, 14); ctx.lineTo(nx, H - 14); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#c85050';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillText('no effect = ' + noEffect, nx, 12);

    // the interval bar
    const lx = xPix(s.lo), hx = xPix(s.hi);
    const crosses = s.lo <= noEffect && s.hi >= noEffect;
    const barColor = crosses ? '#c58b00' : '#1c7c54';
    ctx.strokeStyle = barColor;
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(lx, yMid); ctx.lineTo(hx, yMid); ctx.stroke();
    // whisker caps
    [lx, hx].forEach(px => {
      ctx.beginPath(); ctx.moveTo(px, yMid - 10); ctx.lineTo(px, yMid + 10); ctx.stroke();
    });
    // point estimate (midpoint for display)
    const mid = (s.lo + s.hi) / 2;
    ctx.beginPath(); ctx.arc(xPix(mid), yMid, 6, 0, Math.PI * 2);
    ctx.fillStyle = barColor; ctx.fill();

    // readout
    UI.clear(readout);
    readout.appendChild(el('div.readout-row', {}, [
      el('span.chip', {}, [ el('span.chip-label', { text: 'Lower' }), el('span.chip-value', { text: s.lo.toFixed(2) }) ]),
      el('span.chip', {}, [ el('span.chip-label', { text: 'Upper' }), el('span.chip-value', { text: s.hi.toFixed(2) }) ]),
      el('span.chip', {}, [ el('span.chip-label', { text: 'No-effect value' }), el('span.chip-value', { text: String(noEffect) }) ])
    ]));
    readout.appendChild(el('div.verdict.' + (crosses ? 'verdict-notsig' : 'verdict-sig'), {},
      crosses
        ? el('span', { html: 'The interval <strong>crosses ' + noEffect + '</strong>, the "no effect" value \u2192 ' +
            '<strong>not statistically significant</strong>. "No ' +
            (mode === 'ratio' ? 'association' : 'difference') + '" is still plausible.' })
        : el('span', { html: 'The interval <strong>excludes ' + noEffect + '</strong> \u2192 ' +
            '<strong>statistically significant</strong>. We can reject the "no effect" hypothesis.' })
    ));

    if (coachRef) {
      const thing = mode === 'ratio' ? 'ratio' : 'difference';
      const noEff = mode === 'ratio' ? 'no association (the groups\u2019 odds/risk are equal)' : 'no difference between the groups';
      if (crosses) {
        coachRef.say('Your bar is <strong>sitting on top of ' + noEffect + '</strong>. Since this is a ' + thing +
          ', ' + noEffect + ' means ' + noEff + ' \u2014 and that\u2019s still inside your range. ' +
          'So you <strong>can\u2019t rule it out</strong>: not significant. Pull an end clear of the line to flip it.', 'notsig');
      } else {
        coachRef.say('Nice \u2014 your whole bar is <strong>off ' + noEffect + '</strong>. ' + capitalize(noEff) +
          ' is no longer plausible, so this is <strong>statistically significant</strong>. ' +
          'Drag it back over the line to see it flip the other way.', 'sig');
      }
    }
  }

  function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  return { id, title: 'Confidence Intervals', icon: '\uD83D\uDCCF', render };
})();
