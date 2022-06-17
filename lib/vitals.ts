export const fcpThres = [1800, 3000] as [number, number];
export const fcpWeight = 0.2;
export const lcpThres = [2500, 4000] as [number, number];
export const lcpWeight = 0.3;
export const fidThres = [100, 300] as [number, number];
export const fidWeight = 0.35;
export const clsThres = [0.1, 0.25] as [number, number];
export const clsWeight = 0.15;

export function getScore(value: number, thres: [number, number]) {
  if (value <= thres[0]) {
    const pct = (thres[0] - value) / thres[0];
    return 80 + pct * 20;
  } else if (value <= thres[1]) {
    const pct = (thres[1] - value) / (thres[1] - thres[0]);
    return 60 + pct * 20;
  } else {
    const pct = (value - thres[1]) / (thres[1] + value);
    return 60 - 60 * pct;
  }
}

export function getNES(fcp = 0, lcp = 0, fid = 0, cls = 0) {
  let totalWeight = 0;
  fcp && (totalWeight += fcpWeight);
  lcp && (totalWeight += lcpWeight);
  fid && (totalWeight += fidWeight);
  cls && (totalWeight += clsWeight);
  // must have 3 or more indicators to calculate NES
  if (totalWeight < 1 - Math.max(fcpWeight, lcpWeight, fidWeight, clsWeight)) {
    return 0;
  }
  let score = 0;
  fcp && (score += getScore(fcp, fcpThres) * fcpWeight);
  lcp && (score += getScore(lcp, lcpThres) * lcpWeight);
  fid && (score += getScore(fid, fidThres) * fidWeight);
  cls && (score += getScore(cls, clsThres) * clsWeight);
  return score / totalWeight;
}
