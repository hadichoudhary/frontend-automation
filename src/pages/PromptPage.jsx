import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import "../css/prompt.css";

const PromptPage = () => {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [editTopic, setEditTopic] = useState("");
  const [editDay, setEditDay] = useState("daily");
  const [editTime, setEditTime] = useState("00:00");
  const [editStatus, setEditStatus] = useState("active");

  // ✅ store original values
  const [originalDay, setOriginalDay] = useState(null);
  const [originalTime, setOriginalTime] = useState(null);

  const [activeTab, setActiveTab] = useState("prompt");

  const token = localStorage.getItem("authToken");

  /* ---------------- HELPERS ---------------- */

  const buildCron = (day, time) => {
    const [hour, minute] = time.split(":");
    return day === "daily"
      ? `${minute} ${hour} * * *`
      : `${minute} ${hour} * * ${day}`;
  };

  const resetEditState = () => {
    setEditingId(null);
    setEditTopic("");
    setEditDay("daily");
    setEditTime("00:00");
    setEditStatus("active");
    setOriginalDay(null);
    setOriginalTime(null);
  };

  const mapDayToEditValue = (day) => {
    if (day === "Every day") return "daily";
    return [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ].indexOf(day).toString();
  };

  /* ---------------- API ---------------- */

  const sendPrompt = async () => {
    if (!prompt.trim()) return;

    try {
      setLoading(true);
      setResult("");

      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/prompt/send`,
        { prompt },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setResult(res.data.result);
      toast.success("Prompt generated successfully");
      await fetchSchedules();
      setActiveTab("schedules");
    } catch {
      toast.error("Failed to generate prompt");
      setResult("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedules = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/schedules`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSchedules(res.data.data || []);
    } catch (err) {
      console.error("Failed to load schedules", err);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  // ✅ FIXED saveEdit
const saveEdit = async (id) => {
  if (!editTopic.trim()) return;

  const item = schedules.find((s) => s.id === id);
  if (!item) return;

  const payload = {
    topic: editTopic,
    status: editStatus,
  };

  // build cron only if user actually changed day or time
  const currentDay = mapDayToEditValue(item.day);
  const currentTime = item.time;

  if (editDay !== currentDay || editTime !== currentTime) {
    payload.schedule_cron = buildCron(editDay, editTime);
  }

  try {
    await axios.put(
      `${import.meta.env.VITE_BACKEND_URL}/api/schedules/${id}`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    resetEditState();
    fetchSchedules();
    toast.success("Schedule updated");
  } catch (err) {
    console.error(err);
    toast.error("Update failed");
  }
};


  const deleteSchedule = async (id) => {
    if (!window.confirm("Are you sure you want to delete this schedule?")) return;

    try {
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/schedules/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSchedules((prev) => prev.filter((s) => s.id !== id));
      toast.success("Schedule deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(result);
    toast.success("Copied");
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="prompt-container">
      {/* ---------- HEADER ---------- */}
      <div className="header">
        <h1>Content Generator</h1>
        <p>Create and manage your AI-generated content</p>
      </div>

      {/* ---------- TABS ---------- */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === "prompt" ? "active" : ""}`}
          onClick={() => setActiveTab("prompt")}
        >
          Create Prompt
        </button>
        <button
          className={`tab ${activeTab === "schedules" ? "active" : ""}`}
          onClick={() => setActiveTab("schedules")}
        >
          Schedules ({schedules.length})
        </button>
      </div>

      {/* ================= PROMPT TAB (UNCHANGED) ================= */}
      {activeTab === "prompt" && (
        <div className="card">
          <div className="card-header">
            <h2>Create New Content</h2>
            <p>Describe what you want to create</p>
          </div>

          <div className="form-group">
            <label htmlFor="prompt">Your Prompt</label>
            <textarea
              id="prompt"
              rows={6}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Example: Write a social media post about our new product launch..."
              className="input"
            />
            <div className="input-info">
              <span>{prompt.length} characters</span>
              <span>Max 1000</span>
            </div>
          </div>

          <div className="quick-prompts">
            <p className="quick-title">Try these prompts:</p>
            <div className="prompt-buttons">
              <button
                className="prompt-btn"
                onClick={() =>
                  setPrompt("Create a LinkedIn post about digital marketing trends")
                }
              >
                💼 Business Post
              </button>
              <button
                className="prompt-btn"
                onClick={() =>
                  setPrompt("Write Instagram captions for a coffee shop")
                }
              >
                ☕ Social Media
              </button>
              <button
                className="prompt-btn"
                onClick={() =>
                  setPrompt("Generate blog ideas about healthy living")
                }
              >
                📝 Blog Ideas
              </button>
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={sendPrompt}
            disabled={loading || !prompt.trim()}
          >
            {loading ? "Generating..." : "Generate Content"}
          </button>

          {result && (
            <div className="result-card">
              <div className="result-header">
                <h3>Generated Content</h3>
                <button className="btn btn-small" onClick={copyToClipboard}>
                  Copy
                </button>
              </div>
              <div className="result-content">{result}</div>
            </div>
          )}
        </div>
      )}

      {/* ================= SCHEDULE TAB ================= */}
      {activeTab === "schedules" && (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Topic</th>
                  <th>Day</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {schedules.map((item) => (
                  <tr key={item.id}>
                    <td className="topic-cell">
                      {editingId === item.id ? (
                        <input
                          className="edit-input"
                          value={editTopic}
                          onChange={(e) => setEditTopic(e.target.value)}
                        />
                      ) : (
                        <span className="topic-text">{item.topic}</span>
                      )}
                    </td>

                    <td>
                      {editingId === item.id ? (
                        <select
                          value={editDay}
                          onChange={(e) => setEditDay(e.target.value)}
                        >
                          <option value="daily">Every day</option>
                          <option value="0">Sunday</option>
                          <option value="1">Monday</option>
                          <option value="2">Tuesday</option>
                          <option value="3">Wednesday</option>
                          <option value="4">Thursday</option>
                          <option value="5">Friday</option>
                          <option value="6">Saturday</option>
                        </select>
                      ) : (
                        <span className="badge">{item.day}</span>
                      )}
                    </td>

                    <td>
                      {editingId === item.id ? (
                        <input
                          type="time"
                          value={editTime}
                          onChange={(e) => setEditTime(e.target.value)}
                        />
                      ) : (
                        <span className="time-badge">{item.time}</span>
                      )}
                    </td>

                    <td>
                      {editingId === item.id ? (
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value)}
                        >
                          <option value="active">Active</option>
                          <option value="paused">Paused</option>
                        </select>
                      ) : (
                        <span className={`status status-${item.status}`}>
                          {item.status}
                        </span>
                      )}
                    </td>

                    <td>
                      {editingId === item.id ? (
                        <div className="action-buttons">
                          <button
                            className="btn btn-success btn-small"
                            onClick={() => saveEdit(item.id)}
                          >
                            Save
                          </button>
                          <button
                            className="btn btn-gray btn-small"
                            onClick={resetEditState}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="action-buttons">
                          <button
                            className="btn btn-warning btn-small"
                            onClick={() => {
                              setEditingId(item.id);
                              setEditTopic(item.topic);
                              setEditDay(mapDayToEditValue(item.day));
                              setEditTime(item.time);
                              setEditStatus(item.status || "active");

                              // store originals
                              setOriginalDay(mapDayToEditValue(item.day));
                              setOriginalTime(item.time);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-danger btn-small"
                            onClick={() => deleteSchedule(item.id)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptPage;
