function hashSymbol(symbol) {
  let h = 0;
  for (let i = 0; i < symbol.length; i++) {
    h = (h * 31 + symbol.charCodeAt(i)) >>> 0;
  }
  return h % 1000;
}

function seededRandom(seed) {
  let s = seed || 1;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function generateSeries(seed, points, start, volatility, drift) {
  const rand = seededRandom(seed);
  const data = [];
  let v = start;
  for (let i = 0; i < points; i++) {
    const noise = (rand() - 0.5) * volatility;
    v = v + noise + drift;
    data.push(v);
  }
  return data;
}

export function syntheticSeries(symbol) {
  const seed = hashSymbol(symbol);
  return {
    "1H": generateSeries(seed + 1, 60, 100, 0.3, 0.005),
    "4H": generateSeries(seed + 2, 80, 100, 0.6, 0.01),
    "1D": generateSeries(seed + 3, 80, 100, 1.2, 0.015),
    "1S": generateSeries(seed + 4, 80, 100, 2.5, -0.005),
  };
}
