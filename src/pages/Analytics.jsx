import { useEffect, useState, useMemo } from "react";
import Plot from "react-plotly.js";

function Analytics() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/incidents`);
        const data = await res.json();
        setIncidents(data.incidents || []);
      } catch (err) {
        console.error("Error fetching incidents:", err);
        setError("Failed to load incidents");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [API_BASE_URL]);

  const chartTheme = {
    paper_bgcolor: "rgba(30, 41, 59, 0.8)",
    plot_bgcolor: "rgba(15, 23, 42, 0.5)",
    font: { color: "#cbd5e1", family: "Inter, sans-serif" },
    xaxis: { gridcolor: "rgba(148, 163, 184, 0.1)", linecolor: "#475569" },
    yaxis: { gridcolor: "rgba(148, 163, 184, 0.1)", linecolor: "#475569" },
  };

  // Incidents by Location
  const locationData = useMemo(() => {
    const locationCounts = incidents.reduce((acc, incident) => {
      const loc = incident.location || "Unknown";
      acc[loc] = (acc[loc] || 0) + 1;
      return acc;
    }, {});

    const sorted = Object.entries(locationCounts).sort((a, b) => b[1] - a[1]);
    return {
      locations: sorted.map(([loc]) => loc),
      counts: sorted.map(([, count]) => count),
    };
  }, [incidents]);

  // Incidents by Month
  const monthlyData = useMemo(() => {
    const monthCounts = {};
    incidents.forEach((incident) => {
      if (incident.date_time) {
        const date = new Date(incident.date_time);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
      }
    });

    const sorted = Object.entries(monthCounts).sort();
    return {
      months: sorted.map(([month]) => month),
      counts: sorted.map(([, count]) => count),
    };
  }, [incidents]);

  // Incidents by Severity
  const severityData = useMemo(() => {
    const severityCounts = incidents.reduce((acc, incident) => {
      const sev = incident.severity || "Unknown";
      acc[sev] = (acc[sev] || 0) + 1;
      return acc;
    }, {});

    return {
      labels: Object.keys(severityCounts),
      values: Object.values(severityCounts),
    };
  }, [incidents]);

  // Incidents by Category
  const categoryData = useMemo(() => {
    const categoryCounts = incidents.reduce((acc, incident) => {
      const cat = incident.category || "Unknown";
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});

    const sorted = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
    return {
      categories: sorted.map(([cat]) => cat),
      counts: sorted.map(([, count]) => count),
    };
  }, [incidents]);

  // Top 5 Reporters
  const topReporters = useMemo(() => {
    const reporterCounts = incidents.reduce((acc, incident) => {
      const reporter = incident.reported_by || "Unknown";
      acc[reporter] = (acc[reporter] || 0) + 1;
      return acc;
    }, {});

    const sorted = Object.entries(reporterCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      reporters: sorted.map(([reporter]) => reporter),
      counts: sorted.map(([, count]) => count),
    };
  }, [incidents]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-red-400 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">📈 Incident Insights Dashboard</h1>

        {/* Main Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Incidents by Location - Bar Chart */}
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-5 border border-slate-700 shadow-xl shadow-blue-500/10">
            <h2 className="text-lg font-semibold text-white mb-4">Incidents by Location</h2>
            <Plot
              data={[
                {
                  x: locationData.locations,
                  y: locationData.counts,
                  type: "bar",
                  marker: {
                    color: "#3b82f6",
                    line: { color: "#60a5fa", width: 1 },
                  },
                },
              ]}
              layout={{
                ...chartTheme,
                height: 350,
                showlegend: false,
                margin: { l: 50, r: 20, t: 20, b: 80 },
              }}
              config={{ displayModeBar: false, responsive: true }}
              style={{ width: "100%", height: "100%" }}
            />
          </div>

          {/* Incidents by Month - Line Chart */}
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-5 border border-slate-700 shadow-xl shadow-blue-500/10">
            <h2 className="text-lg font-semibold text-white mb-4">Incidents by Month</h2>
            <Plot
              data={[
                {
                  x: monthlyData.months,
                  y: monthlyData.counts,
                  type: "scatter",
                  mode: "lines+markers",
                  marker: { color: "#3b82f6", size: 8 },
                  line: { color: "#3b82f6", width: 3 },
                  fill: "tonexty",
                  fillcolor: "rgba(59, 130, 246, 0.1)",
                },
              ]}
              layout={{
                ...chartTheme,
                height: 350,
                showlegend: false,
                margin: { l: 50, r: 20, t: 20, b: 80 },
              }}
              config={{ displayModeBar: false, responsive: true }}
              style={{ width: "100%", height: "100%" }}
            />
          </div>

          {/* Incidents by Severity - Pie Chart */}
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-5 border border-slate-700 shadow-xl shadow-blue-500/10">
            <h2 className="text-lg font-semibold text-white mb-4">Incidents by Severity</h2>
            <Plot
              data={[
                {
                  labels: severityData.labels,
                  values: severityData.values,
                  type: "pie",
                  marker: {
                    colors: ["#10b981", "#f59e0b", "#ef4444"],
                  },
                  textinfo: "label+percent",
                  textfont: { color: "#cbd5e1" },
                },
              ]}
              layout={{
                ...chartTheme,
                height: 350,
                showlegend: true,
                legend: { x: 0.5, y: -0.1, orientation: "h" },
                margin: { l: 20, r: 20, t: 20, b: 20 },
              }}
              config={{ displayModeBar: false, responsive: true }}
              style={{ width: "100%", height: "100%" }}
            />
          </div>

          {/* Incidents by Category - Bar Chart */}
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-5 border border-slate-700 shadow-xl shadow-blue-500/10">
            <h2 className="text-lg font-semibold text-white mb-4">Incidents by Category Type</h2>
            <Plot
              data={[
                {
                  x: categoryData.categories,
                  y: categoryData.counts,
                  type: "bar",
                  marker: {
                    color: "#f59e0b",
                    line: { color: "#fbbf24", width: 1 },
                  },
                },
              ]}
              layout={{
                ...chartTheme,
                height: 350,
                showlegend: false,
                margin: { l: 50, r: 20, t: 20, b: 80 },
              }}
              config={{ displayModeBar: false, responsive: true }}
              style={{ width: "100%", height: "100%" }}
            />
          </div>
        </div>

        {/* Top 5 Reporters Leaderboard */}
        <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-5 border border-slate-700 shadow-xl shadow-blue-500/10">
          <h2 className="text-lg font-semibold text-white mb-4">Top 5 Reporters</h2>
          <Plot
            data={[
              {
                x: topReporters.counts,
                y: topReporters.reporters,
                type: "bar",
                orientation: "h",
                marker: {
                  color: "#8b5cf6",
                  line: { color: "#a78bfa", width: 1 },
                },
              },
            ]}
            layout={{
              ...chartTheme,
              height: 300,
              showlegend: false,
              margin: { l: 150, r: 20, t: 20, b: 50 },
              xaxis: { title: "Number of Reports" },
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: "100%", height: "100%" }}
          />
        </div>
      </div>
    </div>
  );
}

export default Analytics;

