// AVANT MARKETS — Mi Portafolio screen

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ACTIVITY, fmtMoney, fmtSigned, fmtPct, sparkPath } from "../data.js";
import { syntheticSeries } from "../lib/syntheticSeries.js";

function Donut({ slices, count }) {
  const r = 60;
  const cx = 80, cy = 80;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg viewBox="0 0 160 160" className="donut">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="22" />
      {slices.map((s, i) => {
        const len = (s.pct / 100) * circ;
        const dasharray = `${len} ${circ - len}`;
        const dashoffset = -offset;
        offset += len;
        return (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={s.color}
            strokeWidth="22"
            strokeDasharray={dasharray}
            strokeDashoffset={dashoffset}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ filter: `drop-shadow(0 0 6px ${s.color}66)` }}
          />
        );
      })}
      <text x={cx} y={cy - 4} textAnchor="middle"
        fontFamily="Space Grotesk, sans-serif"
        fontWeight="500"
        fontSize="22"
        fill="#fff">
        {count}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle"
        fontFamily="Manrope, sans-serif"
        fontSize="9"
        letterSpacing="0.16em"
        fill="rgba(255,255,255,0.5)">
        {count === 1 ? "ACTIVO" : "ACTIVOS"}
      </text>
    </svg>
  );
}

function Sparkline({ values, positive }) {
  const d = sparkPath(values);
  return (
    <svg viewBox="0 0 96 30" className={"spark " + (positive ? "pos" : "neg")}>
      <path d={d} fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PortfolioSkeleton() {
  return (
    <div className="screen">
      <div className="portfolio-head">
        <div className="card summary-card">
          <div className="skeleton skeleton-line" style={{ width: "40%" }} />
          <div className="skeleton skeleton-line" style={{ width: "60%", height: 36 }} />
          <div className="skeleton skeleton-row" />
        </div>
        <div className="card distribution-card">
          <div className="skeleton" style={{ width: 160, height: 160, borderRadius: "50%", margin: "auto" }} />
        </div>
      </div>
      <div className="card holdings-card">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="skeleton skeleton-row" />
        ))}
      </div>
    </div>
  );
}

export function Portfolio({ onOpenTicker }) {
  const tickers = useQuery(api.tickers.listTickers);
  const holdingsRows = useQuery(api.holdings.listHoldings);

  if (tickers === undefined || holdingsRows === undefined) return <PortfolioSkeleton />;

  const tickerBySymbol = new Map(tickers.map((t) => [t.symbol, t]));

  const enriched = holdingsRows
    .map((h) => {
      const info = tickerBySymbol.get(h.symbol);
      if (!info) return null;
      const value = info.lastPrice * h.qty;
      const cost = h.avgCost * h.qty;
      const pl = value - cost;
      const plPct = cost > 0 ? (pl / cost) * 100 : 0;
      return { ...h, info, value, cost, pl, plPct };
    })
    .filter(Boolean);

  const sumValue = enriched.reduce((s, h) => s + h.value, 0);
  enriched.forEach((h) => (h.weight = sumValue > 0 ? (h.value / sumValue) * 100 : 0));
  enriched.sort((a, b) => b.value - a.value);

  const todayChange = enriched.reduce((s, h) => s + h.info.change * h.qty, 0);
  const todayChangeBaseline = sumValue - todayChange;
  const todayChangePct =
    todayChangeBaseline !== 0 && Number.isFinite(todayChangeBaseline)
      ? (todayChange / todayChangeBaseline) * 100
      : 0;

  const sectorMap = {};
  enriched.forEach((h) => {
    const s = h.info.sector || "Otros";
    sectorMap[s] = (sectorMap[s] || 0) + h.value;
  });
  const sectorTotal = Object.values(sectorMap).reduce((a, b) => a + b, 0);
  const sectorColors = ["#c8ff1f", "#2bd8e6", "#9b5cff", "#ff8a3d", "#ff4d7a", "#5cffaa", "#ffd84d", "#bdc1ff"];
  const sectors = Object.entries(sectorMap)
    .map(([name, v], i) => ({ name, pct: sectorTotal > 0 ? (v / sectorTotal) * 100 : 0, color: sectorColors[i % sectorColors.length] }))
    .sort((a, b) => b.pct - a.pct);

  const movers = tickers
    .slice()
    .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))
    .slice(0, 6);

  return (
    <div className="screen">
      <div className="portfolio-head">
        <div className="card summary-card">
          <div className="summary-label">Valor total del portafolio</div>
          <div className="summary-value">
            {fmtMoney(sumValue)}
            <span className="currency">USD</span>
          </div>
          <div className="summary-deltas">
            <div className="delta">
              <span className="delta-label">Hoy</span>
              <span className={"delta-value" + (todayChange >= 0 ? "" : " neg")}>
                <span>{todayChange >= 0 ? "▲" : "▼"}</span>
                {fmtSigned(todayChange)} USD ({fmtPct(todayChangePct)})
              </span>
            </div>
            <div className="delta">
              <span className="delta-label">Rendimiento total</span>
              <span className={"delta-value" + (enriched.reduce((s, h) => s + h.pl, 0) >= 0 ? "" : " neg")}>
                <span>{enriched.reduce((s, h) => s + h.pl, 0) >= 0 ? "▲" : "▼"}</span>
                {fmtSigned(enriched.reduce((s, h) => s + h.pl, 0))} USD
              </span>
            </div>
            <div className="delta">
              <span className="delta-label">Efectivo disponible<span className="badge-demo">demo</span></span>
              <span className="delta-value" style={{ color: "#fff", textShadow: "none" }}>
                {fmtMoney(12480.32)} USD
              </span>
            </div>
          </div>
        </div>

        <div className="card distribution-card">
          <h3 className="distribution-title">Distribución por sector</h3>
          {enriched.length === 0 ? (
            <div className="empty-state">
              <div className="empty-title">Sin posiciones todavía</div>
              <div>Buscá un ticker en la cabecera y añadilo a tu portafolio.</div>
            </div>
          ) : (
            <div className="distribution-body">
              <Donut slices={sectors} count={enriched.length} />
              <div className="dist-legend">
                {sectors.map((s) => (
                  <div className="dist-row" key={s.name}>
                    <span className="dist-swatch" style={{ background: s.color, boxShadow: `0 0 8px ${s.color}80` }} />
                    <span className="dist-name">{s.name}</span>
                    <span className="dist-pct">{s.pct.toFixed(1).replace(".", ",")}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card holdings-card">
        <div className="holdings-head">
          <h2 className="section-title">Mis posiciones</h2>
        </div>
        {enriched.length === 0 ? (
          <div className="empty-state">
            <div className="empty-title">Tu portafolio está vacío</div>
            <div>Buscá un ticker en la cabecera (ej. NVDA) y pulsá "Añadir al portafolio".</div>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Activo</th>
                <th className="num">Cantidad</th>
                <th className="num">Precio prom.</th>
                <th className="num">Precio actual</th>
                <th className="num">Valor</th>
                <th className="num">G/P total</th>
                <th className="num">Hoy</th>
                <th className="num">Peso</th>
                <th className="num">7D</th>
              </tr>
            </thead>
            <tbody>
              {enriched.map((h) => {
                const pos = h.pl >= 0;
                const todayPos = h.info.change >= 0;
                const series = syntheticSeries(h.symbol)["1S"];
                return (
                  <tr
                    key={h._id}
                    tabIndex={0}
                    role="button"
                    onClick={() => onOpenTicker(h.symbol)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onOpenTicker(h.symbol);
                      }
                    }}
                  >
                    <td>
                      <div className="holding-name">
                        <div className="holding-logo" style={{ color: h.info.accent, textShadow: `0 0 8px ${h.info.accent}80` }}>
                          {h.symbol.slice(0, 2)}
                        </div>
                        <div className="holding-meta">
                          <span className="holding-ticker">{h.symbol}</span>
                          <span className="holding-sub">{h.info.name}</span>
                        </div>
                      </div>
                    </td>
                    <td className="num num-mono">{h.qty}</td>
                    <td className="num num-mono">{fmtMoney(h.avgCost)}</td>
                    <td className="num num-mono">{fmtMoney(h.info.lastPrice)}</td>
                    <td className="num num-mono">{fmtMoney(h.value)}</td>
                    <td className="num">
                      <span className={"pl " + (pos ? "pos" : "neg")}>
                        {fmtSigned(h.pl, 0)} ({fmtPct(h.plPct, 1)})
                      </span>
                    </td>
                    <td className="num">
                      <span className={"pl " + (todayPos ? "pos" : "neg")}>
                        {fmtPct(h.info.changePct)}
                      </span>
                    </td>
                    <td className="num num-mono">{h.weight.toFixed(1).replace(".", ",")}%</td>
                    <td className="num">
                      <Sparkline values={series} positive={pos} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="bottom-row">
        <div className="card">
          <div className="section-head" style={{ margin: "0 0 8px" }}>
            <h2 className="section-title">Actividad reciente<span className="badge-demo">demo</span></h2>
          </div>
          <div>
            {ACTIVITY.map((a, i) => {
              let title, amount, sub;
              if (a.type === "buy") {
                title = `Compra · ${a.ticker}`;
                sub = `${a.qty} acciones a ${fmtMoney(a.price)} USD`;
                amount = `−${fmtMoney(a.qty * a.price)} USD`;
              } else if (a.type === "sell") {
                title = `Venta · ${a.ticker}`;
                sub = `${a.qty} acciones a ${fmtMoney(a.price)} USD`;
                amount = `+${fmtMoney(a.qty * a.price)} USD`;
              } else {
                title = `Dividendo · ${a.ticker}`;
                sub = `${a.qty} acciones`;
                amount = `+${fmtMoney(a.amount)} USD`;
              }
              return (
                <div className="activity-row" key={i}>
                  <div className="activity-left">
                    <div className={"activity-badge " + a.type}>
                      {a.type === "buy" ? "BUY" : a.type === "sell" ? "SELL" : "DIV"}
                    </div>
                    <div className="activity-info">
                      <span className="activity-title">{title}</span>
                      <span className="activity-sub">{sub}</span>
                    </div>
                  </div>
                  <div>
                    <div className="activity-amount">{amount}</div>
                    <div className="activity-time">{a.time}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="section-head" style={{ margin: "0 0 8px" }}>
            <h2 className="section-title">Mayores movimientos</h2>
          </div>
          <div className="movers-list">
            {movers.map((m) => {
              const pos = m.change >= 0;
              return (
                <div
                  className="mover-row"
                  key={m.symbol}
                  tabIndex={0}
                  role="button"
                  onClick={() => onOpenTicker(m.symbol)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onOpenTicker(m.symbol);
                    }
                  }}
                >
                  <div className="mover-logo" style={{ color: m.accent, textShadow: `0 0 8px ${m.accent}80` }}>
                    {m.symbol.slice(0, 2)}
                  </div>
                  <div className="mover-info">
                    <span className="mover-ticker">{m.symbol}</span>
                    <span className="mover-name">{m.name}</span>
                  </div>
                  <div className="mover-price">{fmtMoney(m.lastPrice)}</div>
                  <div className={"mover-change " + (pos ? "pos" : "neg")}>
                    {fmtPct(m.changePct)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
