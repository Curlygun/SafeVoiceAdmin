import { useEffect, useState, useMemo } from "react";
import Plot from "react-plotly.js";

function Analytics() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

  // Set page title
  useEffect(() => {
    document.title = "SafeVoice Insights";
  }, []);

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

  // Incidents by Month (formatted as "Nov 2025")
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
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    return {
      months: sorted.map(([month]) => {
        const [year, monthNum] = month.split("-");
        return `${monthNames[parseInt(monthNum) - 1]} ${year}`;
      }),
      counts: sorted.map(([, count]) => count),
    };
  }, [incidents]);

  // Incidents by Severity (normalized)
  const severityData = useMemo(() => {
    const severityCounts = incidents.reduce((acc, incident) => {
      const sev = incident.severity || "Unknown";
      // Normalize: combine "low"/"Low" → "Low", "medium"/"Medium" → "Medium", "high"/"High" → "High"
      let normalized = sev;
      if (typeof sev === "string") {
        const lower = sev.toLowerCase();
        if (lower === "low") normalized = "Low";
        else if (lower === "medium") normalized = "Medium";
        else if (lower === "high") normalized = "High";
      }
      acc[normalized] = (acc[normalized] || 0) + 1;
      return acc;
    }, {});

    // Ensure we always show Low, Medium, High in that order
    const orderedLabels = ["Low", "Medium", "High"];
    const orderedValues = orderedLabels.map((label) => severityCounts[label] || 0);

    return {
      labels: orderedLabels,
      values: orderedValues,
    };
  }, [incidents]);

  // Incidents by Category (normalized case, grouped, sorted descending)
  const categoryData = useMemo(() => {
    const categoryCounts = incidents.reduce((acc, incident) => {
      const cat = incident.category || "Unknown";
      // Normalize: capitalize first letter, rest lowercase
      const normalized = cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();
      acc[normalized] = (acc[normalized] || 0) + 1;
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
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white animate-fade-in">📈 Incident Insights Dashboard</h1>
          <button
            onClick={() => {}}
            className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg border border-blue-500/10 shadow-sm transition-all duration-200 hover:shadow-md hover:shadow-blue-500/20 active:scale-95"
            aria-label="Export PDF"
            title="Export analytics dashboard as PDF (visual demo)"
          >
            📄 Export PDF
          </button>
        </div>

        {/* Main Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Incidents by Location - Bar Chart */}
          <div className="card-premium p-5 animate-fade-in">
            <h2 className="text-lg font-semibold text-white mb-4">Incidents by Location</h2>
            <div className="w-full h-[300px] sm:h-[350px]">
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
                  autosize: true,
                }}
                config={{ displayModeBar: false, responsive: true }}
                useResizeHandler={true}
                style={{ width: "100%", height: "100%" }}
              />
            </div>
          </div>

          {/* Incidents by Month - Line Chart */}
          <div className="card-premium p-5 animate-fade-in">
            <h2 className="text-lg font-semibold text-white mb-4">Incidents by Month</h2>
            <div className="w-full h-[300px] sm:h-[350px]">
              <Plot
                data={[
                  {
                    x: monthlyData.months,
                    y: monthlyData.counts,
                    type: "scatter",
                    mode: "lines+markers",
                    marker: { color: "#3b82f6", size: 8 },
                    line: { color: "#3b82f6", width: 3, glow: true },
                    fill: "tonexty",
                    fillcolor: "rgba(59, 130, 246, 0.1)",
                  },
                ]}
                layout={{
                  ...chartTheme,
                  height: 350,
                  showlegend: false,
                  margin: { l: 50, r: 20, t: 20, b: 80 },
                  autosize: true,
                  xaxis: {
                    ...chartTheme.xaxis,
                    tickangle: -45,
                  },
                }}
                config={{ displayModeBar: false, responsive: true }}
                useResizeHandler={true}
                style={{ width: "100%", height: "100%" }}
              />
            </div>
          </div>

          {/* Incidents by Severity - Pie Chart */}
          <div className="card-premium p-5 animate-fade-in">
            <h2 className="text-lg font-semibold text-white mb-4">Incidents by Severity</h2>
            <div className="w-full h-[300px] sm:h-[350px]">
              <Plot
                data={[
                  {
                    labels: severityData.labels,
                    values: severityData.values,
                    type: "pie",
                    marker: {
                      colors: ["#3b82f6", "#60a5fa", "#93c5fd"],
                    },
                    textinfo: "label+percent+value",
                    textfont: { color: "#cbd5e1", size: 12 },
                    hovertemplate: "<b>%{label}</b><br>Count: %{value}<br>Percentage: %{percent}<extra></extra>",
                  },
                ]}
                layout={{
                  ...chartTheme,
                  height: 350,
                  showlegend: true,
                  legend: { x: 0.5, y: -0.1, orientation: "h" },
                  margin: { l: 20, r: 20, t: 20, b: 20 },
                  autosize: true,
                }}
                config={{ displayModeBar: false, responsive: true }}
                useResizeHandler={true}
                style={{ width: "100%", height: "100%" }}
              />
            </div>
          </div>

          {/* Incidents by Category - Bar Chart */}
          <div className="card-premium p-5 animate-fade-in">
            <h2 className="text-lg font-semibold text-white mb-4">Incidents by Category Type</h2>
            <div className="w-full h-[300px] sm:h-[350px]">
              <Plot
                data={[
                  {
                    x: categoryData.categories,
                    y: categoryData.counts,
                    type: "bar",
                    marker: {
                      color: ["#3b82f6", "#60a5fa", "#93c5fd", "#3b82f6", "#60a5fa", "#93c5fd"],
                      line: { color: "#60a5fa", width: 1 },
                    },
                  },
                ]}
                layout={{
                  ...chartTheme,
                  height: 350,
                  showlegend: false,
                  margin: { l: 50, r: 20, t: 20, b: 80 },
                  autosize: true,
                }}
                config={{ displayModeBar: false, responsive: true }}
                useResizeHandler={true}
                style={{ width: "100%", height: "100%" }}
              />
            </div>
          </div>
        </div>

        {/* Top 5 Reporters Leaderboard */}
        <div className="card-premium p-5 animate-fade-in">
          <h2 className="text-lg font-semibold text-white mb-4">Top 5 Reporters</h2>
          <div className="w-full h-[300px]">
            <Plot
              data={[
                {
                  x: topReporters.counts,
                  y: topReporters.reporters,
                  type: "bar",
                  orientation: "h",
                  marker: {
                    color: ["#3b82f6", "#60a5fa", "#93c5fd", "#3b82f6", "#60a5fa"],
                    line: { color: "#60a5fa", width: 1 },
                  },
                  text: topReporters.counts,
                  textposition: "auto",
                  textfont: { color: "#cbd5e1", size: 12 },
                },
              ]}
              layout={{
                ...chartTheme,
                height: 300,
                showlegend: false,
                margin: { l: 150, r: 20, t: 20, b: 50 },
                autosize: true,
                xaxis: { title: "Number of Reports" },
                yaxis: { title: "Reporter Name" },
              }}
              config={{ displayModeBar: false, responsive: true }}
              useResizeHandler={true}
              style={{ width: "100%", height: "100%" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;

