import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

function Dashboard() {
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
  }, []);

  if (loading) return <p className="text-center p-6">Loading incidents...</p>;
  if (error) return <p className="text-center text-red-600 p-6">{error}</p>;

  const total = incidents.length;
  const bySeverity = incidents.reduce((acc, i) => {
    acc[i.severity] = (acc[i.severity] || 0) + 1;
    return acc;
  }, {});
  const byCategory = incidents.reduce((acc, i) => {
    acc[i.category] = (acc[i.category] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">🧠 SafeVoice Admin Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 shadow">
          <p className="text-gray-500 text-sm">Total Incidents</p>
          <p className="text-3xl font-bold text-blue-600">{total}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow">
          <p className="text-gray-500 text-sm">High Severity</p>
          <p className="text-3xl font-bold text-red-500">{bySeverity.High || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow">
          <p className="text-gray-500 text-sm">Unsafe Acts</p>
          <p className="text-3xl font-bold text-yellow-600">{byCategory["Unsafe Act"] || 0}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-4 mb-8">
        <h2 className="text-lg font-semibold mb-3">📋 Recent Incidents</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 text-left text-sm text-gray-600">
                <th className="p-2">Date</th>
                <th className="p-2">Location</th>
                <th className="p-2">Severity</th>
                <th className="p-2">Category</th>
                <th className="p-2">Reported By</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((i) => (
                <tr key={i.id} className="border-t hover:bg-gray-50">
                  <td className="p-2">{i.date_time.slice(0, 16).replace("T", " ")}</td>
                  <td className="p-2">{i.location}</td>
                  <td
                    className={`p-2 font-semibold ${
                      i.severity === "High"
                        ? "text-red-500"
                        : i.severity === "Medium"
                        ? "text-yellow-600"
                        : "text-green-600"
                    }`}
                  >
                    {i.severity}
                  </td>
                  <td className="p-2">{i.category}</td>
                  <td className="p-2">{i.reported_by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="text-lg font-semibold mb-3">Severity Distribution</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={Object.entries(bySeverity).map(([k, v]) => ({ name: k, value: v }))}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="text-lg font-semibold mb-3">Category Breakdown</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={Object.entries(byCategory).map(([k, v]) => ({ name: k, value: v }))}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

