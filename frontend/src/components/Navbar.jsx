import { Link } from "react-router-dom";
import logo from "../assests/logo.png";
import search from "../assests/search.svg";

function Navbar() {
  return (
    <header className="sticky top-0 z-30 flex w-full flex-wrap items-center justify-between gap-x-8 gap-y-4 border-b border-white/10 bg-black/75 px-5 py-3 text-white shadow-lg shadow-black/20 backdrop-blur-xl sm:px-8">
      <Link to="/" aria-label="Trading Bot home" className="shrink-0">
        <img
          src={logo}
          alt="Trading Bot"
          className="h-12 w-auto object-contain"
        />
      </Link>

      <nav aria-label="Main navigation" className="flex-1">
        <ul className="m-0 flex list-none flex-wrap items-center justify-center gap-x-6 gap-y-2 p-0 text-sm font-medium">
          <li>
            <Link
              to="/stocks"
              className="rounded-full px-3 py-2 text-white/75 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Stocks
            </Link>
          </li>
          <li className="px-3 py-2 text-white/45">Mutual funds</li>
          <li className="px-3 py-2 text-white/45">F&amp;O</li>
        </ul>
      </nav>

      <div className="flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 transition-colors focus-within:border-white/40">
        <input
          type="search"
          aria-label="Search stocks"
          placeholder="Search"
          className="w-28 bg-transparent text-sm text-white outline-none placeholder:text-white/40 sm:w-36"
        />
        <img
          src={search}
          alt=""
          aria-hidden="true"
          className="h-4 w-4 opacity-60 brightness-0 invert"
        />
      </div>
    </header>
  );
}

export default Navbar;
