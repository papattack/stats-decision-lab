/* ============================================================
   modules/map.js
   The central "statistics map". Click any test to trace the
   five-stage flow:
   question/data in -> test -> result out -> significance -> clinical read
   Teaches the vocabulary a result depends on BEFORE showing it.
   ============================================================ */

const MapModule = (() => {
  const id = 'map';
  const el = UI.el;

  function render(view) {
    UI.clear(view);

    view.appendChild(el('div.module-head', {}, [
      el('h2', { text: 'The Statistics Map' }),
      el('p.lede', { html:
        'This is the one connected system the whole course is about. ' +
        'Pick a test to trace it through five stages: ' +
        '<strong>question/data goes in \u2192 the test runs \u2192 a result comes out \u2192 ' +
        'you judge significance \u2192 you interpret it for a real patient.</strong>' })
    ]));

    const layout = el('div.map-layout', {}, []);

    // left: the five-stage legend (always visible, the "spine")
    const stages = [
      ['1', 'Question / data type', 'What are you asking, and is the data continuous, categorical, binary, or time-to-event?'],
      ['2', 'Statistical test', 'The method matched to that question + data.'],
      ['3', 'Result produced', 'The number the test outputs (a difference, r, a coefficient, OR, HR\u2026).'],
      ['4', 'Judge significance', 'p &lt; 0.05? Does the 95% CI exclude the no-effect value (0 for differences, 1 for ratios)?'],
      ['5', 'Clinical interpretation', 'What it means for actual patients.']
    ];
    const spine = el('div.map-spine', {}, [
      el('h3', { text: 'The five stages' }),
      ...stages.map(([n, t, d]) =>
        el('div.spine-stage', {}, [
          el('span.spine-num', { text: n }),
          el('div', {}, [ el('strong', { text: t }), el('p', { html: d }) ])
        ])
      )
    ]);

    // right: the clickable test grid
    const grid = el('div.map-grid', {},
      Object.values(Content.TESTS).map(t =>
        el('button.map-node', {
          type: 'button',
          'data-test': t.key,
          onclick: () => openTest(view, t.key)
        }, [
          el('span.map-node-name', { text: t.name }),
          el('span.map-node-tag', { text: t.tagline })
        ])
      )
    );

    layout.appendChild(spine);
    layout.appendChild(el('div.map-right', {}, [
      el('p.map-hint', { text: 'Click a test \u2193' }),
      grid,
      el('div#map-detail.map-detail', {}, [
        el('p.map-placeholder', { text: 'Your traced flow will appear here.' })
      ])
    ]));

    view.appendChild(layout);
    Store.markTaught(id);
  }

  function openTest(view, key) {
    const t = Content.TESTS[key];
    const detail = view.querySelector('#map-detail');
    UI.clear(detail);

    // highlight active node
    view.querySelectorAll('.map-node').forEach(n =>
      n.classList.toggle('active', n.getAttribute('data-test') === key));

    // vocabulary this result depends on — taught first
    const vocabForResult = resultVocab(key);

    detail.appendChild(el('div.flow-title', {}, [
      el('h3', { text: t.name }),
      el('span.flow-sub', { text: t.tagline })
    ]));

    detail.appendChild(flowStage('1 \u00b7 Question / data in', [
      stageLine('Question', t.questionIn),
      stageLine('Data', t.dataIn)
    ]));

    detail.appendChild(flowStage('2 \u00b7 What the test does', [
      stageLine('', t.whatItDoes)
    ]));

    // teach the vocab BEFORE revealing the result
    if (vocabForResult) {
      detail.appendChild(el('div.pre-teach', {}, [
        el('p.pre-teach-note', { html:
          '<strong>First, the word you need.</strong> This test\u2019s result is a <em>' +
          vocabForResult.title + '</em> \u2014 learn it before you read the output:' }),
        UI.teachCard(vocabForResult)
      ]));
    }

    detail.appendChild(flowStage('3 \u00b7 Result produced', [
      stageLine('', t.resultOut)
    ]));

    detail.appendChild(flowStage('4 \u00b7 Judge significance', [
      stageLine('', sigText(t.sigRule))
    ]));

    detail.appendChild(flowStage('5 \u00b7 Clinical interpretation', [
      stageLine('', t.careAbout)
    ]));

    detail.appendChild(el('div.lecture-example', {}, [
      UI.badge('From the lecture', 'lecture'),
      el('p', { html: t.lectureExample })
    ]));

    detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function resultVocab(key) {
    switch (key) {
      case 'logreg': return Content.VOCAB.adjustedOR;
      case 'cox':    return Content.VOCAB.hazardRatio;
      case 'linreg': return Content.VOCAB.coefficient;
      case 'ttest':  return Content.VOCAB.testStatistic;
      default:       return null;
    }
  }

  function sigText(rule) {
    switch (rule) {
      case 'ratio':
        return 'This result is a <strong>ratio</strong>, so its "no effect" value is <strong>1</strong>. ' +
               'If the 95% CI contains 1, it is NOT statistically significant. p &lt; 0.05 means significant.';
      case 'difference':
        return 'This result is a <strong>difference</strong>, so its "no effect" value is <strong>0</strong>. ' +
               'If the 95% CI contains 0, it is NOT statistically significant. p &lt; 0.05 means significant.';
      case 'correlation':
        return 'r is judged by its p-value (p &lt; 0.05 = significant). Remember a significant r can still be <em>spurious</em> \u2014 correlation is not causation.';
      case 'chisq':
        return 'Judged by the p-value: if p &lt; 0.05 (equivalently \u03c7\u00b2 statistic &gt; critical value), reject independence \u2014 the variables are associated.';
      default:
        return 'Judge by p &lt; 0.05 and the 95% CI.';
    }
  }

  function flowStage(label, rows) {
    return el('div.flow-stage', {}, [
      el('div.flow-stage-label', { text: label }),
      el('div.flow-stage-body', {}, rows)
    ]);
  }
  function stageLine(label, html) {
    return el('div.flow-line', {}, [
      label ? el('span.flow-line-label', { text: label }) : null,
      el('span.flow-line-body', { html })
    ]);
  }

  return { id, title: 'Statistics Map', icon: '\uD83D\uDDFA\uFE0F', render };
})();
