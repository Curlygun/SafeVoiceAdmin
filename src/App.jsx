import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Data from "./pages/Data";
import Analytics from "./pages/Analytics";
import Actions from "./pages/Actions";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0a0a1a] flex flex-col">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Data />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/actions" element={<Actions />} />
          </Routes>
        </main>
        <footer className="bg-gray-900/70 backdrop-blur-md border-t border-blue-500/20 py-4 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-gray-300 text-sm">
              © 2025 SafeVoice | Built at IIT Madras Innovation Hub
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

