import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { saveAs } from "file-saver";

function Data() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState(searchParams.get("severity") || "All");
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("category") || "All");
  const [locationFilter, setLocationFilter] = useState(searchParams.get("location") || "All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 20;

  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/incidents`);
        const data = await res.json();
        // Sort by latest incidents first
        const sorted = (data.incidents || []).sort((a, b) => {
          const dateA = new Date(a.date_time || 0);
          const dateB = new Date(b.date_time || 0);
          return dateB - dateA;
        });
        setIncidents(sorted);
      } catch (err) {
        console.error("Error fetching incidents:", err);
        setError("Failed to load incidents");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [API_BASE_URL]);

  // Update filters from URL params
  useEffect(() => {
    const severity = searchParams.get("severity");
    const category = searchParams.get("category");
    const location = searchParams.get("location");
    if (severity) setSeverityFilter(severity);
    if (category) setCategoryFilter(category);
    if (location) setLocationFilter(location);
  }, [searchParams]);

  useEffect(() => {
    document.title = "SafeVoice Admin – Incidents";
  }, []);

  const filteredIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      const matchesSearch =
        searchTerm === "" ||
        Object.values(incident).some((val) =>
          String(val).toLowerCase().includes(searchTerm.toLowerCase())
        );
      // Normalize severity for comparison
      const incidentSeverity = typeof incident.severity === "string" 
        ? incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1).toLowerCase()
        : incident.severity;
      const filterSeverity = severityFilter === "All" ? "All" 
        : severityFilter.charAt(0).toUpperCase() + severityFilter.slice(1).toLowerCase();
      const matchesSeverity = filterSeverity === "All" || incidentSeverity === filterSeverity;
      
      // Normalize category for comparison
      const normalizeCategory = (cat) => cat
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
      const incidentCategory = incident.category ? normalizeCategory(incident.category) : "";
      const filterCategory = categoryFilter === "All" ? "All" : normalizeCategory(categoryFilter);
      const matchesCategory = filterCategory === "All" || incidentCategory === filterCategory;
      
      const matchesLocation = locationFilter === "All" || incident.location === locationFilter;
      
      let matchesDate = true;
      if (dateFrom || dateTo) {
        const incidentDate = new Date(incident.date_time);
        if (dateFrom) {
          const fromDate = new Date(dateFrom);
          fromDate.setHours(0, 0, 0, 0);
          if (incidentDate < fromDate) matchesDate = false;
        }
        if (dateTo) {
          const toDate = new Date(dateTo);
          toDate.setHours(23, 59, 59, 999);
          if (incidentDate > toDate) matchesDate = false;
        }
      }

      return matchesSearch && matchesSeverity && matchesCategory && matchesLocation && matchesDate;
    });
  }, [incidents, searchTerm, severityFilter, categoryFilter, locationFilter, dateFrom, dateTo]);

  const clearFilters = () => {
    setSearchTerm("");
    setSeverityFilter("All");
    setCategoryFilter("All");
    setLocationFilter("All");
    setDateFrom("");
    setDateTo("");
    setSearchParams({});
    setCurrentPage(1);
  };

  const paginatedIncidents = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredIncidents.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredIncidents, currentPage]);

  const totalPages = Math.ceil(filteredIncidents.length / rowsPerPage);

  const uniqueCategories = useMemo(() => {
    const normalized = incidents.map((i) => {
      if (!i.category) return null;
      return i.category
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
    });
    return [...new Set(normalized)].filter(Boolean).sort();
  }, [incidents]);

  const uniqueLocations = useMemo(() => {
    return [...new Set(incidents.map((i) => i.location))].filter(Boolean).sort();
  }, [incidents]);

  const handleDownloadCSV = () => {
    const headers = [
      "Date/Time",
      "Location",
      "Hazard Type",
      "Department",
      "Severity",
      "Description",
      "Immediate Action",
      "Category",
      "Reported By",
    ];

    const csvData = filteredIncidents.map((incident) => [
      incident.date_time || "",
      incident.location || "",
      incident.hazard_type || "",
      incident.department || "",
      incident.severity || "",
      incident.description || "",
      incident.immediate_action || "",
      incident.category || "",
      incident.reported_by || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `safevoice-incidents-${new Date().toISOString().split("T")[0]}.csv`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0a0a1a] flex items-center justify-center">
        <div className="text-white text-xl">Loading incidents...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0a0a1a] flex items-center justify-center">
        <div className="text-red-400 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0a0a1a] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white">📊 Incident Data</h1>
          <div className="flex items-center gap-2">
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg shadow transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/50 relative group"
              title="Coming Soon: Integrate with enterprise dashboards"
            >
              🔌 Plug Into Company Portal
            </button>
            <button
              className="bg-slate-700 hover:bg-slate-600 text-white font-semibold px-4 py-2 rounded-lg shadow transition-all duration-200"
              title="Export to PDF (Coming Soon)"
            >
              📄 Export PDF
            </button>
            <button
              onClick={handleDownloadCSV}
              className="bg-slate-700 hover:bg-slate-600 text-white font-semibold px-4 py-2 rounded-lg shadow transition-all duration-200"
              title="Export to CSV"
            >
              📤 Export CSV
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-gray-900/70 backdrop-blur-md rounded-xl p-6 mb-6 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.4)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <input
              type="text"
              placeholder="Search incidents..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select
              value={severityFilter}
              onChange={(e) => {
                setSeverityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Severities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Categories</option>
              {uniqueCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <select
              value={locationFilter}
              onChange={(e) => {
                setLocationFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Locations</option>
              {uniqueLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg shadow-red-500/50 hover:shadow-red-500/70"
            >
              🗑️ Clear Filters
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="date"
              placeholder="From Date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="date"
              placeholder="To Date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Results Count */}
        <div className="text-slate-300 mb-4">
          Showing {paginatedIncidents.length} of {filteredIncidents.length} incidents
        </div>

        {/* Table */}
        <div className="bg-gray-900/70 backdrop-blur-md rounded-xl overflow-hidden border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.4)]">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-700/90 backdrop-blur-sm border-b border-slate-600">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Date/Time</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Location</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Hazard Type</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Department</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Severity</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Description</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Immediate Action</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Category</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Reported By</th>
                </tr>
              </thead>
              <tbody>
                {paginatedIncidents.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                      No incidents found
                    </td>
                  </tr>
                ) : (
                  paginatedIncidents.map((incident) => (
                    <tr
                      key={incident.id}
                      className="border-b border-slate-700/50 hover:bg-slate-700/30 hover:shadow-md hover:shadow-blue-500/20 transition-all duration-200"
                    >
                      <td className="px-4 py-3 text-sm text-slate-300">
                        {incident.date_time ? new Date(incident.date_time).toLocaleString() : "N/A"}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300">{incident.location || "N/A"}</td>
                      <td className="px-4 py-3 text-sm text-slate-300">{incident.hazard_type || "N/A"}</td>
                      <td className="px-4 py-3 text-sm text-slate-300">{incident.department || "N/A"}</td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`font-semibold ${
                            incident.severity === "High"
                              ? "text-red-400"
                              : incident.severity === "Medium"
                              ? "text-yellow-400"
                              : "text-green-400"
                          }`}
                        >
                          {incident.severity || "N/A"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300 max-w-xs truncate">
                        {incident.description || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300 max-w-xs truncate">
                        {incident.immediate_action || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300">{incident.category || "N/A"}</td>
                      <td className="px-4 py-3 text-sm text-slate-300">{incident.reported_by || "N/A"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2 mt-6">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              Previous
            </button>
            <span className="text-slate-300 px-4">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Data;

