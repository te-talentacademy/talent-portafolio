import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "refresh quotes every 10s",
  { seconds: 10 },
  internal.tickers.refreshQuotes,
);

crons.interval(
  "refresh fundamentals and news (1 symbol round-robin every 30 min)",
  { minutes: 30 },
  internal.tickers.refreshFundamentalsAndNewsOneSymbol,
);

export default crons;
