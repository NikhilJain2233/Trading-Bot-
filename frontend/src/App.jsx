import React from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import myVideo from './assests/myvideo.gif'
import StocksPage from './components/StocksPage.jsx'
import StockDetailPage from './components/StockDetailPage.jsx'
 
const HomePage = () => {
  return (
    <main>
      <section
        id="hero"
        className="relative isolate flex min-h-screen flex-col overflow-hidden bg-black text-white"
      >
        <img
          src={myVideo}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-black/70" />
        <div className="hero-dot-pattern pointer-events-none absolute inset-0 z-0" />

        <div className="relative z-20">
          <Navbar />
        </div>

        <div className="relative z-10 flex flex-1 items-center px-6 py-20 sm:px-10 lg:px-16">
          <div className="mx-auto flex w-full max-w-7xl flex-col items-start">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.3em] text-white/65 sm:text-sm">
              Odesy Bot
            </p>
            <h1 className="max-w-4xl text-left text-4xl font-semibold leading-[0.98] tracking-[-0.05em] text-white sm:text-5xl md:text-5xl lg:text-7xl">
              A bot that can
              <br />
              print money for you.
            </h1>
            <Link
              to="/stocks"
              className="mt-7 inline-flex self-start items-center gap-2 rounded-full border border-transparent bg-transparent px-6 py-3 text-base font-medium text-white transition-colors hover:border-white hover:bg-black/40 focus-visible:border-white focus-visible:outline-none sm:px-9 sm:py-5 sm:text-xl"
            >
              Explore stocks
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

const App = () => (
  <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/stocks" element={<StocksPage />} />
    <Route path="/stocks/:symbol" element={<StockDetailPage />} />
    <Route path="*" element={<p>Page not found.</p>} />
  </Routes>
)

export default App
