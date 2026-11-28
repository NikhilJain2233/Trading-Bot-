
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "./Navbar";

function StocksPage() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchStocks = async () => {
      try {
        const response = await fetch("/api/stocks");
        if (!response.ok) {
          throw new Error(`Unable to fetch stocks (${response.status})`);
        }

        const data = await response.json();
        if (!Array.isArray(data)) {
          throw new Error("The stocks response was not a list.");
        }
        if (!cancelled) {
          setStocks(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to fetch stocks.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchStocks();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="mb-8 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-white/55">
              Market overview
            </p>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Explore stocks
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55 sm:text-base">
              Browse listed companies and open a stock to view its price history.
            </p>
          </div>
          <div className="w-fit rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 shadow-xl shadow-black/20">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/45">
              Listed companies
            </p>
            <p className="mt-2 text-3xl font-semibold tabular-nums">
              {loading ? "—" : error ? "—" : stocks.length}
            </p>
          </div>
        </div>

        <section
          aria-labelledby="stock-list-heading"
          className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] shadow-2xl shadow-black/30 backdrop-blur"
        >
          <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div>
              <h2 id="stock-list-heading" className="text-lg font-semibold">
                Stock directory
              </h2>
              <p className="mt-1 text-sm text-white/45">
                Select a company to see available market data.
              </p>
            </div>
            <Link
              to="/"
              className="w-fit rounded-full border border-white/15 px-4 py-2 text-sm text-white/70 transition-colors hover:border-white/35 hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Back to home
            </Link>
          </div>

          {loading && (
            <div
              role="status"
              className="flex min-h-48 items-center justify-center gap-3 px-6 text-sm text-white/60"
            >
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              Loading stocks...
            </div>
          )}

          {error && (
            <div role="alert" className="px-6 py-12 text-center">
              <p className="font-medium text-white">Stocks couldn’t be loaded</p>
              <p className="mt-2 text-sm text-white/60">{error}</p>
            </div>
          )}

          {!loading && !error && stocks.length === 0 && (
            <p className="px-6 py-12 text-center text-sm text-white/55">
              No stocks are available yet.
            </p>
          )}

          {!loading && !error && stocks.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[32rem] text-left text-sm">
                <thead className="bg-white/[0.025] text-xs uppercase tracking-[0.16em] text-white/40">
                  <tr>
                    <th scope="col" className="px-6 py-4 font-medium sm:px-7">
                      Symbol
                    </th>
                    <th scope="col" className="px-6 py-4 font-medium sm:px-7">
                      Company name
                    </th>
                    <th scope="col" className="px-6 py-4 text-right font-medium sm:px-7">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.07]">
                  {stocks.map((stock) => (
                    <tr
                      key={stock.symbol}
                      className="transition-colors hover:bg-white/[0.035]"
                    >
                      <td className="px-6 py-4 sm:px-7">
                        <span className="rounded-md border border-white/10 bg-white/[0.05] px-2.5 py-1 font-mono text-xs font-semibold tracking-wide text-white/75">
                          {stock.symbol}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-white/85 sm:px-7">
                        {stock.name}
                      </td>
                      <td className="px-6 py-4 text-right sm:px-7">
                        <Link
                          to={`/stocks/${encodeURIComponent(stock.symbol)}`}
                          aria-label={`View ${stock.name} details`}
                          className="inline-flex items-center gap-2 rounded-full px-3 py-2 font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                        >
                          View details
                          <span aria-hidden="true">→</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default StocksPage;