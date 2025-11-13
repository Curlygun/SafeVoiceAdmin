import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Data from "./pages/Data";
import Analytics from "./pages/Analytics";
import Actions from "./pages/Actions";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Navbar />
        <Routes>
          <Route path="/" element={<Data />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/actions" element={<Actions />} />
        </Routes>
      </div>
    </Router>
  );
}

