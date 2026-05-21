// AVANT MARKETS — main app

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Header } from "./components/Header.jsx";
import { TickerDetail } from "./components/TickerDetail.jsx";
import { Portfolio } from "./components/Portfolio.jsx";

export function App() {
  const [screen, setScreen] = useState("detail");
  const [ticker, setTicker] = useState(null);
  const [search, setSearch] = useState("");

  const tickers = useQuery(api.tickers.listTickers);
  const holdings = useQuery(api.holdings.listHoldings);
  const addHolding = useMutation(api.holdings.addHolding);
  const removeHolding = useMutation(api.holdings.removeHolding);

  const tickerSymbols = useMemo(
    () => (tickers ? tickers.map((t) => t.symbol).sort() : []),
    [tickers],
  );

  // Default ticker = first symbol available (alphabetical) once loaded
  useEffect(() => {
    if (ticker === null && tickerSymbols.length > 0) {
      setTicker(tickerSymbols[0]);
    }
  }, [ticker, tickerSymbols]);

  const portfolioSet = useMemo(
    () => new Set((holdings ?? []).map((h) => h.symbol)),
    [holdings],
  );
  const inPortfolio = ticker ? portfolioSet.has(ticker) : false;

  const onToggleAdd = () => {
    if (!ticker) return;
    if (portfolioSet.has(ticker)) {
      void removeHolding({ symbol: ticker });
    } else {
      void addHolding({ symbol: ticker });
    }
  };

  const onOpenTicker = (tk) => {
    setTicker(tk);
    setScreen("detail");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearch = (val) => {
    setSearch(val);
    const up = val.trim().toUpperCase();
    if (tickerSymbols.includes(up)) {
      setTicker(up);
      setScreen("detail");
      setSearch("");
    }
  };

  return (
    <div
      className="app"
      data-screen-label={screen === "detail" ? `01 Detalle · ${ticker ?? "—"}` : "02 Mi portafolio"}
    >
      <Header
        screen={screen}
        onNavigate={(s) => { setScreen(s); window.scrollTo({ top: 0 }); }}
        searchValue={search}
        onSearch={handleSearch}
      />

      {screen === "detail" && ticker && (
        <TickerDetail
          tickerKey={ticker}
          inPortfolio={inPortfolio}
          onToggleAdd={onToggleAdd}
        />
      )}

      {screen === "portfolio" && (
        <Portfolio onOpenTicker={onOpenTicker} />
      )}
    </div>
  );
}
