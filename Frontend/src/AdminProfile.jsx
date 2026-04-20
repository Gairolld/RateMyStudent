import { useEffect, useState } from "react";

function AdminProfile({ LightMode }) {
  const [me, setMe] = useState(null);
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  useEffect(() => {
    loadInbox();
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
      } else {
        setError(data.error || "Failed to process appeal.");
      }
    } catch {
      setError("Failed to process appeal.");
    }
  };

  if (loading) return <div style={{ padding: 24, color: textPrimary }}>Loading...</div>;
  if (error) return <div style={{ padding: 24, color: "#ef4444" }}>{error}</div>;

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

      <div
        style={{
          background: LightMode ? "#f9fafb" : "#111827",
          borderRadius: 14,
          boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
          padding: 20,
        }}
      >
        <h3 style={{ marginTop: 0, color: textPrimary }}>Report Framework</h3>
        <div style={{ color: textSecondary }}>
          Report handling is reserved for the admin workflow. The inbox structure is in place for future implementation.
        </div>
      </div>

      {success && <div style={{ marginTop: 12, color: "#22c55e" }}>{success}</div>}
      {error && <div style={{ marginTop: 12, color: "#ef4444" }}>{error}</div>}
    </div>
  );
}

export default AdminProfile;
