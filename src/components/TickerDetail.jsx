// AVANT MARKETS — Ticker Detail screen

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { fmtMoney, fmtSigned, fmtPct } from "../data.js";
import { fmtMarketCap, fmtVolumeMillions, fmtNumberOrDash, fmtPctOrDash } from "../lib/format.js";
import { syntheticSeries } from "../lib/syntheticSeries.js";

function PriceChart({ data, animate }) {
  const W = 700;
  const H = 380;
  const padL = 28;
  const padR = 64;
  const padT = 16;
  const padB = 36;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = (max - min) || 1;

  const yMin = min - range * 0.08;
  const yMax = max + range * 0.08;
  const yRange = yMax - yMin;

  const usableW = W - padL - padR;
  const usableH = H - padT - padB;
  const step = usableW / (data.length - 1);

  const xy = (i, v) => [padL + i * step, padT + usableH - ((v - yMin) / yRange) * usableH];

  const linePath = data
    .map((v, i) => {
      const [x, y] = xy(i, v);
      return (i === 0 ? "M" : "L") + x.toFixed(2) + " " + y.toFixed(2);
    })
    .join(" ");

  const lastX = padL + (data.length - 1) * step;
  const [, lastY] = xy(data.length - 1, data[data.length - 1]);
  const fillPath = `${linePath} L ${lastX.toFixed(2)} ${(padT + usableH).toFixed(2)} L ${padL} ${(padT + usableH).toFixed(2)} Z`;

  const yTicks = [];
  for (let i = 0; i <= 4; i++) {
    const v = yMin + (yRange * i) / 4;
    const y = padT + usableH - (i / 4) * usableH;
    yTicks.push({ v, y });
  }

  const xLabels = ["09:30", "11:00", "12:30", "14:00", "15:30", "16:00"];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg" preserveAspectRatio="none">
      <defs>
        <linearGradient id="lime-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#c8ff1f" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#c8ff1f" stopOpacity="0" />
        </linearGradient>
      </defs>

      {yTicks.map((t, i) => (
        <g key={i}>
          <line className="grid-line" x1={padL} x2={W - padR} y1={t.y} y2={t.y} />
          <text className="axis-label" x={W - padR + 10} y={t.y + 4}>
            {t.v.toFixed(2).replace(".", ",")}
          </text>
        </g>
      ))}

      <path className="price-fill" d={fillPath} />
      <path className={"price-line" + (animate ? " animate" : "")} d={linePath} />

      <circle className="price-dot" cx={lastX} cy={lastY} r="5" />
      <circle className="price-dot" cx={lastX} cy={lastY} r="9" opacity="0.25" />

      {xLabels.map((l, i) => {
        const x = padL + (i / (xLabels.length - 1)) * usableW;
        return (
          <text key={l} className="axis-label" x={x} y={H - 10} textAnchor="middle">{l}</text>
        );
      })}
    </svg>
  );
}

function NewsImagePlaceholder({ hue, label }) {
  return (
    <svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`nbg-${hue}`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%"  stopColor={`oklch(0.32 0.08 ${hue})`} />
          <stop offset="100%" stopColor={`oklch(0.14 0.05 ${hue})`} />
        </linearGradient>
        <pattern id={`stripes-${hue}`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(255,255,255,0.04)" strokeWidth="2" />
        </pattern>
      </defs>
      <rect width="320" height="180" fill={`url(#nbg-${hue})`} />
      <rect width="320" height="180" fill={`url(#stripes-${hue})`} />
      <text x="160" y="92" textAnchor="middle"
            fontFamily="IBM Plex Mono, monospace"
            fontSize="11"
            letterSpacing="0.15em"
            fill="rgba(255,255,255,0.35)">
        {label}
      </text>
    </svg>
  );
}

function hueFromString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 360;
}

function timeAgo(ms) {
  const diff = Date.now() - ms;
  if (diff < 0) return "Hace instantes";
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Hace instantes";
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Hace ${days} d`;
  return new Date(ms).toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

function TickerDetailSkeleton() {
  return (
    <div className="screen">
      <div className="detail-head">
        <div className="detail-head-left">
          <div className="skeleton" style={{ width: 72, height: 72, borderRadius: 18 }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton skeleton-line" style={{ width: "55%", height: 22 }} />
            <div className="skeleton skeleton-line" style={{ width: "35%" }} />
          </div>
        </div>
        <div className="detail-head-right">
          <div className="skeleton skeleton-line" style={{ width: 160, height: 36 }} />
          <div className="skeleton skeleton-line" style={{ width: 200 }} />
        </div>
      </div>
      <div className="chart-row">
        <div className="card chart-card">
          <div className="skeleton" style={{ width: "100%", height: 380 }} />
        </div>
        <div className="card">
          <div className="skeleton skeleton-line" style={{ width: "60%" }} />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton skeleton-row" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function TickerDetail({ tickerKey, inPortfolio, onToggleAdd }) {
  const [timeframe, setTimeframe] = useState("1D");
  const ticker = useQuery(api.tickers.getTicker, { symbol: tickerKey });
  const news = useQuery(api.news.listNewsForTicker, { symbol: tickerKey, limit: 6 }) ?? [];

  if (ticker === undefined) return <TickerDetailSkeleton />;
  if (ticker === null) {
    return (
      <div className="screen">
        <div className="empty-state">
          <div className="empty-title">Ticker no encontrado</div>
          <div>El símbolo <strong>{tickerKey}</strong> no está en la base de datos.</div>
        </div>
      </div>
    );
  }

  const t = ticker;
  const series = syntheticSeries(t.symbol)[timeframe];
  const positive = t.change >= 0;
  const chartKey = `${t.symbol}-${timeframe}-${t.lastPriceAt}`;

  return (
    <div className="screen">
      <div className="detail-head">
        <div className="detail-head-left">
          <div className="ticker-logo" style={{ color: t.accent, textShadow: "0 0 14px " + t.accent + "80" }}>
            {t.symbol.slice(0, 2)}
          </div>
          <div>
            <h1 className="ticker-name">{t.name}</h1>
            <div className="ticker-meta">
              <span>{t.symbol}</span>
              <span className="dot" />
              <span>{t.exchange}</span>
              <span className="dot" />
              <span>{t.sector}</span>
            </div>
          </div>
        </div>

        <div className="detail-head-right">
          <div className="price">
            {fmtMoney(t.lastPrice)}
            <span className="price-currency">USD</span>
          </div>
          <div className={"price-change" + (positive ? "" : " neg")}>
            <span>{positive ? "▲" : "▼"}</span>
            <span>{fmtSigned(t.change)} ({fmtPct(t.changePct)})</span>
            <span className="price-change-period">Hoy</span>
          </div>
          <div>
            <button
              className={"btn-add" + (inPortfolio ? " added" : "")}
              onClick={onToggleAdd}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {inPortfolio
                  ? <path d="M5 12l5 5L20 7" />
                  : <><path d="M12 5v14" /><path d="M5 12h14" /></>}
              </svg>
              {inPortfolio ? "En tu portafolio" : "Añadir al portafolio"}
            </button>
          </div>
        </div>
      </div>

      <div className="chart-row">
        <div className="card chart-card">
          <div className="chart-tabs">
            {["1H", "4H", "1D", "1S"].map((tf) => (
              <button
                key={tf}
                className={"chart-tab" + (timeframe === tf ? " active" : "")}
                onClick={() => setTimeframe(tf)}
              >
                {tf}
              </button>
            ))}
          </div>
          <PriceChart key={chartKey} data={series} animate />
        </div>

        <div className="card">
          <div className="metrics-title">Métricas clave</div>
          <div className="metrics-list">
            <div className="metric-row"><span className="metric-label">Capitalización</span><span className="metric-value">{fmtMarketCap(t.marketCap)}</span></div>
            <div className="metric-row"><span className="metric-label">Vol. prom. 10d</span><span className="metric-value">{fmtVolumeMillions(t.volume10d)}</span></div>
            <div className="metric-row"><span className="metric-label">P/E (TTM)</span><span className="metric-value">{fmtNumberOrDash(t.peRatio)}</span></div>
            <div className="metric-row"><span className="metric-label">Dividendo</span><span className="metric-value">{fmtPctOrDash(t.dividendYield)}</span></div>
            <div className="metric-row"><span className="metric-label">Beta</span><span className="metric-value">{fmtNumberOrDash(t.beta)}</span></div>
          </div>
        </div>
      </div>

      <div className="section-head">
        <h2 className="section-title">Noticias recientes</h2>
      </div>
      {news.length === 0 ? (
        <div className="empty-state">
          <div className="empty-title">Sin noticias todavía</div>
          <div>Los titulares se actualizan periódicamente desde Finnhub.</div>
        </div>
      ) : (
        <div className="news-grid">
          {news.slice(0, 3).map((n) => (
            <article className="news-card" key={n._id}>
              <div className="news-img">
                {n.image
                  ? <img
                      src={n.image}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => {
                        const el = e.currentTarget;
                        el.style.display = "none";
                        el.parentElement?.classList.add("news-img-fallback");
                      }}
                    />
                  : <NewsImagePlaceholder hue={hueFromString(n.headline)} label={`[ ${n.source || "noticia"} ]`} />
                }
              </div>
              <div className="news-body">
                <div className="news-tag">{n.category || n.source || "Noticia"}</div>
                <h3 className="news-title">
                  <a href={n.url} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none" }}>
                    {n.headline}
                  </a>
                </h3>
                <div className="news-time">{timeAgo(n.publishedAt)}</div>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="footer">
        <div>Los datos se muestran con fines informativos y no constituyen asesoramiento de inversión.</div>
        <div className="footer-right">
          <div>Fuente: <span>Finnhub</span></div>
          <div>· <span>Actualización ≈10 s</span></div>
        </div>
      </div>
    </div>
  );
}
