/* ============================================================
   content.js
   SINGLE SOURCE OF TRUTH for everything the app teaches.
   Every number, rule, and example here is taken from Dr. Saunders'
   EBR I lectures so nothing contradicts the course. Slide
   references are noted in comments (L# = lecture number).

   Terminology rules this app follows (straight from the slides):
   - alpha = 0.05, two-tailed; alpha/2 = 0.025 in each tail  (L4)
   - standard normal critical values are fixed at ±1.96        (L4)
   - t critical values are larger than 1.96 and shrink toward
     1.96 as sample size grows                                 (L4)
   - DIFFERENCE/mean results: 95% CI containing 0 => NOT sig    (L5)
   - RATIO results (OR/RR/HR): 95% CI containing 1 => NOT sig   (L5)
   - p < 0.05 => statistically significant; p > 0.05 => not     (L4)
   - logistic regression coefficients ARE odds ratios (AOR)     (L5)
   - Cox proportional hazards coefficients ARE hazard ratios    (L5)
   - "hazard ratios imply risk, odds ratios imply likelihood"   (L5)
   - reference category always has OR = 1                       (L5)
   ============================================================ */

const Content = (() => {

  /* ---------- The eight statistical tests on the map ---------- */
  /* Each models the 5-stage flow:
     question/data in -> test -> result out -> significance -> clinical read */
  const TESTS = {
    ttest: {
      key: 'ttest',
      name: 't-test',
      tagline: 'Compare the means of two groups',
      questionIn: 'Is the <em>average</em> of a continuous measure different between two groups?',
      dataIn: 'One continuous outcome (e.g. weight, APGAR score, age) + a variable splitting subjects into two groups.',
      whatItDoes: 'Builds a test statistic from the difference in the two group means divided by the standard error, then places it on a t-distribution.',
      resultOut: 'A <strong>t-statistic</strong> (and the mean difference, the "effect size"), with a p-value and 95% CI.',
      careAbout: 'The mean difference, its p-value / 95% CI. The t-test is the <strong>most common test in the medical literature</strong>.',
      sigRule: 'difference',  // CI containing 0 => not significant
      lectureExample: 'APGAR scores: mothers who do not smoke mean 7.35 vs smokers 6.00, difference 1.35. t = 2.52 &gt; critical 2.14, p = 0.022, 95% CI (0.21, 2.49) — significant.'
    },
    chisq: {
      key: 'chisq',
      name: 'Chi-square test',
      tagline: 'Are two categorical variables associated?',
      questionIn: 'Are two <em>categorical</em> variables independent, or is there an association between them?',
      dataIn: 'Two categorical variables (each with 2+ categories), arranged in a contingency table.',
      whatItDoes: 'The Chi-Square Test of Independence compares observed counts to what you\u2019d expect if the variables were unrelated.',
      resultOut: 'A <strong>chi-square (\u03c7\u00b2) statistic</strong> with a p-value (there is no single "effect ratio" like OR here).',
      careAbout: 'Whether the p-value shows a statistically significant association. Second most common test after the t-test.',
      sigRule: 'chisq',
      lectureExample: 'Residence vs HIV status: \u03c7\u00b2 = 20.60 &gt; critical 10.59, p &lt; 0.005 — reject independence; the two are associated.'
    },
    correlation: {
      key: 'correlation',
      name: 'Correlation (Pearson r)',
      tagline: 'Direction & strength of a linear link between two continuous variables',
      questionIn: 'Do two continuous variables move together, and how strongly / in what direction?',
      dataIn: 'Two continuous, roughly normally distributed variables (a bivariate relationship).',
      whatItDoes: 'Estimates r, between \u22121 and +1. Sign = direction; magnitude = strength of the <em>linear</em> association.',
      resultOut: 'A correlation coefficient <strong>r</strong> (\u22121 \u2264 r \u2264 1) with a p-value.',
      careAbout: 'Sign and size of r. Remember: correlation is NOT causation, and spurious correlations are common. Many analysts distrust r &lt; 0.90.',
      sigRule: 'correlation',
      lectureExample: 'The "Stevie" baby-name vs Lululemon stock example: r = 0.981, p < 0.01 — statistically significant yet completely spurious.'
    },
    linreg: {
      key: 'linreg',
      name: 'Linear regression',
      tagline: 'Effect of predictors on a continuous outcome',
      questionIn: 'How does a <em>continuous</em> outcome change as one or more predictors change (holding the others constant)?',
      dataIn: 'One continuous dependent variable (Y) + one or more independent variables (the X\u2019s).',
      whatItDoes: 'Fits Y = b\u2080 + b\u2081X\u2081 + b\u2082X\u2082 + \u2026 . Each coefficient b is the effect of a one-unit increase in that X on Y.',
      resultOut: 'A <strong>coefficient (b)</strong> for each predictor, each with a p-value.',
      careAbout: 'The sign, magnitude, and significance of each coefficient. (We ignore the intercept.)',
      sigRule: 'difference',
      lectureExample: 'Infant weight on age + mother smokes: age b = 109.26 g/week (p = 0.001); mother smokes b = \u2212700.07 g (p = 0.001) \u2014 smoking lowers weight ~700 g.'
    },
    logreg: {
      key: 'logreg',
      name: 'Logistic regression',
      tagline: 'Effect of predictors on a yes/no outcome \u2192 adjusted odds ratios',
      questionIn: 'How do predictors change the odds of a <em>binary</em> (0/1) outcome, adjusting for the other variables?',
      dataIn: 'One dichotomous outcome (event = 1 / no event = 0) + one or more independent variables.',
      whatItDoes: 'Like linear regression, but the coefficients ARE odds ratios. Because it accounts for all variables at once, these are <strong>Adjusted Odds Ratios (AOR)</strong>.',
      resultOut: 'An <strong>Adjusted Odds Ratio</strong> for each predictor, with a 95% CI and p-value.',
      careAbout: 'The AOR vs 1, and whether its CI contains 1. Each categorical predictor has a reference category (OR = 1).',
      sigRule: 'ratio',   // CI containing 1 => not significant
      lectureExample: 'Rift Valley fever: adjusted OR for herdsperson 1.77 (95% CI 1.20\u20132.63) \u2014 ~77% more likely, significant because the CI excludes 1.'
    },
    cox: {
      key: 'cox',
      name: 'Cox proportional hazards',
      tagline: 'Time-to-event predictors \u2192 hazard ratios',
      questionIn: 'How do risk factors change the <em>rate at which an event happens over time</em> (death, readmission, relapse\u2026)?',
      dataIn: 'A time-to-event outcome + one or more risk factors / exposures.',
      whatItDoes: 'Survival-analysis regression. Like logistic, but the coefficients are <strong>Hazard Ratios (HR)</strong> instead of odds ratios.',
      resultOut: 'A <strong>Hazard Ratio</strong> for each factor, with a 95% CI and p-value.',
      careAbout: 'HR vs 1 (HR&gt;1 more at risk over time, HR&lt;1 less, HR=1 equal). CI containing 1 => not significant. Hazard ratios imply <em>risk</em>; odds ratios imply <em>likelihood</em>.',
      sigRule: 'ratio',
      lectureExample: 'Post-acute-care readmission: patients on IV meds HR 1.63 (95% CI 1.39\u20131.92) \u2014 63% more at risk of 30-day readmission, significant.'
    },
    did: {
      key: 'did',
      name: 'Difference-in-differences',
      tagline: 'Policy / natural-experiment effect from observational data',
      questionIn: 'Did a policy or program change an outcome, comparing an affected group to a control over before vs after?',
      dataIn: 'Two groups (intervention vs control) and two time periods (before vs after). Observational, not randomized.',
      whatItDoes: 'Uses multivariable linear regression to isolate the extra change in the intervention group beyond the control group\u2019s trend.',
      resultOut: 'A <strong>DiD estimate</strong> (a difference), with a p-value / 95% CI.',
      careAbout: 'The adjusted DiD effect and its significance. Because it is a difference, a 95% CI containing 0 means not significant.',
      sigRule: 'difference',
      lectureExample: 'ACA Medicaid expansion as a "natural experiment": compare states that expanded (intervention) vs those that did not (control), before vs after.'
    }
  };

  /* ---------- Vocabulary teach-cards (plain-English, 4 slots) ---------- */
  const VOCAB = {
    categorical: {
      title: 'Categorical variable',
      what: 'A variable whose values are <em>labels/categories</em>, not measured numbers \u2014 e.g. urban/rural, blood type, cancer stage.',
      why: 'Lots of medical data is "which group are you in?" rather than "how much?".',
      solves: 'Lets us count people per category and test whether categories are related.',
      exam: 'If a variable sorts people into buckets (2, 3, or more), it is categorical. A 2-category one (urban/rural) is <strong>binary / dichotomous</strong>.'
    },
    oddsRatio: {
      title: 'Odds ratio (OR)',
      what: 'A ratio comparing the <em>odds</em> of an outcome in one group to the odds in another.',
      why: 'Odds and odds ratios fall naturally out of case-control studies and logistic regression.',
      solves: 'Summarizes "how many times more likely" an outcome is with a risk factor than without.',
      exam: 'OR = 1 means no association. OR &gt; 1 more likely, OR &lt; 1 less likely. A 95% CI that <strong>contains 1</strong> = not statistically significant.',
      deeper: 'An OR between 1 and 2 can be read as a percent: OR 1.56 \u2192 "56% more likely" (1.56 \u2212 1 = 0.56). An OR below 1 reads as a reduction: OR 0.80 \u2192 "20% less likely". But an OR of 2.56 is <em>not</em> "156% more likely" \u2014 say "about two-and-a-half times as likely" instead.'
    },
    adjustedOR: {
      title: 'Crude vs Adjusted odds ratio',
      what: 'A <em>crude</em> (unadjusted / bivariate) OR compares two variables alone. An <em>adjusted</em> OR (AOR) accounts for all the other variables in the model.',
      why: 'Other variables (covariances) distort a simple two-way comparison; adjusting removes that distortion.',
      solves: 'Gives the effect of one predictor <em>holding the others constant</em> \u2014 a more trustworthy estimate.',
      exam: 'Adjusted ORs always come from <strong>logistic regression</strong> and are usually what you interpret. The AOR will usually differ from the crude OR, sometimes a lot.'
    },
    hazardRatio: {
      title: 'Hazard ratio (HR)',
      what: 'The ratio of how often an event happens in one group vs another <em>over time</em>.',
      why: 'When the outcome is "time until an event" (death, readmission), you need a measure that respects time.',
      solves: 'Summarizes whether a group experiences the event faster/slower across the follow-up period.',
      exam: 'HR &gt; 1 = more at risk over time; HR = 1 = equal risk; HR &lt; 1 = less at risk. CI containing 1 = not significant. <strong>Hazard ratios imply risk; odds ratios imply likelihood.</strong>'
    },
    coefficient: {
      title: 'Coefficient (the b\u2019s)',
      what: 'In a regression model Y = b\u2080 + b\u2081X\u2081 + \u2026, each b is the effect of a one-unit increase in that X on the outcome.',
      why: 'A model is a simplified equation of the hypothesis; the b\u2019s are the numbers that answer "how much effect?".',
      solves: 'Turns a research question into a single interpretable number per predictor.',
      exam: 'We care about a coefficient\u2019s <strong>sign, magnitude, and p-value</strong>. In linear regression a b is a difference; in logistic it is an odds ratio; in Cox it is a hazard ratio. We ignore the intercept.'
    },
    dependentIndependent: {
      title: 'Dependent vs independent variable',
      what: 'The <em>dependent</em> variable (Y) is the outcome "of interest". The <em>independent</em> variables (the X\u2019s) are the predictors.',
      why: 'Regression asks what effect each X has on the single Y.',
      solves: 'Keeps clear what you are explaining (Y) and what you are explaining it with (X).',
      exam: 'There is one dependent variable per model; everything else is independent. "Model" just means that equation.'
    },
    referenceGroup: {
      title: 'Reference (referent) group',
      what: 'For a categorical predictor, one category is left out and used as the baseline; every other category\u2019s OR is relative to it.',
      why: 'You can only compare odds <em>to</em> something; the reference is that something.',
      solves: 'Makes each reported OR mean "compared to the reference category".',
      exam: 'The reference category <strong>always has OR = 1</strong>. e.g. in the breast-cancer study "Insured" is the reference, so Medicaid AOR 1.14 means 14% more likely than insured patients.'
    },
    nullHypothesis: {
      title: 'Null hypothesis (H\u2080)',
      what: 'The starting assumption of <em>no effect / no difference / no association</em> \u2014 often written as "difference = 0".',
      why: 'Hypothesis testing works by trying to reject this "nothing is going on" assumption.',
      solves: 'Gives a precise claim we can test the data against.',
      exam: 'We begin by assuming H\u2080 is true. The whole decision is: can we <strong>reject H\u2080</strong>, or do we <strong>fail to reject</strong> it? The alternative (H\u2090) is just its contradiction.'
    },
    testStatistic: {
      title: 'Test statistic',
      what: 'A single number computed from the sample (e.g. t = (x\u0304 \u2212 \u03bc\u2080) / standard error) used to decide between H\u2080 and H\u2090.',
      why: 'It "transforms" your data onto the x-axis of a known distribution so you can see how extreme it is.',
      solves: 'Converts a messy sample into one comparable value.',
      exam: 'A <strong>bigger</strong> test statistic sits farther in the tail = more extreme = more evidence against H\u2080 = smaller p-value.'
    },
    criticalValue: {
      title: 'Critical value & rejection region',
      what: 'The critical value marks where the tail "rejection region" begins. Land past it and you reject H\u2080.',
      why: 'alpha = 0.05 split two-tailed puts 2.5% in each tail; the critical values bound those tails.',
      solves: 'Turns "how extreme is extreme enough?" into a fixed cutoff.',
      exam: 'Standard normal critical values are fixed at <strong>\u00b11.96</strong>. t critical values are a bit larger and shrink toward 1.96 as the sample grows. If |test statistic| &gt; critical value \u2192 reject H\u2080.'
    },
    alpha: {
      title: 'Alpha (\u03b1) \u2014 significance level',
      what: 'The chance of being wrong you\u2019re willing to accept when you reject H\u2080. Convention: \u03b1 = 0.05 = 5%.',
      why: 'Fisher set 0.05 as a practical standard balancing rigor and feasibility.',
      solves: 'Fixes the size of the rejection region.',
      exam: 'Two-tailed, so \u03b1/2 = 0.025 in each tail. \u03b1 is also the probability of a <strong>Type I error</strong>.'
    },
    statSignificance: {
      title: 'Statistical significance',
      what: 'A result unlikely to have happened by chance alone \u2014 so a real pattern probably exists in the population.',
      why: 'Samples wobble; we need a rule for when an observed effect is more than noise.',
      solves: 'Separates "probably real" from "could easily be random".',
      exam: 'p &lt; 0.05 \u2192 significant. For a <strong>difference</strong>, a 95% CI excluding 0 \u2192 significant. For a <strong>ratio</strong> (OR/RR/HR), a 95% CI excluding 1 \u2192 significant. p-value and CI must always agree.'
    },
    pvalue: {
      title: 'p-value',
      what: 'The probability of getting a result at least as extreme as the one observed, <em>if H\u2080 were true</em>.',
      why: 'It\u2019s the most common way the literature reports significance (the other is the 95% CI).',
      solves: 'Gives one number for "how surprising is this under no-effect?".',
      exam: 'Smaller p = more evidence against H\u2080. p &lt; 0.05 = significant, p &gt; 0.05 = not. Every estimate (t, \u03c7\u00b2, r, each coefficient, OR, RR, HR\u2026) has a p-value, interpreted the same way.'
    },
    confidenceInterval: {
      title: '95% confidence interval (CI)',
      what: 'A range, built from the sample, that is likely to contain the true population value \u2014 a precision measure around the point estimate.',
      why: 'A single point estimate (like a mean difference of 1.35) says nothing about how precise it is.',
      solves: 'Shows both the plausible range and \u2014 via what it does/doesn\u2019t contain \u2014 significance.',
      exam: 'Formally: if we repeated the study 100 times, ~95 of the CIs would contain the true value. NOT "95% chance the truth is in this one interval." Narrow CI = precise; wide CI = uncertain.'
    },
    typeI: {
      title: 'Type I error (\u03b1)',
      what: 'Rejecting H\u2080 when H\u2080 is actually true \u2014 a <em>false positive</em>.',
      why: 'We can be fooled by an unrepresentative ("bad") sample.',
      solves: 'Naming it lets us cap its probability at \u03b1 = 0.05.',
      exam: 'Prob(Type I error) = \u03b1. Picture: a test tells a man "you\u2019re pregnant." Usually caused by a sampling error / bad sample.'
    },
    typeII: {
      title: 'Type II error (\u03b2) & power',
      what: 'Type II = failing to reject H\u2080 when it is actually false \u2014 a <em>false negative</em>. Power = 1 \u2212 \u03b2 = correctly detecting a real effect.',
      why: 'Small effects or small samples can hide a real difference.',
      solves: 'Power quantifies the chance you\u2019ll catch an effect that is really there.',
      exam: 'Prob(Type II) = \u03b2. Type II errors come mostly from <strong>small effect size</strong> or <strong>small sample size</strong>. Bigger effect or bigger n \u2192 more power.'
    },
    absoluteRisk: {
      title: 'Absolute risk (AR)',
      what: 'The plain probability of an event: people with the event \u00f7 people at risk.',
      why: 'The simplest, most honest way to state risk to a patient.',
      solves: 'Answers "what\u2019s my actual chance?" in one number.',
      exam: 'If 50 of 100 get sick, AR = 50%. Event rates EER = a/(a+b) and CER = c/(c+d) are absolute risks for each group.'
    },
    arr: {
      title: 'Absolute risk reduction (ARR)',
      what: 'The difference in event rates: ARR = CER \u2212 EER (control minus experimental).',
      why: 'Tells you the real-world size of a treatment\u2019s benefit, not just a relative percentage.',
      solves: 'Answers "how many fewer bad events per 100 patients?" \u2014 i.e. is it clinically meaningful.',
      exam: 'Reported in <strong>percentage points</strong>. Heparin example: 43.8% \u2212 12.5% = 31.3 percentage-point reduction. The literature prefers explaining risk with ARR.'
    },
    relativeRisk: {
      title: 'Relative risk (RR)',
      what: 'The ratio of event rates: RR = EER / CER.',
      why: 'Expresses risk in the treated group <em>relative to</em> the control group.',
      solves: 'Answers "what fraction of the control risk remains with treatment?".',
      exam: 'RR = 1 no difference; RR &gt; 1 more risk; RR &lt; 1 less risk. CI containing 1 = not significant. Beware: a big RR can hide a tiny absolute change (50%\u219225% and 2%\u21921% are both RR 0.5).'
    },
    rrr: {
      title: 'Relative risk reduction (RRR)',
      what: 'The percentage drop in risk vs control: RRR = 1 \u2212 RR.',
      why: 'A common (and persuasive) way to advertise a treatment effect.',
      solves: 'Answers "by what percent did treatment cut the risk, relative to control?".',
      exam: 'Heparin: 1 \u2212 0.285 = 71.5%. RRR looks impressive even when ARR is tiny \u2014 that\u2019s exactly why the course warns to pair it with ARR.'
    },
    nnt: {
      title: 'Number needed to treat (NNT)',
      what: 'How many patients must be treated for one to benefit: NNT = 1 / ARR.',
      why: 'Translates a risk reduction into a tangible count of patients.',
      solves: 'Answers "how much treatment buys one good outcome?".',
      exam: 'Heparin: 1 / 0.313 = 3.2. Lower NNT = more effective; ideal NNT = 1. NNT moves opposite to ARR.'
    }
  };

  /* ---------- Choose-the-test scenarios (grounded in lectures) ---------- */
  const SCENARIOS = [
    {
      id: 's-ttest',
      stem: 'Investigators compare the <strong>mean APGAR score</strong> of infants born to mothers who smoked vs mothers who did not. The outcome is a continuous score and there are exactly two groups.',
      answer: 'ttest',
      because: 'Two groups + one continuous outcome + comparing <em>means</em> \u2192 a t-test. (This is the exact APGAR example from Lecture 5.)',
      cues: ['continuous outcome (APGAR score)', 'exactly two groups', 'comparing averages']
    },
    {
      id: 's-chisq',
      stem: 'A study tabulates <strong>residence status (urban/rural)</strong> against <strong>HIV status (positive/negative)</strong> and asks whether the two are related.',
      answer: 'chisq',
      because: 'Two categorical variables, testing for association/independence \u2192 Chi-Square Test of Independence (the urban/rural \u00d7 HIV example).',
      cues: ['both variables categorical', 'question is association / independence', 'data is a contingency table']
    },
    {
      id: 's-logreg',
      stem: 'Researchers model the <strong>odds of acute Rift Valley fever (yes/no)</strong> from several exposures at once, and report an <strong>adjusted odds ratio</strong> for each.',
      answer: 'logreg',
      because: 'Binary outcome + several predictors + adjusted odds ratios \u2192 logistic regression. Its coefficients ARE odds ratios (AOR).',
      cues: ['binary 0/1 outcome', 'multiple predictors at once', 'result reported as adjusted odds ratios']
    },
    {
      id: 's-cox',
      stem: 'Using Medicare data, investigators relate risk factors to the <strong>time until 30-day hospital readmission</strong> and report <strong>hazard ratios</strong>.',
      answer: 'cox',
      because: 'Time-to-event outcome + risk factors + hazard ratios \u2192 Cox proportional hazards regression.',
      cues: ['outcome is time-to-event', 'result reported as hazard ratios', 'several risk factors']
    },
    {
      id: 's-linreg',
      stem: 'A model predicts infant <strong>weight in grams (continuous)</strong> from the infant\u2019s age and whether the mother smokes, reporting a coefficient for each.',
      answer: 'linreg',
      because: 'Continuous outcome + two or more predictors + coefficients (not odds ratios) \u2192 multiple linear regression.',
      cues: ['continuous outcome (grams)', 'two+ predictors', 'result reported as coefficients (b\u2019s)']
    },
    {
      id: 's-correlation',
      stem: 'An analyst wants a single number for the <strong>direction and strength of the linear relationship</strong> between two continuous, normally distributed variables.',
      answer: 'correlation',
      because: 'Two continuous variables + "direction and strength of a linear link" \u2192 Pearson correlation (r).',
      cues: ['two continuous variables', 'wants direction + strength', 'single bivariate relationship']
    },
    {
      id: 's-did',
      stem: 'To study the <strong>effect of a Medicaid expansion</strong>, researchers compare states that expanded vs those that did not, before vs after the policy \u2014 using observational data.',
      answer: 'did',
      because: 'Intervention vs control group, before vs after period, observational "natural experiment" \u2192 difference-in-differences.',
      cues: ['two groups: affected vs not', 'two periods: before vs after', 'observational policy change']
    }
  ];

  /* ---------- Exam-mode question bank, tagged by category ---------- */
  /* categories double as the weakness-tracking buckets */
  const EXAM_BANK = [
    {
      category: 'choosing-a-test',
      stem: 'A study asks whether <em>gender (male/female)</em> is associated with <em>readmission (yes/no)</em>, with no modeling of other variables \u2014 just the two categorical variables. Which test fits best?',
      choices: [
        { text: 'Chi-square test of independence', correct: true, why: 'Two categorical variables tested for association = chi-square.' },
        { text: 't-test', why: 'A t-test compares means of a continuous outcome, not two categorical variables.' },
        { text: 'Cox proportional hazards', why: 'Cox is for time-to-event data, not a simple categorical association.' },
        { text: 'Linear regression', why: 'Linear regression needs a continuous dependent variable.' }
      ]
    },
    {
      category: 'choosing-a-test',
      stem: 'Which result would come out of a <em>logistic</em> regression?',
      choices: [
        { text: 'An adjusted odds ratio', correct: true, why: 'Logistic regression coefficients ARE odds ratios (adjusted ORs).' },
        { text: 'A hazard ratio', why: 'Hazard ratios come from Cox proportional hazards regression.' },
        { text: 'A mean difference in grams', why: 'That is a linear-regression / t-test style result.' },
        { text: 'A correlation coefficient r', why: 'r comes from correlation analysis.' }
      ]
    },
    {
      category: 'significance-pvalue',
      stem: 'A coefficient has p = 0.03. At the usual 5% level, this result is\u2026',
      choices: [
        { text: 'Statistically significant', correct: true, why: 'p &lt; 0.05, so we reject H\u2080 \u2014 statistically significant.' },
        { text: 'Not statistically significant', why: '0.03 is below 0.05, so it IS significant.' },
        { text: 'Impossible to tell without the sample size', why: 'The p-value already encodes the significance decision at \u03b1 = 0.05.' },
        { text: 'Clinically significant by definition', why: 'Statistical significance does not guarantee clinical significance.' }
      ]
    },
    {
      category: 'significance-pvalue',
      stem: 'As a test statistic moves <em>farther into the tail</em> of the distribution, its associated p-value\u2026',
      choices: [
        { text: 'Gets smaller (more evidence against H\u2080)', correct: true, why: 'More extreme statistic = smaller p = stronger evidence against H\u2080.' },
        { text: 'Gets larger', why: 'It is the opposite \u2014 extreme statistics give small p-values.' },
        { text: 'Stays fixed at 0.05', why: '0.05 is the threshold, not the p-value itself.' },
        { text: 'Becomes negative', why: 'p-values are probabilities between 0 and 1.' }
      ]
    },
    {
      category: 'ci-difference',
      stem: 'A study reports a <em>mean difference</em> with 95% CI (\u22120.79, 1.49). Is it statistically significant?',
      choices: [
        { text: 'No \u2014 the interval contains 0', correct: true, why: 'For a difference, a 95% CI containing 0 means not statistically significant.' },
        { text: 'Yes \u2014 the point estimate is positive', why: 'Significance for a difference depends on whether the CI excludes 0, not the sign.' },
        { text: 'No \u2014 the interval contains 1', why: 'The "contains 1" rule is for ratios, not differences.' },
        { text: 'Cannot tell without the p-value', why: 'The CI already answers it: it contains 0, so not significant (and the p-value would agree).' }
      ]
    },
    {
      category: 'ci-ratio',
      stem: 'An odds ratio is reported as 1.77 with 95% CI (1.20, 2.63). Is it statistically significant?',
      choices: [
        { text: 'Yes \u2014 the interval excludes 1', correct: true, why: 'For a ratio, a 95% CI that does NOT contain 1 is statistically significant (the RVF herdsperson AOR).' },
        { text: 'No \u2014 the interval contains 0', why: 'Ratios are judged against 1, not 0, and this CI doesn\u2019t contain 1 anyway.' },
        { text: 'No \u2014 1.77 is close to 1', why: 'Closeness doesn\u2019t decide it; the CI excludes 1, so it is significant.' },
        { text: 'Cannot tell from a CI', why: 'A CI alone decides significance for a ratio via the "contains 1?" rule.' }
      ]
    },
    {
      category: 'odds-ratio-reading',
      stem: 'In the breast-cancer study, "Insured" is the reference group and the adjusted OR for Medicaid is 1.14 (significant). The best reading is\u2026',
      choices: [
        { text: 'Medicaid patients were ~14% more likely to have radiation omitted than insured patients', correct: true, why: 'OR 1.14 vs the reference \u2192 1.14 \u2212 1 = 0.14 = 14% more likely than the Insured reference group.' },
        { text: 'Medicaid patients were 114% more likely than insured patients', why: 'That double-counts; 1.14 means 14% more likely, not 114%.' },
        { text: 'Insured patients were 14% more likely than Medicaid patients', why: 'The comparison is Medicaid relative to the Insured reference, not the reverse.' },
        { text: 'Medicaid patients had a 1.14% chance of omission', why: 'An OR is not a probability percentage.' }
      ]
    },
    {
      category: 'hazard-vs-odds',
      stem: 'Which statement matches the course\u2019s rule of thumb?',
      choices: [
        { text: 'Hazard ratios imply risk; odds ratios imply likelihood', correct: true, why: 'That is the exact phrasing from the hazard-ratio slide.' },
        { text: 'Odds ratios imply risk; hazard ratios imply likelihood', why: 'It is the other way around.' },
        { text: 'Both are identical and interchangeable', why: 'They are different measures with different "no effect" interpretations over time.' },
        { text: 'Neither has a p-value', why: 'Both ORs and HRs have p-values and 95% CIs.' }
      ]
    },
    {
      category: 'risk-measures',
      stem: 'Control event rate 43.8%, experimental event rate 12.5%. The absolute risk reduction (ARR) is\u2026',
      choices: [
        { text: 'About 31.3 percentage points', correct: true, why: 'ARR = CER \u2212 EER = 43.8% \u2212 12.5% = 31.3 percentage points (the heparin example).' },
        { text: 'About 28.5%', why: '28.5% is the relative risk (EER/CER), not the ARR.' },
        { text: 'About 71.5%', why: '71.5% is the relative risk reduction, not the ARR.' },
        { text: 'About 3.2', why: '3.2 is the number needed to treat (1/ARR), not the ARR.' }
      ]
    },
    {
      category: 'risk-measures',
      stem: 'With an ARR of 0.313, the number needed to treat (NNT) is\u2026',
      choices: [
        { text: 'About 3.2 (1 / 0.313)', correct: true, why: 'NNT = 1 / ARR = 1 / 0.313 \u2248 3.2.' },
        { text: 'About 0.313', why: 'That is the ARR itself; NNT is its reciprocal.' },
        { text: 'About 31.3', why: 'NNT = 1/ARR, not ARR \u00d7 100.' },
        { text: 'About 10', why: 'NNT 10 would require ARR = 0.10, not 0.313.' }
      ]
    },
    {
      category: 'errors-power',
      stem: 'A diagnostic test tells a patient they have a disease, but they actually do not. In H\u2080 "patient does not have the disease" terms, this is\u2026',
      choices: [
        { text: 'A Type I error (false positive)', correct: true, why: 'Rejecting H\u2080 (saying diseased) when H\u2080 is true (healthy) = Type I error = false positive.' },
        { text: 'A Type II error (false negative)', why: 'Type II is failing to detect a disease that IS present.' },
        { text: 'A correct rejection', why: 'It is an error \u2014 the patient is actually healthy.' },
        { text: 'An increase in power', why: 'Power is about correctly detecting real effects, not this mistake.' }
      ]
    },
    {
      category: 'errors-power',
      stem: 'Which change <em>increases</em> statistical power?',
      choices: [
        { text: 'A larger sample size', correct: true, why: 'Bigger n (and bigger effect size) raises power and lowers the Type II error rate.' },
        { text: 'A smaller effect size', why: 'Smaller effects are harder to detect \u2014 that lowers power.' },
        { text: 'A smaller sample size', why: 'Smaller samples carry less information \u2192 less power.' },
        { text: 'Raising \u03b2', why: 'Power = 1 \u2212 \u03b2, so raising \u03b2 lowers power.' }
      ]
    },
    {
      category: 'core-definitions',
      stem: 'The standard normal distribution\u2019s two-tailed critical values at \u03b1 = 0.05 are\u2026',
      choices: [
        { text: '\u00b11.96', correct: true, why: 'For the standard normal, the fixed critical values are \u00b11.96 (2.5% in each tail).' },
        { text: '\u00b12.14', why: '2.14 was a t critical value for the APGAR example (df-dependent), not the normal.' },
        { text: '\u00b11.00', why: '\u00b11 standard deviation leaves far more than 5% in the tails.' },
        { text: '\u00b10.05', why: '0.05 is \u03b1 itself, not a critical value on the z-axis.' }
      ]
    },
    {
      category: 'core-definitions',
      stem: 'What does the null hypothesis of "no effect" claim, and what do we do with it?',
      choices: [
        { text: 'It claims the effect is 0; we start by assuming it and try to reject it', correct: true, why: 'H\u2080 = no effect (difference = 0). We assume it true, then decide: reject, or fail to reject.' },
        { text: 'It claims the effect is large; we try to prove it', why: 'H\u2080 is the no-effect assumption, and we test by trying to reject it, not prove it.' },
        { text: 'It is the same as the alternative hypothesis', why: 'H\u2090 is the contradiction of H\u2080, not the same statement.' },
        { text: 'It can never be rejected', why: 'The entire point of testing is deciding whether we CAN reject H\u2080.' }
      ]
    },
    {
      category: 'significance-pvalue',
      stem: 'A p-value and a 95% confidence interval for the same estimate\u2026',
      choices: [
        { text: 'Must always agree about significance', correct: true, why: 'If one says significant, so does the other \u2014 they are two views of the same test.' },
        { text: 'Can disagree about significance', why: 'They cannot: the course stresses they must agree.' },
        { text: 'Are only used for ratios', why: 'Both apply to differences and ratios alike.' },
        { text: 'Replace the need for a null hypothesis', why: 'Both are still interpreted against H\u2080.' }
      ]
    }
  ];

  const CATEGORY_LABELS = {
    'choosing-a-test': 'Choosing the right test',
    'significance-pvalue': 'Significance & p-values',
    'ci-difference': 'CIs for differences (the 0 rule)',
    'ci-ratio': 'CIs for ratios (the 1 rule)',
    'odds-ratio-reading': 'Reading odds ratios',
    'hazard-vs-odds': 'Hazard vs odds ratios',
    'risk-measures': 'Risk measures (AR/ARR/RR/RRR/NNT)',
    'errors-power': 'Type I/II errors & power',
    'core-definitions': 'Core definitions'
  };

  return { TESTS, VOCAB, SCENARIOS, EXAM_BANK, CATEGORY_LABELS };
})();
