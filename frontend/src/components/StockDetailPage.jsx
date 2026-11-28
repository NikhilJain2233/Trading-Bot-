import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CrosshairMode, createChart } from "lightweight-charts";
import Navbar from "./Navbar.jsx";

const chartRanges = [
  { label: "1W", candles: 5 },
  { label: "1M", candles: 22 },
  { label: "3M", candles: 66 },
  { label: "6M", candles: 132 },
  { label: "1Y", candles: 252 },
  { label: "ALL", candles: Infinity },
];

function calculateEma(candles, period) {
  if (candles.length === 0) return [];

  const smoothing = 2 / (period + 1);
  let average = candles[0].close;

  return candles.map((candle, index) => {
    average =
      index === 0
        ? candle.close
        : candle.close * smoothing + average * (1 - smoothing);
    return { time: candle.time, value: average };
  });
}

function formatChartDate(time) {
  if (typeof time === "string") return time;
  if (typeof time === "number") {
    return new Date(time * 1000).toISOString().slice(0, 10);
  }
  if (time && typeof time === "object") {
    return `${time.year}-${String(time.month).padStart(2, "0")}-${String(
      time.day
    ).padStart(2, "0")}`;
  }
  return "";
}

function PriceHistoryChart({ prices }) {
  const chartContainerRef = useRef(null);
  const [range, setRange] = useState("1M");
  const [hoveredCandle, setHoveredCandle] = useState(null);

  const candles = useMemo(
    () =>
      prices
        .map((price) => {
          const date = new Date(price.date);
          const open = Number(price.open);
          const high = Number(price.high);
          const low = Number(price.low);
          const close = Number(price.close);
          const volume = Number(price.volume);

          if (
            !Number.isFinite(date.getTime()) ||
            ![open, high, low, close, volume].every(Number.isFinite)
          ) {
            return null;
          }

          return {
            time: date.toISOString().slice(0, 10),
            open,
            high,
            low,
            close,
            volume,
          };
        })
        .filter((candle) => candle !== null)
        .sort((left, right) => left.time.localeCompare(right.time)),
    [prices]
  );

  const visibleCandles = useMemo(() => {
    const selectedRange = chartRanges.find((item) => item.label === range);
    return candles.slice(-selectedRange.candles);
  }, [candles, range]);

  const ema9 = useMemo(
    () => calculateEma(visibleCandles, 9),
    [visibleCandles]
  );
  const ema21 = useMemo(
    () => calculateEma(visibleCandles, 21),
    [visibleCandles]
  );

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container || visibleCandles.length === 0) {
      setHoveredCandle(null);
      return undefined;
    }

    const latestCandle = visibleCandles[visibleCandles.length - 1];
    setHoveredCandle(latestCandle);

    const chart = createChart(container, {
      width: container.clientWidth,
      height: 440,
      layout: {
        background: { type: "solid", color: "#09090b" },
        textColor: "#a3a3a3",
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.055)" },
        horzLines: { color: "rgba(255, 255, 255, 0.08)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "#737373",
          labelBackgroundColor: "#262626",
        },
        horzLine: {
          color: "#737373",
          labelBackgroundColor: "#262626",
        },
      },
      rightPriceScale: {
        borderColor: "#303030",
        scaleMargins: { top: 0.08, bottom: 0.22 },
      },
      timeScale: {
        borderColor: "#303030",
        rightOffset: 4,
        timeVisible: false,
        fixLeftEdge: true,
      },
      localization: {
        priceFormatter: (price) => price.toFixed(2),
      },
      handleScroll: true,
      handleScale: true,
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });
    candleSeries.setData(visibleCandles);

    const ema9Series = chart.addLineSeries({
      color: "#22c55e",
      lineWidth: 2,
      title: "EMA 9",
      priceLineVisible: false,
      lastValueVisible: false,
    });
    ema9Series.setData(ema9);

    const ema21Series = chart.addLineSeries({
      color: "#ef4444",
      lineWidth: 2,
      title: "EMA 21",
      priceLineVisible: false,
      lastValueVisible: false,
    });
    ema21Series.setData(ema21);

    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
      lastValueVisible: false,
      priceLineVisible: false,
    });
    volumeSeries.setData(
      visibleCandles.map((candle) => ({
        time: candle.time,
        value: candle.volume,
        color:
          candle.close >= candle.open
            ? "rgba(34, 197, 94, 0.45)"
            : "rgba(239, 68, 68, 0.45)",
      }))
    );
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 },
      visible: false,
    });

    chart.subscribeCrosshairMove((param) => {
      const candle = param.seriesData.get(candleSeries);
      setHoveredCandle(candle ?? latestCandle);
    });
    chart.timeScale().fitContent();

    const resizeObserver = new ResizeObserver(() => {
      if (container.clientWidth > 0) {
        chart.applyOptions({ width: container.clientWidth });
      }
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [ema9, ema21, visibleCandles]);

  const isUpCandle =
    hoveredCandle && hoveredCandle.close >= hoveredCandle.open;

  return (
    <section
      aria-labelledby="price-chart-heading"
      className="mb-8 overflow-hidden rounded-3xl border border-white/10 bg-[#09090b] shadow-2xl shadow-black/30"
    >
      <div className="border-b border-white/10 px-5 py-5 sm:px-7">
        <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
          <div>
            <h2 id="price-chart-heading" className="text-lg font-semibold">
              Candlestick chart
            </h2>
            <p className="mt-1 text-sm text-white/45">
              Daily OHLC data with volume and exponential moving averages
            </p>
          </div>
          <div className="flex flex-wrap gap-2" aria-label="Chart date range">
            {chartRanges.map((item) => (
              <button
                key={item.label}
                type="button"
                aria-pressed={range === item.label}
                onClick={() => setRange(item.label)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                  range === item.label
                    ? "border-white/30 bg-white/10 text-white"
                    : "border-white/10 text-white/50 hover:border-white/20 hover:text-white/80"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-xs">
          <span className="text-white/45">
            {hoveredCandle ? formatChartDate(hoveredCandle.time) : "—"}
          </span>
          <span className="text-white/65">
            O <span className="text-white">{hoveredCandle?.open?.toFixed(2) ?? "—"}</span>
          </span>
          <span className="text-white/65">
            H <span className="text-white">{hoveredCandle?.high?.toFixed(2) ?? "—"}</span>
          </span>
          <span className="text-white/65">
            L <span className="text-white">{hoveredCandle?.low?.toFixed(2) ?? "—"}</span>
          </span>
          <span className="text-white/65">
            C{" "}
            <span className={isUpCandle ? "text-green-400" : "text-red-400"}>
              {hoveredCandle?.close?.toFixed(2) ?? "—"}
            </span>
          </span>
          <span className="text-white/65">
            V <span className="text-white">{hoveredCandle?.volume?.toLocaleString() ?? "—"}</span>
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/55">
          <span className="inline-flex items-center gap-2">
            <i className="h-2 w-2 rounded-full bg-green-500" />
            Candles / volume
          </span>
          <span className="inline-flex items-center gap-2">
            <i className="h-0.5 w-4 bg-green-500" />
            EMA 9
          </span>
          <span className="inline-flex items-center gap-2">
            <i className="h-0.5 w-4 bg-red-500" />
            EMA 21
          </span>
        </div>
      </div>
      <div
        ref={chartContainerRef}
        aria-label="Interactive stock price candlestick chart"
        className="h-[440px] w-full"
      />
      <div className="border-t border-white/10 px-5 py-3 text-right text-xs text-white/40 sm:px-7">
        Charting library by{" "}
        <a
          href="https://www.tradingview.com/"
          target="_blank"
          rel="noreferrer"
          className="text-white/65 underline underline-offset-2 hover:text-white"
        >
          TradingView
        </a>
      </div>
    </section>
  );
}

function StockDetailPage() {
  const { symbol } = useParams();
  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchStock = async () => {
      setLoading(true);
      setError("");
      setStock(null);

      try {
        const response = await fetch(
          `/api/stocks/${encodeURIComponent(symbol)}`
        );
        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? "Stock not found."
              : `Unable to fetch stock (${response.status})`
          );
        }

        const data = await response.json();
        if (!cancelled) {
          setStock(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to fetch stock.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchStock();
    return () => {
      cancelled = true;
    };
  }, [symbol]);

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <Link
          to="/stocks"
          className="mb-8 inline-flex rounded-full border border-white/15 px-4 py-2 text-sm text-white/70 transition-colors hover:border-white/35 hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Back to stocks
        </Link>

        {loading && (
          <div
            role="status"
            className="mt-6 flex min-h-48 items-center justify-center gap-3 rounded-3xl border border-white/10 bg-white/[0.035] text-sm text-white/60"
          >
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            Loading stock...
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-3xl border border-white/10 bg-white/[0.035] px-6 py-10 text-center"
          >
            <h1 className="text-xl font-semibold text-white">
              Stock details unavailable
            </h1>
            <p className="mt-2 text-sm text-white/60">{error}</p>
          </div>
        )}

        {!loading && !error && stock && (
          <>
            <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-white/55">
                  Company profile
                </p>
                <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                  {stock.stock.name}
                </h1>
                <p className="mt-3 font-mono text-sm tracking-wider text-white/50">
                  {stock.stock.symbol}
                </p>
              </div>
              <div className="w-fit rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/45">
                  Price records
                </p>
                <p className="mt-2 text-3xl font-semibold tabular-nums">
                  {stock.prices.length}
                </p>
              </div>
            </div>

            <PriceHistoryChart prices={stock.prices} />

            <section
              aria-labelledby="price-history-heading"
              className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] shadow-2xl shadow-black/30 backdrop-blur"
            >
              <div className="border-b border-white/10 px-5 py-5 sm:px-7">
                <h2 id="price-history-heading" className="text-lg font-semibold">
                  Price history
                </h2>
                <p className="mt-1 text-sm text-white/45">
                  Historical market data for this company.
                </p>
              </div>

              {stock.prices.length === 0 ? (
                <p className="px-6 py-12 text-center text-sm text-white/55">
                  No price history is available for this stock yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[42rem] text-left text-sm">
                    <thead className="bg-white/[0.025] text-xs uppercase tracking-[0.16em] text-white/40">
                      <tr>
                        <th scope="col" className="px-5 py-4 font-medium sm:px-7">Date</th>
                        <th scope="col" className="px-5 py-4 font-medium sm:px-7">Open</th>
                        <th scope="col" className="px-5 py-4 font-medium sm:px-7">Close</th>
                        <th scope="col" className="px-5 py-4 font-medium sm:px-7">High</th>
                        <th scope="col" className="px-5 py-4 font-medium sm:px-7">Low</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.07]">
                      {stock.prices.map((price) => (
                        <tr
                          key={price.date}
                          className="transition-colors hover:bg-white/[0.035]"
                        >
                          <td className="px-5 py-4 text-white/70 sm:px-7">
                            {price.date}
                          </td>
                          <td className="px-5 py-4 tabular-nums text-white/80 sm:px-7">
                            {price.open}
                          </td>
                          <td className="px-5 py-4 tabular-nums text-white/80 sm:px-7">
                            {price.close}
                          </td>
                          <td className="px-5 py-4 tabular-nums text-white/80 sm:px-7">
                            {price.high}
                          </td>
                          <td className="px-5 py-4 tabular-nums text-white/80 sm:px-7">
                            {price.low}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        {!loading && !error && !stock && (
          <p role="alert" className="mt-6 text-center text-sm text-white/60">
            Stock details are unavailable.
          </p>
        )}
      </main>
    </div>
  );
}

export default StockDetailPage;
