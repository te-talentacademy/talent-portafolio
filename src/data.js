// AVANT MARKETS — formatters + mock estático de actividad reciente
//
// El mock de tickers, portfolio y news se eliminó: ahora todo viene de Convex.
// La actividad (compras/ventas/dividendos) sigue siendo mock estático en v1;
// se muestra en la UI con badge "demo" para no engañar.

export const ACTIVITY = [
  { type: "buy",  ticker: "ORBT", qty: 12, price: 246.10, time: "Hoy · 10:42" },
  { type: "div",  ticker: "ATLS", qty: 410, amount: 156.20, time: "Hoy · 09:00" },
  { type: "sell", ticker: "PXSE", qty: 20, price: 148.30, time: "Ayer · 15:18" },
  { type: "buy",  ticker: "VRDA", qty: 50, price: 54.80, time: "Ayer · 11:05" },
  { type: "buy",  ticker: "KORE", qty: 8, price: 308.90, time: "16 may · 14:22" },
  { type: "div",  ticker: "ZNTH", qty: 75, amount: 84.40, time: "15 may · 09:00" },
];

export function fmtMoney(n, decimals = 2) {
  return n.toLocaleString("es-ES", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function fmtSigned(n, decimals = 2) {
  const sign = n >= 0 ? "+" : "−";
  return sign + Math.abs(n).toLocaleString("es-ES", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function fmtPct(n, decimals = 2) {
  const sign = n >= 0 ? "+" : "−";
  return sign + Math.abs(n).toLocaleString("es-ES", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + "%";
}

export function sparkPath(values, w = 96, h = 30) {
  if (!values || values.length === 0) return "";
  const pad = 2;
  const usableH = h - pad * 2;
  if (values.length === 1) {
    return `M0 ${(pad + usableH / 2).toFixed(2)}`;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = w / (values.length - 1);
  return values
    .map((v, i) => {
      const x = i * step;
      const y = pad + usableH - ((v - min) / range) * usableH;
      return (i === 0 ? "M" : "L") + x.toFixed(2) + " " + y.toFixed(2);
    })
    .join(" ");
}
