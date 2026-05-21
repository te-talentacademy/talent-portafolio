# Avant Markets

Dashboard de portafolio de acciones del S&P 500 con datos reales. Dark theme con acentos neón verde lima y cian.

## Stack

- **Vite + React 18** (frontend, módulos ES)
- **Convex** (backend reactivo + base de datos + crons)
- **Finnhub free** (datos de mercado: quotes, fundamentales, noticias)
- CSS puro con custom properties para tokens
- Tipografías: Space Grotesk · Manrope · IBM Plex Mono

## Universo de tickers

8 líderes del S&P 500: `AAPL, MSFT, NVDA, GOOGL, AMZN, META, TSLA, JPM`.

## Pre-requisitos

- Node 20+
- Cuenta gratis en [https://finnhub.io](https://finnhub.io) (alta en ~1 min)
- Acceso al deployment Convex `abundant-moose-837` (proyecto `talent-portafolio`)

## Arranque

```bash
npm install

# 1) Configurar la API key en Convex backend (importante: el .env.local NO basta)
npx convex env set FINNHUB_API_KEY <tu_key>

# 2) (opcional) Copiar .env.example a .env.local y rellenar — solo para tests con curl
cp .env.example .env.local

# 3) En 2 terminales separadas:
npx convex dev   # backend: schema, crons, funciones
npm run dev      # frontend: Vite en http://localhost:5173

# 4) Primera vez: sembrar la BD
npx convex run seed:seedTickers
npx convex run seed:seedIngestState
npx convex run tickers:refreshQuotes        # primer fetch de precios
npx convex run seed:seedHoldings            # holdings iniciales con avgCost real
```

## Arquitectura

```
React (Vite) ──► useQuery/useMutation ──► Convex (tablas)
                                              ▲
                                              │ internalMutation
                                       Convex actions ──► Finnhub REST
                                       (crons cada 10s / 30 min)
```

**Sin WebSocket** en el browser: la key Finnhub vive solo como secret del deployment Convex, nunca en el bundle. Los precios se refrescan cada 10s desde el backend; el frontend los ve via Convex sync nativo.

**Cuota Finnhub**: 48 req/min base (quotes × 8) + 3 req extra cada 30 min (round-robin fundamentales+news, 1 símbolo). Peor caso: 51 req/min — siempre <60 (free tier).

## Crons activos

| Cron | Frecuencia | Endpoint |
|---|---|---|
| `refreshQuotes` | cada 10 s | `/quote` × 8 |
| `refreshFundamentalsAndNewsOneSymbol` | cada 30 min | `/profile2` + `/metric` + `/company-news` (1 símbolo rotando) |

Cobertura: cada ticker tiene fundamentales y news refrescados cada **4 horas**.

## Demo global compartido

El portafolio **no tiene auth**: es un único portafolio en Convex que **todos los visitantes ven y modifican**. Es una decisión consciente de v1 (no es un bug). Para portafolios por usuario hay que añadir auth/sesión (queda fuera de v1).

## Pantallas

1. **Detalle de ticker** — precio en vivo, gráfica con tabs 1H/4H/1D/1S (sintética con seed real), métricas clave (Cap, Vol. prom. 10d, P/E TTM, dividendo, beta), noticias reales de Finnhub.
2. **Mi portafolio** — valor total, distribución por sector (donut), tabla de posiciones con sparklines, mayores movimientos del día, actividad reciente (mock con badge "demo").

## Interacciones

- Buscador: escribe `AAPL`, `MSFT`, `NVDA`, `GOOGL`, `AMZN`, `META`, `TSLA`, `JPM` y Enter
- Click en filas de la tabla o en mayores movimientos → abre el detalle
- Botón "Añadir al portafolio": idempotente (doble click no duplica), persistente en Convex

## Tokens de color principales

```css
--lime: #c8ff1f;     /* acento primario, precios positivos */
--cyan: #2bd8e6;     /* acento secundario, UI activa */
--rose: #ff4d7a;     /* precios negativos */
--bg-deep: #000000;  /* fondo */
--bg-card: #0a0d12;  /* tarjetas */
```

## Notas de implementación

- **`/quote` no devuelve volumen**: se muestra `metric.10DayAverageTradingVolume` con label "Vol. prom. 10d".
- **`/stock/candle` es premium**: las gráficas son sintéticas con seed determinista por símbolo. Issue follow-up CHA-127 para acumular histórico real.
- **`.env.local` solo lo lee Vite**: el backend Convex desplegado solo ve `process.env.FINNHUB_API_KEY` cuando se setea con `npx convex env set`.

## Dashboards

- **Convex**: [https://dashboard.convex.dev/d/abundant-moose-837](https://dashboard.convex.dev/d/abundant-moose-837)
- **Finnhub usage**: dashboard de tu cuenta en finnhub.io
- **Linear (issues)**: proyecto [Datos en tiempo real](https://linear.app/talent-engine/project/datos-en-tiempo-real-be62cfc56b57) en team Chanquete

## Limitaciones conocidas

- Universo fijo de 8 símbolos. Para escalar a N: ajustar fórmula `6 × N + 3 ≤ 60` (máximo ~9 tickers con cadencia actual).
- Fuera del horario de mercado US (≈07:30-14:00 MX según estacional), `/quote` devuelve último cierre. La celda no parpadea: comportamiento esperado.
- Sin auth: portafolio compartido por todos los visitantes (v1).
