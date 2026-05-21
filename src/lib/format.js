import { fmtMoney } from "../data.js";

export function fmtMarketCap(millions) {
  if (millions == null || !isFinite(millions) || millions <= 0) return "—";
  if (millions >= 1_000_000) return fmtMoney(millions / 1_000_000, 2) + " T USD";
  if (millions >= 1_000) return fmtMoney(millions / 1_000, 2) + " B USD";
  return fmtMoney(millions, 2) + " M USD";
}

export function fmtVolumeMillions(millions) {
  if (millions == null || !isFinite(millions) || millions <= 0) return "—";
  return fmtMoney(millions, 2) + " M";
}

export function fmtNumberOrDash(n, decimals = 2) {
  if (n == null || !isFinite(n)) return "—";
  return fmtMoney(n, decimals);
}

export function fmtPctOrDash(n, decimals = 2) {
  if (n == null || !isFinite(n)) return "—";
  return fmtMoney(n, decimals) + "%";
}
