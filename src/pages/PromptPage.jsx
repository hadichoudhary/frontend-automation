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
  const [activeTab, setActiveTab] = useState("prompt");

  const token = localStorage.getItem("authToken");

  const sendPrompt = async () => {
    if (!prompt.trim()) return;

    try {
      setLoading(true);
      setResult("");

      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/prompt/send`,
        { prompt },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setResult(res.data.result);
      toast.success("Prompt generated successfully");
      await fetchSchedules();
      setActiveTab("schedules");
    } catch (err) {
      console.error(err);
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
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSchedules(res.data.data || []);
    } catch (err) {
      console.error("Failed to load schedules", err);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const saveEdit = async (id) => {
    if (!editTopic.trim()) return;

    try {
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/schedules/${id}`,
        { topic: editTopic },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setEditingId(null);
      setEditTopic("");
      fetchSchedules();
    } catch (err) {
      console.error("Update failed", err);
    }
  };

  const deleteSchedule = async (id) => {
    if (!window.confirm("Are you sure you want to delete this schedule?")) return;

    try {
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/schedules/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSchedules((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(result);
    alert("Copied to clipboard!");
  };

  return (
    <div className="prompt-container">
      <div className="header">
        <h1>Content Generator</h1>
        <p>Create and manage your AI-generated content</p>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'prompt' ? 'active' : ''}`}
          onClick={() => setActiveTab('prompt')}
        >
          Create Prompt
        </button>
        <button
          className={`tab ${activeTab === 'schedules' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedules')}
        >
          Schedules ({schedules.length})
        </button>
      </div>

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
                onClick={() => setPrompt("Create a LinkedIn post about digital marketing trends")}
              >
                💼 Business Post
              </button>
              <button
                className="prompt-btn"
                onClick={() => setPrompt("Write Instagram captions for a coffee shop")}
              >
                ☕ Social Media
              </button>
              <button
                className="prompt-btn"
                onClick={() => setPrompt("Generate blog ideas about healthy living")}
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
                <button
                  className="btn btn-small"
                  onClick={copyToClipboard}
                >
                  Copy
                </button>
              </div>
              <div className="result-content">
                {result}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "schedules" && (
        <div className="card">
          <div className="card-header">
            <div className="header-row">
              <div>
                <h2>Scheduled Posts</h2>
                <p>Manage your automated content</p>
              </div>
              <button
                className="btn btn-secondary"
                onClick={fetchSchedules}
              >
                Refresh
              </button>
            </div>
          </div>

          {schedules.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <h3>No Schedules Yet</h3>
              <p>Create a prompt to generate your first schedule</p>
              <button
                className="btn btn-outline"
                onClick={() => setActiveTab('prompt')}
              >
                Create Prompt
              </button>
            </div>
          ) : (
            <>
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
                              placeholder="Enter topic..."
                              autoFocus
                            />
                          ) : (
                            <span className="topic-text">{item.topic}</span>
                          )}
                        </td>
                        <td>
                          <span className="badge">{item.day}</span>
                        </td>
                        <td>
                          <span className="time-badge">{item.time}</span>
                        </td>
                        <td>
                          <span className={`status status-${item.status?.toLowerCase() || 'pending'}`}>
                            {item.status || 'Pending'}
                          </span>
                        </td>
                        <td>
                          {editingId === item.id ? (
                            <div className="action-buttons">
                              <button
                                className="btn btn-success btn-small"
                                onClick={() => saveEdit(item.id)}
                                disabled={!editTopic.trim()}
                              >
                                Save
                              </button>
                              <button
                                className="btn btn-gray btn-small"
                                onClick={() => setEditingId(null)}
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


            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PromptPage;