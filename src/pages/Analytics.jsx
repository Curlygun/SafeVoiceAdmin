import { useEffect, useState, useMemo, Suspense, lazy } from "react";
import { useNavigate } from "react-router-dom";

const Plot = lazy(() => import("react-plotly.js")); // lazy load Plotly safely

function Analytics() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSynced, setLastSynced] = useState(new Date());
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/incidents`);
        const data = await res.json();
        setIncidents(data.incidents || []);
        setLastSynced(new Date());
      } catch (err) {
        console.error("Error fetching incidents:", err);
        setError("Failed to load incidents");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(() => setLastSynced(new Date()), 60000);
    return () => clearInterval(interval);
  }, [API_BASE_URL]);

  const filteredIncidents = useMemo(() => {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    return incidents.filter((i) => {
      if (!i.date_time) return false;
      return new Date(i.date_time) >= ninetyDaysAgo;
    });
  }, [incidents]);

  const handleChartClick = (type, value) => {
    const params = new URLSearchParams();
    params.set(type, value);
    navigate(`/?${params.toString()}`);
  };

  const chartTheme = {
    paper_bgcolor: "rgba(30, 41, 59, 0.8)",
    plot_bgcolor: "rgba(15, 23, 42, 0.5)",
    font: { color: "#cbd5e1", family: "Inter, sans-serif" },
    xaxis: { gridcolor: "rgba(148, 163, 184, 0.1)", linecolor: "#475569" },
    yaxis: { gridcolor: "rgba(148, 163, 184, 0.1)", linecolor: "#475569" },
  };

  // --- Safe guard helper ---
  const safe = (arr) => Array.isArray(arr) && arr.length > 0;

  // Compute chart data with guards
  const locationData = useMemo(() => {
    if (!filteredIncidents.length) return { locations: [], counts: [] };
    const counts = {};
    filteredIncidents.forEach((i) => {
      const loc = i.location || "Unknown";
      counts[loc] = (counts[loc] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return { locations: sorted.map(([l]) => l), counts: sorted.map(([, c]) => c) };
  }, [filteredIncidents]);

  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const monthlyData = useMemo(() => {
    const counts = {};
    filteredIncidents.forEach((i) => {
      if (!i.date_time) return;
      const d = new Date(i.date_time);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      counts[key] = (counts[key] || 0) + 1;
    });
    const sorted = Object.entries(counts);
    return { months: sorted.map(([m]) => m), counts: sorted.map(([, c]) => c) };
  }, [filteredIncidents]);

  const severityData = useMemo(() => {
    const counts = { Low: 0, Medium: 0, High: 0 };
    incidents.forEach((i) => {
      const s = (i.severity || "").toLowerCase();
      if (s === "low") counts.Low++;
      else if (s === "medium") counts.Medium++;
      else if (s === "high") counts.High++;
    });
    return { labels: ["Low", "Medium", "High"], values: [counts.Low, counts.Medium, counts.High] };
  }, [incidents]);

  const categoryData = useMemo(() => {
    const counts = {};
    filteredIncidents.forEach((i) => {
      const cat = i.category || "Unknown";
      const norm = cat
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
      counts[norm] = (counts[norm] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return { categories: sorted.map(([c]) => c), counts: sorted.map(([, c]) => c) };
  }, [filteredIncidents]);

  const topReporters = useMemo(() => {
    const counts = {};
    incidents.forEach((i) => {
      const r = i.reported_by || "Unknown";
      counts[r] = (counts[r] || 0) + 1;
    });
    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    return { reporters: sorted.map(([r]) => r), counts: sorted.map(([, c]) => c) };
  }, [filteredIncidents]);

  if (loading)
    return <div className="min-h-screen flex items-center justify-center text-white">Loading analytics...</div>;
  if (error)
    return <div className="min-h-screen flex items-center justify-center text-red-400">{error}</div>;

  useEffect(() => {
    document.title = "SafeVoice Insights";
  }, []);

  return (
    <Suspense fallback={<div className="text-gray-400 text-center mt-20">Loading charts...</div>}>
      <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0a0a1a] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between mb-6">
            <h1 className="text-3xl font-bold text-white">📈 Incident Insights Dashboard</h1>
            <div className="text-sm text-gray-300">
              Last Synced: {lastSynced.toLocaleTimeString()}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {safe(locationData.locations) && (
              <div className="bg-gray-900/70 rounded-xl p-5 border border-blue-500/20 shadow">
                <h2 className="text-white mb-4">Incidents by Location</h2>
                <Plot
                  data={[{ x: locationData.locations, y: locationData.counts, type: "bar", marker: { color: "#3b82f6" } }]}
                  layout={{ ...chartTheme, height: 350, margin: { l: 50, r: 20, t: 20, b: 80 } }}
                  config={{ responsive: true, displayModeBar: false }}
                  useResizeHandler
                  style={{ width: "100%", height: "100%" }}
                />
              </div>
            )}

            {safe(monthlyData.months) && (
              <div className="bg-gray-900/70 rounded-xl p-5 border border-blue-500/20 shadow">
                <h2 className="text-white mb-4">Incidents by Month</h2>
                <Plot
                  data={[
                    {
                      x: monthlyData.months,
                      y: monthlyData.counts,
                      type: "scatter",
                      mode: "lines+markers",
                      line: { color: "#3b82f6", width: 3 },
                      marker: { color: "#60a5fa" },
                    },
                  ]}
                  layout={{ ...chartTheme, height: 350, margin: { l: 50, r: 20, t: 20, b: 80 } }}
                  config={{ responsive: true, displayModeBar: false }}
                  useResizeHandler
                  style={{ width: "100%", height: "100%" }}
                />
              </div>
            )}

            <div className="bg-gray-900/70 rounded-xl p-5 border border-blue-500/20 shadow">
              <h2 className="text-white mb-4">Incidents by Severity</h2>
              <Plot
                data={[
                  {
                    labels: severityData.labels,
                    values: severityData.values,
                    type: "pie",
                    marker: { colors: ["#3b82f6", "#60a5fa", "#93c5fd"] },
                    textinfo: "label+percent+value",
                  },
                ]}
                layout={{ ...chartTheme, height: 350, showlegend: true }}
                config={{ responsive: true, displayModeBar: false }}
                useResizeHandler
                style={{ width: "100%", height: "100%" }}
              />
            </div>

            {safe(categoryData.categories) && (
              <div className="bg-gray-900/70 rounded-xl p-5 border border-blue-500/20 shadow">
                <h2 className="text-white mb-4">Incidents by Category Type</h2>
                <Plot
                  data={[
                    {
                      x: categoryData.categories,
                      y: categoryData.counts,
                      type: "bar",
                      marker: { color: "#f59e0b" },
                    },
                  ]}
                  layout={{ ...chartTheme, height: 350, margin: { l: 50, r: 20, t: 20, b: 80 } }}
                  config={{ responsive: true, displayModeBar: false }}
                  useResizeHandler
                  style={{ width: "100%", height: "100%" }}
                />
              </div>
            )}
          </div>

          {safe(topReporters.reporters) && (
            <div className="bg-gray-900/70 rounded-xl p-5 border border-blue-500/20 shadow">
              <h2 className="text-white mb-4">Top 5 Reporters</h2>
              <Plot
                data={[
                  {
                    x: topReporters.counts,
                    y: topReporters.reporters,
                    type: "bar",
                    orientation: "h",
                    marker: { color: "#3b82f6" },
                    text: topReporters.counts,
                    textposition: "auto",
                  },
                ]}
                layout={{ ...chartTheme, height: 300, margin: { l: 150, r: 20, t: 20, b: 50 } }}
                config={{ responsive: true, displayModeBar: false }}
                useResizeHandler
                style={{ width: "100%", height: "100%" }}
              />
            </div>
          )}
        </div>
      </div>
    </Suspense>
  );
}


export default Analytics;

