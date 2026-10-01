/* ============================================================
   ui.js
   Small DOM helpers + reusable widgets used by every module:
   - el(): terse element builder
   - teachCard(): the "teach it simply" progressive-disclosure block
   - mcq(): a multiple-choice question with feedback + explanation
   - sequenceFooter(): the teach→visual→manipulate→Q progress strip
   ============================================================ */

const UI = (() => {

  /* terse hyperscript-ish builder:
     el('div.card#id', {attrs}, [children | strings]) */
  function el(spec, attrs, children) {
    let tag = 'div', id = null;
    const classes = [];
    spec.replace(/([.#]?[^.#]+)/g, (m) => {
      if (m[0] === '.') classes.push(m.slice(1));
      else if (m[0] === '#') id = m.slice(1);
      else tag = m;
    });
    const node = document.createElement(tag);
    if (id) node.id = id;
    if (classes.length) node.className = classes.join(' ');
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (k === 'html') node.innerHTML = v;
        else if (k === 'text') node.textContent = v;
        else if (k.startsWith('on') && typeof v === 'function') {
          node.addEventListener(k.slice(2).toLowerCase(), v);
        } else if (v !== null && v !== undefined && v !== false) {
          node.setAttribute(k, v);
        }
      }
    }
    appendChildren(node, children);
    return node;
  }

  function appendChildren(node, children) {
    if (children === null || children === undefined) return;
    if (!Array.isArray(children)) children = [children];
    for (const c of children) {
      if (c === null || c === undefined || c === false) continue;
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
  }

  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

  /* "Teach it simply" card with four plain-English slots and an
     optional "go deeper" progressive-disclosure panel. */
  function teachCard({ title, what, why, solves, exam, deeper }) {
    const deeperPanel = deeper
      ? el('details.deeper', {}, [
          el('summary', { text: 'Show me the deeper explanation' }),
          el('div.deeper-body', { html: deeper })
        ])
      : null;

    return el('section.teach-card', {}, [
      el('h3', { text: title }),
      el('div.teach-grid', {}, [
        teachRow('What it is', what),
        teachRow('Why it exists', why),
        teachRow('What problem it solves', solves),
        teachRow('What to recognize on the exam', exam, true)
      ]),
      deeperPanel
    ]);
  }

  function teachRow(label, body, isExam) {
    return el('div.teach-row' + (isExam ? '.exam-row' : ''), {}, [
      el('span.teach-label', { text: label }),
      el('span.teach-body', { html: body })
    ]);
  }

  /* Multiple-choice question.
     opts: { id, moduleId, level ('easy'|'hard'), category, stem, choices:[{text,correct,why}] }
     onResolved(correct) fires after the learner locks an answer. */
  function mcq(opts, onResolved) {
    const wrap = el('div.mcq', {}, []);
    const stem = el('p.mcq-stem', { html: opts.stem });
    const list = el('div.mcq-choices', {}, []);
    let locked = false;

    opts.choices.forEach((choice, i) => {
      const btn = el('button.mcq-choice', {
        type: 'button',
        onclick: () => {
          if (locked) return;
          locked = true;
          resolve(choice, btn);
        }
      }, [ el('span.mcq-key', { text: String.fromCharCode(65 + i) }), document.createTextNode(' ' + choice.text) ]);
      list.appendChild(btn);
    });

    const feedback = el('div.mcq-feedback', {}, []);

    function resolve(choice, btn) {
      const correct = !!choice.correct;
      // paint all choices
      [...list.children].forEach((b, i) => {
        b.classList.add('resolved');
        if (opts.choices[i].correct) b.classList.add('is-correct');
      });
      btn.classList.add(correct ? 'picked-correct' : 'picked-wrong');

      feedback.className = 'mcq-feedback ' + (correct ? 'ok' : 'bad');
      feedback.innerHTML =
        (correct ? '<strong>Correct.</strong> ' : '<strong>Not quite.</strong> ') +
        (choice.why || '');

      // if the learner was wrong, also show why the correct one is right
      if (!correct) {
        const right = opts.choices.find(c => c.correct);
        if (right && right.why) {
          feedback.innerHTML += '<br><span class="mcq-right-why"><strong>Correct answer:</strong> ' +
            right.why + '</span>';
        }
      }

      if (opts.moduleId && opts.level) Store.markQuiz(opts.moduleId, opts.level, correct);
      if (opts.category) Store.recordAnswer(opts.category, correct);
      if (onResolved) onResolved(correct);
    }

    wrap.appendChild(stem);
    wrap.appendChild(list);
    wrap.appendChild(feedback);
    return wrap;
  }

  /* Progress strip shown at the bottom of a module. steps is an
     array of {label, done:boolean}. */
  function sequenceStrip(steps) {
    return el('div.seq-strip', {},
      steps.map((s, i) =>
        el('span.seq-step' + (s.done ? '.done' : ''), {}, [
          el('span.seq-dot', { text: s.done ? '✓' : (i + 1) }),
          el('span.seq-text', { text: s.label })
        ])
      )
    );
  }

  function badge(text, kind) {
    return el('span.badge.badge-' + (kind || 'info'), { text });
  }

  return { el, clear, teachCard, mcq, sequenceStrip, badge, appendChildren };
})();
