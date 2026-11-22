import logo from "../assests/logo.png" ;
import search from "../assests/search.svg";

function Navbar() {
  return (
    <header className="flex w-full flex-wrap items-center justify-between gap-x-8 gap-y-4 border-b border-white/15 bg-black/65 px-6 py-3 text-white backdrop-blur-md">
      <a href="/" aria-label="Trading Bot home" className="shrink-0">
        <img
          src={logo}
          alt="Trading Bot"
          className="h-12 w-auto object-contain"
        />
      </a>

      <nav aria-label="Main navigation" className="flex-1">
        <ul className="m-0 flex list-none flex-wrap items-center justify-center gap-x-8 gap-y-2 p-0">
          <li>Stocks</li>
          <li>Mutual funds</li>
          <li>F&amp;O</li>
        </ul>
      </nav>

      <div className="flex shrink-0 items-center gap-2">
        <input
          type="search"
          aria-label="Search stocks"
          placeholder="Search"
          className="w-40 rounded-md border border-gray-600 bg-black px-3 py-2 text-white placeholder:text-gray-400"
        />
        <img
          src={search}
          alt=""
          aria-hidden="true"
          className="h-5 w-5 brightness-0 invert"
        />
      </div>
    </header>
  );
}

export default Navbar;
