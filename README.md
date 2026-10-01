# Stats Decision Lab — EBR I (PAS 6097)

An interactive, self-contained web app for learning the statistics in Dr. Charles
Saunders' EBR I lectures. No installation, no server, no internet required — it's
plain HTML + CSS + vanilla JavaScript.

## How to open it

**Easiest:** double-click `index.html` to open it in any modern browser
(Chrome, Edge, Firefox, Safari). Everything runs locally.

That's it. Your progress (what you've explored and your exam accuracy by concept)
is saved in your browser's local storage, so it's there when you come back. Use the
**Reset progress** button in the top-right to start fresh.

## What's inside

A central **Statistics Map** plus eight modules, each following the same sequence:
**teach it simply → show it visually → let you manipulate it → one easy question →
one harder application question.**

1. **Statistics Map** — click any test to trace the five-stage flow:
   question/data in → test → result out → judge significance → clinical interpretation.
2. **Choose the Test** — learn each test, then match tests to research scenarios.
3. **Significance Playground** — drag a test statistic on a t/normal curve; watch the
   p-value and shaded rejection regions respond.
4. **Confidence Intervals** — drag the ends of a 95% CI; see why crossing **0**
   (differences) or **1** (ratios) means "not significant."
5. **Risk Calculator** — an editable 2×2 table computing AR, ARR, RR, RRR, OR, NNT
   live, each explained in real patients.
6. **Regression Interpreter** — read journal-style tables and click the exact number
   you should interpret.
7. **Errors & Power** — Type I/II errors and power via a diagnostic-test story, with
   sample-size and effect-size sliders driving a live power curve.
8. **Exam Mode** — adaptive multiple-choice that tracks which concept categories you
   miss and leans future questions toward them.

## A note on fidelity to the lectures

Every number, rule, and example is taken from the lectures so nothing contradicts the
course: α = 0.05 two-tailed, standard-normal critical values ±1.96, the APGAR t-test
(t = 2.52 vs 2.14), the heparin risk numbers (ARR 31.3 pp, RR 28.5%, RRR 71.5%,
NNT 3.2), the Rift Valley fever adjusted OR 1.77 (95% CI 1.20–2.63), the breast-cancer
insurance ORs with "Insured" as the reference group, the CVD OR 2.71 / RR 2.19, and
the rules "CI contains 0 → not significant (differences); CI contains 1 → not
significant (ratios)" and "hazard ratios imply risk, odds ratios imply likelihood."

One small discrepancy is noted inside the app: in the Significance Playground the live
p-value for the APGAR statistic reads ~0.018 under a plain t with those degrees of
freedom, while the lecture quotes 0.022 (it used an unequal-variance / Welch t-test).
Both are < 0.05, so the conclusion is identical.

## File layout

```
stats-decision-lab/
├─ index.html            entry point (open this)
├─ css/styles.css        all styling
└─ js/
   ├─ stats-math.js      normal/t distributions, p-values, power (pure JS)
   ├─ store.js           progress + weakness tracking (localStorage)
   ├─ ui.js              DOM helpers, teach-cards, MCQ widget
   ├─ content.js         single source of truth for all lecture content
   ├─ app.js             tab bar + routing
   └─ modules/           the eight learning modules
```
