/**
 * App.tsx
 *
 * Application shell and route registration for the DeepVerify frontend.
 * Uses React Router v6 and keeps the navbar persistent across pages.
 */

import { BrowserRouter, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home.tsx";
import Analyse from "./pages/Analyse.tsx";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 pb-10 pt-24 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/analyse" element={<Analyse />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
