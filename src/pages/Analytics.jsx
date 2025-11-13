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
    // Only update timestamp, no re-fetch (visual only)
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

  const handleChartClick = (filterType, filterValue) => {
    navigate("/", { state: { filterType, filterValue } });
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
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-white animate-fade-in">📈 Incident Insights Dashboard</h1>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-300">
                Last Synced: {lastSynced.toLocaleTimeString()}
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input type="checkbox" className="rounded" disabled />
                Auto-refresh every 5 min
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {safe(locationData.locations) && safe(locationData.counts) && locationData.locations.length > 0 && (
              <div className="bg-gray-900/70 backdrop-blur-md rounded-xl p-5 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.4)] animate-fade-in">
                <h2 className="text-lg font-semibold text-white mb-4">Incidents by Location</h2>
                <div className="w-full h-[300px] sm:h-[350px]">
                  <Plot
                    data={[{ x: locationData.locations, y: locationData.counts, type: "bar", marker: { color: "#3b82f6", line: { color: "#60a5fa", width: 1 } } }]}
                    layout={{ ...chartTheme, height: 350, autosize: true, margin: { l: 50, r: 20, t: 20, b: 80 }, showlegend: false }}
                    config={{ responsive: true, displayModeBar: false }}
                    style={{ width: "100%", height: "100%" }}
                    onClick={(data) => {
                      if (data?.points?.[0]?.x) {
                        handleChartClick("location", data.points[0].x);
                      }
                    }}
                  />
                </div>
              </div>
            )}

            {safe(monthlyData.months) && safe(monthlyData.counts) && monthlyData.months.length > 0 && (
              <div className="bg-gray-900/70 backdrop-blur-md rounded-xl p-5 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.4)] animate-fade-in">
                <h2 className="text-lg font-semibold text-white mb-4">Incidents by Month</h2>
                <div className="w-full h-[300px] sm:h-[350px]">
                  <Plot
                    data={[
                      {
                        x: monthlyData.months,
                        y: monthlyData.counts,
                        type: "scatter",
                        mode: "lines+markers",
                        line: { color: "#3b82f6", width: 3, shape: "spline" },
                        marker: { color: "#60a5fa", size: 8 },
                        fill: "tonexty",
                        fillcolor: "rgba(59, 130, 246, 0.1)",
                      },
                    ]}
                    layout={{ ...chartTheme, height: 350, autosize: true, margin: { l: 50, r: 20, t: 20, b: 80 }, showlegend: false, xaxis: { ...chartTheme.xaxis, tickangle: -45 } }}
                    config={{ responsive: true, displayModeBar: false }}
                    style={{ width: "100%", height: "100%" }}
                  />
                </div>
              </div>
            )}

            {safe(severityData.values) && severityData.values.some(v => v > 0) && (
              <div className="bg-gray-900/70 backdrop-blur-md rounded-xl p-5 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.4)] animate-fade-in">
                <h2 className="text-lg font-semibold text-white mb-4">Incidents by Severity</h2>
                <div className="w-full h-[300px] sm:h-[350px]">
                  <Plot
                    data={[
                      {
                        labels: severityData.labels,
                        values: severityData.values,
                        type: "pie",
                        marker: { colors: ["#3b82f6", "#60a5fa", "#93c5fd"] },
                        textinfo: "label+percent+value",
                        textfont: { color: "#cbd5e1", size: 12 },
                        hovertemplate: "<b>%{label}</b><br>Count: %{value}<br>Percentage: %{percent}<extra></extra>",
                      },
                    ]}
                    layout={{ ...chartTheme, height: 350, autosize: true, showlegend: true, legend: { x: 0.5, y: -0.1, orientation: "h" }, margin: { l: 20, r: 20, t: 20, b: 20 } }}
                    config={{ responsive: true, displayModeBar: false }}
                    style={{ width: "100%", height: "100%" }}
                    onClick={(data) => {
                      if (data?.points?.[0]?.label) {
                        handleChartClick("severity", data.points[0].label);
                      }
                    }}
                  />
                </div>
              </div>
            )}

            {safe(categoryData.categories) && safe(categoryData.counts) && categoryData.categories.length > 0 && (
              <div className="bg-gray-900/70 backdrop-blur-md rounded-xl p-5 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.4)] animate-fade-in">
                <h2 className="text-lg font-semibold text-white mb-4">Incidents by Category Type</h2>
                <div className="w-full h-[300px] sm:h-[350px]">
                  <Plot
                    data={[
                      {
                        x: categoryData.categories,
                        y: categoryData.counts,
                        type: "bar",
                        marker: { color: "#3b82f6", line: { color: "#60a5fa", width: 1 } },
                      },
                    ]}
                    layout={{ ...chartTheme, height: 350, autosize: true, margin: { l: 50, r: 20, t: 20, b: 80 }, showlegend: false, xaxis: { ...chartTheme.xaxis, tickangle: -45 } }}
                    config={{ responsive: true, displayModeBar: false }}
                    style={{ width: "100%", height: "100%" }}
                    onClick={(data) => {
                      if (data?.points?.[0]?.x) {
                        handleChartClick("category", data.points[0].x);
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {safe(topReporters.reporters) && safe(topReporters.counts) && topReporters.reporters.length > 0 && (
            <div className="bg-gray-900/70 backdrop-blur-md rounded-xl p-5 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.4)] animate-fade-in">
              <h2 className="text-lg font-semibold text-white mb-4">Top 5 Reporters</h2>
              <div className="w-full h-[300px]">
                <Plot
                  data={[
                    {
                      x: topReporters.counts,
                      y: topReporters.reporters,
                      type: "bar",
                      orientation: "h",
                      marker: { color: "#3b82f6", line: { color: "#60a5fa", width: 1 } },
                      text: topReporters.counts,
                      textposition: "auto",
                      textfont: { color: "#cbd5e1", size: 12 },
                    },
                  ]}
                  layout={{ ...chartTheme, height: 300, autosize: true, margin: { l: 150, r: 20, t: 20, b: 50 }, showlegend: false, xaxis: { title: "Number of Reports" }, yaxis: { title: "Reporter Name" } }}
                  config={{ responsive: true, displayModeBar: false }}
                  style={{ width: "100%", height: "100%" }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </Suspense>
  );
}


export default Analytics;

