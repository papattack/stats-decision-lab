/* ============================================================
   stats-math.js
   Pure-JS statistical functions. No external libraries so the
   whole app runs offline from a single folder.

   Everything here is only as precise as a teaching tool needs.
   The approximations below are standard and accurate to a few
   decimal places across the ranges we use.
   ============================================================ */

const StatsMath = (() => {

  /* ---- Standard normal PDF ---- */
  function normalPdf(z) {
    return Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
  }

  /* ---- Standard normal CDF (Abramowitz & Stegun 7.1.26 via erf) ---- */
  function erf(x) {
    // Save the sign
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;
    const t = 1 / (1 + p * x);
    const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return sign * y;
  }

  function normalCdf(z) {
    return 0.5 * (1 + erf(z / Math.sqrt(2)));
  }

  /* ---- log-gamma (Lanczos) — needed for the t distribution ---- */
  function logGamma(z) {
    const g = 7;
    const c = [
      0.99999999999980993, 676.5203681218851, -1259.1392167224028,
      771.32342877765313, -176.61502916214059, 12.507343278686905,
      -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7
    ];
    if (z < 0.5) {
      // reflection formula
      return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
    }
    z -= 1;
    let x = c[0];
    for (let i = 1; i < g + 2; i++) x += c[i] / (z + i);
    const t = z + g + 0.5;
    return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
  }

  /* ---- Student's t PDF with df degrees of freedom ---- */
  function tPdf(t, df) {
    const lnC = logGamma((df + 1) / 2) - logGamma(df / 2)
              - 0.5 * Math.log(df * Math.PI);
    const ln = lnC - ((df + 1) / 2) * Math.log(1 + (t * t) / df);
    return Math.exp(ln);
  }

  /* ---- Regularised incomplete beta (continued fraction) ---- */
  function betacf(a, b, x) {
    const MAXIT = 200;
    const EPS = 3e-12;
    const FPMIN = 1e-300;
    let qab = a + b, qap = a + 1, qam = a - 1;
    let c = 1;
    let d = 1 - (qab * x) / qap;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    d = 1 / d;
    let h = d;
    for (let m = 1; m <= MAXIT; m++) {
      const m2 = 2 * m;
      let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c;  if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d;
      h *= d * c;
      aa = -((a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c;  if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d;
      const del = d * c;
      h *= del;
      if (Math.abs(del - 1) < EPS) break;
    }
    return h;
  }

  function betai(a, b, x) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    const lnBeta = logGamma(a + b) - logGamma(a) - logGamma(b)
                 + a * Math.log(x) + b * Math.log(1 - x);
    const front = Math.exp(lnBeta);
    if (x < (a + 1) / (a + b + 2)) {
      return front * betacf(a, b, x) / a;
    }
    return 1 - front * betacf(b, a, 1 - x) / b;
  }

  /* ---- Student's t CDF ---- */
  function tCdf(t, df) {
    const x = df / (df + t * t);
    const ib = 0.5 * betai(df / 2, 0.5, x);
    return t > 0 ? 1 - ib : ib;
  }

  /* ---- Two-tailed p-value from a test statistic ---- */
  function twoTailedP_normal(z) {
    return 2 * (1 - normalCdf(Math.abs(z)));
  }
  function twoTailedP_t(t, df) {
    return 2 * (1 - tCdf(Math.abs(t), df));
  }

  /* ---- Critical t value for two-tailed alpha (bisection on CDF) ---- */
  function tCritical(df, alpha = 0.05) {
    // we want t such that upper-tail area = alpha/2
    const target = 1 - alpha / 2;
    let lo = 0, hi = 100;
    for (let i = 0; i < 100; i++) {
      const mid = (lo + hi) / 2;
      if (tCdf(mid, df) < target) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  /* ---- Power for a two-sided test given standardized effect & crit value ----
     Approximate power using the normal approximation to the noncentral t.
     effectZ = (true mean difference) / standard error.
     crit    = critical value (e.g. ~1.96 or t critical).
     Returns probability of rejecting H0 when it is false. */
  function approxPower(effectZ, crit) {
    // reject if |T| > crit; T ~ Normal(effectZ, 1) approx
    const upper = 1 - normalCdf(crit - effectZ);
    const lower = normalCdf(-crit - effectZ);
    return Math.min(1, Math.max(0, upper + lower));
  }

  return {
    normalPdf, normalCdf, erf, logGamma,
    tPdf, tCdf, betai,
    twoTailedP_normal, twoTailedP_t,
    tCritical, approxPower
  };
})();
