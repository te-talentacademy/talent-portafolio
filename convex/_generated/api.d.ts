/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as crons from "../crons.js";
import type * as finnhub from "../finnhub.js";
import type * as holdings from "../holdings.js";
import type * as ingest from "../ingest.js";
import type * as news from "../news.js";
import type * as sectors from "../sectors.js";
import type * as seed from "../seed.js";
import type * as tickers from "../tickers.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  crons: typeof crons;
  finnhub: typeof finnhub;
  holdings: typeof holdings;
  ingest: typeof ingest;
  news: typeof news;
  sectors: typeof sectors;
  seed: typeof seed;
  tickers: typeof tickers;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
