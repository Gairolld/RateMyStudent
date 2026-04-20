import { useEffect, useState } from "react";

function AdminProfile({ LightMode }) {
  const [me, setMe] = useState(null);
  const [appeals, setAppeals] = useState([]);
  const [reports, setReports] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("appeals");

  const textPrimary = LightMode ? "#111827" : "#f9fafb";
  const textSecondary = LightMode ? "#374151" : "#d1d5db";

  const loadInbox = async () => {
    setLoading(true);
    setError("");
    try {
      const [meRes, inboxRes] = await Promise.all([
        fetch("/api/me", { credentials: "include" }),
        fetch("/api/admin/inbox", { credentials: "include" }),
      ]);
      const meData = await meRes.json();
      const inboxData = await inboxRes.json();

      if (!meData?.success || meData?.role !== "admin") {
        setError("Admin access only.");
        setLoading(false);
        return;
      }
      if (!inboxData?.success) {
        setError(inboxData?.error || "Failed to load admin inbox.");
        setLoading(false);
        return;
      }

      setMe(meData);
      setAppeals(Array.isArray(inboxData.appeals) ? inboxData.appeals : []);
    } catch {
      setError("Failed to load admin inbox.");
    }
    setLoading(false);
  };

  const loadReports = async () => {
    try {
      const res = await fetch("/api/admin/reports", { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setReports(data.reports);
      }
    } catch {
      setError("Failed to load reports.");
    }
  };

  const loadLogs = async () => {
    try {
      const res = await fetch("/api/admin/logs", { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
      }
    } catch {
      setError("Failed to load logs.");
    }
  };

  useEffect(() => {
    loadInbox();
    loadReports();
    loadLogs();
  }, []);

  const processAppeal = async (appealId, action) => {
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/admin/appeal/${appealId}/${action}`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(data.message || "Appeal updated.");
        setAppeals((prev) => prev.filter((a) => a._id !== appealId));
        loadLogs();
      } else {
        setError(data.error || "Failed to process appeal.");
      }
    } catch {
      setError("Failed to process appeal.");
    }
  };

  const dismissReport = async (reportId) => {
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/admin/report/${reportId}/dismiss`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Report dismissed.");
        setReports((prev) => prev.filter((r) => r._id !== reportId));
        loadLogs();
      } else {
        setError(data.error || "Failed to dismiss report.");
      }
    } catch {
      setError("Failed to dismiss report.");
    }
  };

  const removeReview = async (reportId) => {
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/admin/report/${reportId}/remove`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Review removed.");
        setReports((prev) => prev.filter((r) => r._id !== reportId));
        loadLogs();
      } else {
        setError(data.error || "Failed to remove review.");
      }
    } catch {
      setError("Failed to remove review.");
    }
  };

  if (loading) return <div style={{ padding: 24, color: textPrimary }}>Loading...</div>;
  if (error && !me) return <div style={{ padding: 24, color: "#ef4444" }}>{error}</div>;

  const tabStyle = (tab) => ({
    padding: "8px 18px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    fontWeight: activeTab === tab ? 700 : 400,
    background: activeTab === tab ? (LightMode ? "#3b82f6" : "#2563eb") : (LightMode ? "#e5e7eb" : "#374151"),
    color: activeTab === tab ? "#fff" : textPrimary,
    marginRight: 8,
  });

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24, color: textPrimary }}>
      <div
        style={{
          background: LightMode ? "#f5f7fa" : "#23243a",
          borderRadius: 14,
          boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
          padding: 24,
          marginBottom: 24,
        }}
      >
        <h2 style={{ marginTop: 0, color: textPrimary }}>Admin Profile</h2>
        <p style={{ color: textSecondary }}>Username: {me?.username}</p>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: 20 }}>
        <button style={tabStyle("appeals")} onClick={() => setActiveTab("appeals")}>
          School Appeals {appeals.length > 0 && `(${appeals.length})`}
        </button>
        <button style={tabStyle("reports")} onClick={() => setActiveTab("reports")}>
          Flagged Comments {reports.length > 0 && `(${reports.length})`}
        </button>
        <button style={tabStyle("logs")} onClick={() => setActiveTab("logs")}>
          Admin Logs
        </button>
      </div>

      {/* Appeals Tab — unchanged from original */}
      {activeTab === "appeals" && (
        <div
          style={{
            background: LightMode ? "#eef4ff" : "#1e293b",
            borderRadius: 14,
            boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
            padding: 20,
            marginBottom: 24,
          }}
        >
          <h3 style={{ marginTop: 0, color: textPrimary }}>School Change Appeals</h3>
          {appeals.length === 0 && <div style={{ color: textSecondary }}>No pending appeals.</div>}
          {appeals.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {appeals.map((a) => (
                <div key={a._id} style={{ background: LightMode ? "#fff" : "#111827", borderRadius: 8, padding: 12 }}>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>{a.teacher_full_name || a.teacher_username}</div>
                  <div style={{ color: textSecondary, marginBottom: 4 }}>Current: {a.current_school || "N/A"}</div>
                  <div style={{ color: textSecondary, marginBottom: 4 }}>Requested: {a.new_school}</div>
                  <div style={{ color: textSecondary, marginBottom: 10 }}>Reason: {a.reason}</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => processAppeal(a._id, "approve")} style={{ border: "none", borderRadius: 6, background: "#22c55e", color: "#fff", padding: "6px 10px", cursor: "pointer" }}>Approve</button>
                    <button onClick={() => processAppeal(a._id, "reject")} style={{ border: "none", borderRadius: 6, background: "#ef4444", color: "#fff", padding: "6px 10px", cursor: "pointer" }}>Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Flagged Comments Tab */}
      {activeTab === "reports" && (
        <div
          style={{
            background: LightMode ? "#fff7ed" : "#1e293b",
            borderRadius: 14,
            boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
            padding: 20,
            marginBottom: 24,
          }}
        >
          <h3 style={{ marginTop: 0, color: textPrimary }}>Flagged Comments</h3>
          {reports.length === 0 && <div style={{ color: textSecondary }}>No flagged comments.</div>}
          {reports.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {reports.map((r) => (
                <div key={r._id} style={{ background: LightMode ? "#fff" : "#111827", borderRadius: 8, padding: 12 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4, color: textPrimary }}>
                    Report Reason: {r.reason}
                  </div>
                  <div style={{ color: textSecondary, marginBottom: 4 }}>
                    Reported by: {r.reporter_username}
                  </div>
                  <div style={{ color: textSecondary, marginBottom: 4 }}>
                    Review Comment: &quot;{r.review_comment}&quot;
                  </div>
                  <div style={{ color: textSecondary, marginBottom: 4 }}>
                    Rating: {r.review_rating} / 5
                  </div>
                  <div style={{ color: textSecondary, marginBottom: 10, fontSize: 12 }}>
                    Reported at: {r.created_at}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => dismissReport(r._id)}
                      style={{ border: "none", borderRadius: 6, background: "#6b7280", color: "#fff", padding: "6px 10px", cursor: "pointer" }}
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => removeReview(r._id)}
                      style={{ border: "none", borderRadius: 6, background: "#ef4444", color: "#fff", padding: "6px 10px", cursor: "pointer" }}
                    >
                      Remove Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Admin Logs Tab */}
      {activeTab === "logs" && (
        <div
          style={{
            background: LightMode ? "#f9fafb" : "#111827",
            borderRadius: 14,
            boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
            padding: 20,
            marginBottom: 24,
          }}
        >
          <h3 style={{ marginTop: 0, color: textPrimary }}>Admin Action Log</h3>
          {logs.length === 0 && <div style={{ color: textSecondary }}>No actions logged yet.</div>}
          {logs.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {logs.map((log) => (
                <div key={log._id} style={{ background: LightMode ? "#fff" : "#1e293b", borderRadius: 8, padding: 10 }}>
                  <div style={{ fontWeight: 600, color: textPrimary }}>{log.action}</div>
                  <div style={{ color: textSecondary, fontSize: 12 }}>
                    Review ID: {log.review_id}
                  </div>
                  <div style={{ color: textSecondary, fontSize: 12 }}>
                    {log.timestamp}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {success && <div style={{ marginTop: 12, color: "#22c55e" }}>{success}</div>}
      {error && <div style={{ marginTop: 12, color: "#ef4444" }}>{error}</div>}
    </div>
  );
}

export default AdminProfile;
