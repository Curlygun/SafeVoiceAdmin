import { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

const STAGES = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  RESOLVED: "resolved",
};

const STAGE_LABELS = {
  [STAGES.PENDING]: "🟡 Pending Review",
  [STAGES.IN_PROGRESS]: "🔵 In Progress",
  [STAGES.RESOLVED]: "🟢 Resolved",
};

function Actions() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [incidentStatuses, setIncidentStatuses] = useState({});
  const [notes, setNotes] = useState({});

  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/incidents`);
        const data = await res.json();
        setIncidents(data.incidents || []);

        // Load saved statuses and notes from localStorage
        const savedStatuses = localStorage.getItem("incidentStatuses");
        const savedNotes = localStorage.getItem("incidentNotes");
        if (savedStatuses) {
          setIncidentStatuses(JSON.parse(savedStatuses));
        }
        if (savedNotes) {
          setNotes(JSON.parse(savedNotes));
        }
      } catch (err) {
        console.error("Error fetching incidents:", err);
        setError("Failed to load incidents");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [API_BASE_URL]);

  // Save to localStorage whenever statuses or notes change
  useEffect(() => {
    if (Object.keys(incidentStatuses).length > 0) {
      localStorage.setItem("incidentStatuses", JSON.stringify(incidentStatuses));
    }
  }, [incidentStatuses]);

  useEffect(() => {
    if (Object.keys(notes).length > 0) {
      localStorage.setItem("incidentNotes", JSON.stringify(notes));
    }
  }, [notes]);

  const getStatusForIncident = (incidentId) => {
    return incidentStatuses[incidentId] || STAGES.PENDING;
  };

  const getIncidentsByStage = (stage) => {
    return incidents.filter((incident) => getStatusForIncident(incident.id) === stage);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    const newStatus = destination.droppableId;

    setIncidentStatuses((prev) => ({
      ...prev,
      [draggableId]: newStatus,
    }));
  };

  const handleStatusChange = (incidentId, newStatus) => {
    setIncidentStatuses((prev) => ({
      ...prev,
      [incidentId]: newStatus,
    }));
  };

  const handleNotesChange = (incidentId, newNotes) => {
    setNotes((prev) => ({
      ...prev,
      [incidentId]: newNotes,
    }));
  };

  const getSeverityColor = (severity) => {
    if (severity === "High") return "text-red-400";
    if (severity === "Medium") return "text-yellow-400";
    return "text-green-400";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading incidents...</div>
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
        <h1 className="text-3xl font-bold text-white mb-6">🎯 Incident Resolution Tracker</h1>

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.values(STAGES).map((stage) => (
              <div
                key={stage}
                className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 border border-slate-700 shadow-xl shadow-blue-500/10"
              >
                <h2 className="text-lg font-semibold text-white mb-4">{STAGE_LABELS[stage]}</h2>
                <Droppable droppableId={stage}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[400px] space-y-3 ${
                        snapshot.isDraggingOver ? "bg-slate-700/30 rounded-lg" : ""
                      }`}
                    >
                      {getIncidentsByStage(stage).map((incident, index) => (
                        <Draggable key={incident.id} draggableId={String(incident.id)} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-slate-700/50 rounded-lg p-4 border border-slate-600 hover:border-blue-500 transition-all duration-200 ${
                                snapshot.isDragging ? "shadow-2xl shadow-blue-500/50" : ""
                              }`}
                            >
                              <div className="mb-3">
                                <div className="flex items-start justify-between mb-2">
                                  <h3 className="font-semibold text-white text-sm">
                                    {incident.hazard_type || "Unknown Hazard"}
                                  </h3>
                                  <span className={`text-xs font-bold ${getSeverityColor(incident.severity)}`}>
                                    {incident.severity || "N/A"}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-400 mb-2">
                                  📍 {incident.location || "Unknown Location"}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {incident.date_time
                                    ? new Date(incident.date_time).toLocaleDateString()
                                    : "No date"}
                                </p>
                              </div>

                              <div className="mb-3">
                                <label className="block text-xs text-slate-400 mb-1">Status:</label>
                                <select
                                  value={getStatusForIncident(incident.id)}
                                  onChange={(e) => handleStatusChange(incident.id, e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-full px-2 py-1 bg-slate-600 text-white text-xs rounded border border-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                  <option value={STAGES.PENDING}>Pending Review</option>
                                  <option value={STAGES.IN_PROGRESS}>In Progress</option>
                                  <option value={STAGES.RESOLVED}>Resolved</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-xs text-slate-400 mb-1">Actions Taken:</label>
                                <textarea
                                  value={notes[incident.id] || ""}
                                  onChange={(e) => handleNotesChange(incident.id, e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  placeholder="Add notes about actions taken..."
                                  className="w-full px-2 py-1 bg-slate-600 text-white text-xs rounded border border-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                                  rows="3"
                                />
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}

export default Actions;

