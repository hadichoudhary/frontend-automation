import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaLinkedin,
  FaFacebook,
  FaCalendarAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaMagic,
} from "react-icons/fa";
import style from "../css/dashboard.module.css";

const ACTIVITY_LABELS = {
  UPLOAD_EXCEL: "Excel Uploaded",
  PLATFORM_CONNECTED: "Platform Connected",
  PLATFORM_DISCONNECTED: "Platform Disconnected",
  PROMPT_GENERATED: "AI Prompt Used",
  PROFILE_UPDATED: "Profile Updated",
  PASSWORD_CHANGED: "Password Changed",
};

const DashboardPage = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    platforms: 0,
    totalPosts: 0,
    scheduled: 0,
    failed: 0,
  });

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const [platformRes, postRes, activityRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/platforms/linkedinStatus`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/getExcelData`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/activity/recent`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const platformData = await platformRes.json();
      const postData = await postRes.json();
      const activityData = await activityRes.json();

      const connectedCount =
        platformData.platforms?.filter(p => p.status === "connected").length || 0;

      const posts = postData.data || [];

      setStats({
        platforms: connectedCount,
        totalPosts: posts.length,
        scheduled: posts.filter(p =>
          ["published"].includes(p.status?.toLowerCase())
        ).length,

        failed: posts.filter(p => p.status === "failed").length,
      });

      setActivities(activityData.data || []);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={style.loading}>
        <div className={style.spinner}></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className={style.dashboard}>
      <h1>Automation Dashboard</h1>
      <p className={style.subtitle}>Overview of your automation activity</p>

      <div className={style.statsGrid}>
        <StatCard title="Connected Platforms" value={stats.platforms} icon={<FaLinkedin />} />
        <StatCard title="Total Posts" value={stats.totalPosts} icon={<FaCalendarAlt />} />
        <StatCard title="published" value={stats.scheduled} icon={<FaCheckCircle />} />
        <StatCard title="Failed" value={stats.failed} icon={<FaTimesCircle />} />
      </div>

      <div className={style.actions}>
        <ActionCard
          title="Generate Post"
          desc="Create content using AI"
          icon={<FaMagic />}
          onClick={() => navigate("/prompt")}
        />
        <ActionCard
          title="Manage Platforms"
          desc="Connect or disconnect platforms"
          icon={<FaFacebook />}
          onClick={() => navigate("/platforms")}
        />
        <ActionCard
          title="View Posts"
          desc="See all scheduled & published posts"
          icon={<FaCalendarAlt />}
          onClick={() => navigate("/posts")}
        />
      </div>

      <div className={style.recent}>
        <h2>Recent Activity</h2>

        {activities.length === 0 ? (
          <p className={style.empty}>No recent activity</p>
        ) : (
          <table className={style.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Activity</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {activities.map(item => (
                <tr key={item._id}>
                  <td>{new Date(item.createdAt).toLocaleString()}</td>
                  <td className={style.content}>{item.title}</td>
                  <td>
                    <span className={style.activityType}>
                      {ACTIVITY_LABELS[item.type] || item.type}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon }) => (
  <div className={style.statCard}>
    <div className={style.icon}>{icon}</div>
    <div>
      <h3>{value}</h3>
      <p>{title}</p>
    </div>
  </div>
);

const ActionCard = ({ title, desc, icon, onClick }) => (
  <div className={style.actionCard} onClick={onClick}>
    <div className={style.actionIcon}>{icon}</div>
    <h3>{title}</h3>
    <p>{desc}</p>
  </div>
);

export default DashboardPage;
