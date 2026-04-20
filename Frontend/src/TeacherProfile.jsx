import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

function TeacherProfile({ LightMode }) {
  const { teacherid } = useParams();
  const navigate = useNavigate();

  const [teacher, setTeacher] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isOwner, setIsOwner] = useState(false);
  const [canViewReviews, setCanViewReviews] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [appealLoading, setAppealLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editName, setEditName] = useState("");
  const [pendingAppeal, setPendingAppeal] = useState(null);
  const [newSchool, setNewSchool] = useState("");
  const [appealReason, setAppealReason] = useState("");
  const [friendCodeInput, setFriendCodeInput] = useState("");
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(false);

  const textPrimary = LightMode ? "#111827" : "#f9fafb";
  const textSecondary = LightMode ? "#374151" : "#d1d5db";

  const loadProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const [profileRes, appealRes] = await Promise.all([
        fetch(`/api/teacher/${teacherid}`, { credentials: "include" }),
        fetch("/api/teacher/school_appeal/pending", { credentials: "include" }),
      ]);
      const data = await profileRes.json();
      const appealData = await appealRes.json();

      if (!profileRes.ok || !data.success) {
        setError(data.error || "Failed to load teacher profile.");
        setLoading(false);
        return;
      }

      setTeacher(data.teacher);
      setReviews(Array.isArray(data.reviews) ? data.reviews : []);
      setIsOwner(Boolean(data.is_owner));
      setCanViewReviews(Boolean(data.can_view_reviews));

      setEditName(data.teacher.full_name || "");
      if (appealData?.success) {
        setPendingAppeal(appealData.appeal || null);
      }
    } catch {
      setError("Failed to load teacher profile.");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProfile();
  }, [teacherid]);

  const loadFriendsData = async () => {
    if (!isOwner) return;
    setFriendsLoading(true);
    try {
      const [incomingRes, friendsRes] = await Promise.all([
        fetch("/api/friend_request/incoming", { credentials: "include" }),
        fetch("/api/friends", { credentials: "include" }),
      ]);
      const incomingData = incomingRes.ok ? await incomingRes.json() : [];
      const friendsData = friendsRes.ok ? await friendsRes.json() : [];
      setIncomingRequests(Array.isArray(incomingData) ? incomingData : []);
      setFriends(Array.isArray(friendsData) ? friendsData : []);
    } catch {
      setError("Failed to load friends data.");
    }
    setFriendsLoading(false);
  };

  useEffect(() => {
    loadFriendsData();
  }, [isOwner]);

  const goToUserProfile = (role, studentId, userId) => {
    if (role === "teacher" && userId) {
      navigate(`/teacher/${userId}`);
      return;
    }
    if (studentId) {
      navigate(`/student/${studentId}`);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/teacher/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          full_name: editName,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Teacher profile updated.");
        setTeacher(data.teacher);
      } else {
        setError(data.error || "Failed to update profile.");
      }
    } catch {
      setError("Failed to update profile.");
    }
    setSaving(false);
  };

  const toggleReviewVisibility = async (reviewId, currentVisible) => {
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/teacher/review/${reviewId}/visibility`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ visible_to_friends: !currentVisible }),
      });
      const data = await res.json();
      if (data.success) {
        setReviews((prev) =>
          prev.map((r) =>
            r._id === reviewId ? { ...r, visible_to_friends: data.visible_to_friends } : r
          )
        );
      } else {
        setError(data.error || "Failed to update review visibility.");
      }
    } catch {
      setError("Failed to update review visibility.");
    }
  };

  const submitSchoolAppeal = async () => {
    setAppealLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/teacher/school_appeal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ new_school: newSchool, reason: appealReason }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("School change appeal submitted.");
        setNewSchool("");
        setAppealReason("");
        loadProfile();
      } else {
        setError(data.error || "Failed to submit appeal.");
      }
    } catch {
      setError("Failed to submit appeal.");
    }
    setAppealLoading(false);
  };

  const deletePendingAppeal = async () => {
    if (!pendingAppeal?._id) return;
    if (!window.confirm("Delete your pending school appeal?")) return;
    setAppealLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/teacher/school_appeal/${pendingAppeal._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Pending appeal deleted.");
        setPendingAppeal(null);
      } else {
        setError(data.error || "Failed to delete pending appeal.");
      }
    } catch {
      setError("Failed to delete pending appeal.");
    }
    setAppealLoading(false);
  };

  const handleSendFriendRequest = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const code = friendCodeInput.trim().toUpperCase();
    if (!code) return;
    try {
      const res = await fetch(`/api/friend_request/${encodeURIComponent(code)}`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Friend request sent.");
        setFriendCodeInput("");
      } else {
        setError(data.error || "Failed to send friend request.");
      }
    } catch {
      setError("Failed to send friend request.");
    }
  };

  const handleAcceptRequest = async (requestId) => {
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/friend_request/${requestId}/accept`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Friend request accepted.");
        loadFriendsData();
      } else {
        setError(data.error || "Failed to accept request.");
      }
    } catch {
      setError("Failed to accept request.");
    }
  };

  const handleRejectRequest = async (requestId) => {
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/friend_request/${requestId}/reject`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Friend request rejected.");
        loadFriendsData();
      } else {
        setError(data.error || "Failed to reject request.");
      }
    } catch {
      setError("Failed to reject request.");
    }
  };

  const handleDeleteFriend = async (friendId) => {
    if (!window.confirm("Remove as friend?")) return;
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/friend/${friendId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Friend removed.");
        loadFriendsData();
      } else {
        setError(data.error || "Failed to remove friend.");
      }
    } catch {
      setError("Failed to remove friend.");
    }
  };

  if (loading) {
    return <div style={{ padding: 24, color: textPrimary }}>Loading...</div>;
  }

  if (error) {
    return <div style={{ padding: 24, color: "#ef4444" }}>{error}</div>;
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 24, color: textPrimary }}>
      <div
        style={{
          background: LightMode ? "#f5f7fa" : "#23243a",
          borderRadius: 14,
          boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
          padding: 24,
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, color: textPrimary }}>{teacher?.full_name || "Teacher"}</h2>
            <p style={{ color: textSecondary, marginTop: 8 }}>School: {teacher?.school || "Not set"}</p>
            {isOwner && (
              <p style={{ color: textSecondary, marginTop: 8 }}>
                Your Friend Code: <b>{teacher?.friend_code || "-"}</b>
              </p>
            )}
          </div>
        </div>
      </div>

      {isOwner && (
        <div
          style={{
            background: LightMode ? "#eef4ff" : "#1e293b",
            borderRadius: 14,
            boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
            padding: 20,
            marginBottom: 24,
          }}
        >
          <h3 style={{ marginTop: 0, color: textPrimary }}>Edit Profile</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Teacher name"
              style={{ padding: 10, borderRadius: 6, border: "1px solid #9ca3af", fontSize: 15 }}
            />
            <div style={{ color: textSecondary, fontSize: 14 }}>
              School is fixed after account creation.
            </div>
            <button
              type="button"
              onClick={saveProfile}
              disabled={saving}
              style={{
                padding: "10px 14px",
                borderRadius: 6,
                border: "none",
                background: "#2563eb",
                color: "#fff",
                cursor: "pointer",
                fontWeight: 600,
                width: "fit-content",
              }}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
          {success && <div style={{ marginTop: 10, color: "#22c55e" }}>{success}</div>}
          {error && <div style={{ marginTop: 10, color: "#ef4444" }}>{error}</div>}
        </div>
      )}

      {isOwner && (
        <div
          style={{
            background: LightMode ? "#eef4ff" : "#1e293b",
            borderRadius: 14,
            boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
            padding: 20,
            marginBottom: 24,
          }}
        >
          <h3 style={{ marginTop: 0, color: textPrimary }}>Appeal School Change</h3>
          {pendingAppeal ? (
            <div>
              <div style={{ color: textSecondary, marginBottom: 6 }}>
                Pending appeal to change school to: <b>{pendingAppeal.new_school}</b>
              </div>
              <div style={{ color: textSecondary, marginBottom: 10 }}>
                Reason: {pendingAppeal.reason}
              </div>
              <div style={{ color: textSecondary, marginBottom: 10 }}>
                You can only have one pending appeal at a time. Delete this one to send a new appeal.
              </div>
              <button
                type="button"
                onClick={deletePendingAppeal}
                disabled={appealLoading}
                style={{ border: "none", borderRadius: 6, background: "#ef4444", color: "#fff", padding: "8px 12px", cursor: "pointer" }}
              >
                {appealLoading ? "Deleting..." : "Delete Pending Appeal"}
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input
                value={newSchool}
                onChange={(e) => setNewSchool(e.target.value)}
                placeholder="Requested new school"
                style={{ padding: 10, borderRadius: 6, border: "1px solid #9ca3af", fontSize: 15 }}
              />
              <textarea
                value={appealReason}
                onChange={(e) => setAppealReason(e.target.value)}
                placeholder="Reason for school change appeal"
                rows={3}
                style={{ padding: 10, borderRadius: 6, border: "1px solid #9ca3af", fontSize: 15, resize: "vertical" }}
              />
              <button
                type="button"
                onClick={submitSchoolAppeal}
                disabled={appealLoading}
                style={{ border: "none", borderRadius: 6, background: "#2563eb", color: "#fff", padding: "8px 12px", cursor: "pointer", width: "fit-content" }}
              >
                {appealLoading ? "Submitting..." : "Submit Appeal"}
              </button>
            </div>
          )}
        </div>
      )}

      {isOwner && (
        <div
          style={{
            background: LightMode ? "#eef4ff" : "#1e293b",
            borderRadius: 14,
            boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
            padding: 20,
            marginBottom: 24,
          }}
        >
          <h3 style={{ marginTop: 0, color: textPrimary }}>Friends</h3>

          <form onSubmit={handleSendFriendRequest} style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
            <input
              value={friendCodeInput}
              onChange={(e) => setFriendCodeInput(e.target.value)}
              placeholder="Enter friend code"
              maxLength={6}
              style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc", fontSize: 15, minWidth: 220 }}
            />
            <button type="submit" style={{ padding: "10px 16px", borderRadius: 6, border: "none", background: "#2563eb", color: "#fff", cursor: "pointer" }}>
              Send Request
            </button>
          </form>

          <h4 style={{ margin: "8px 0" }}>Incoming Requests</h4>
          {friendsLoading && <div style={{ color: textSecondary }}>Loading friends...</div>}
          {!friendsLoading && incomingRequests.length === 0 && <div style={{ color: textSecondary, marginBottom: 12 }}>No incoming requests.</div>}
          {!friendsLoading && incomingRequests.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
              {incomingRequests.map((req) => (
                <div key={req._id} style={{ background: LightMode ? "#fff" : "#111827", borderRadius: 8, padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <b>{req.sender_full_name || req.sender_username}</b>
                    {(req.sender_student_id || (req.sender_role === "teacher" && req.sender_user_id)) && (
                      <button
                        onClick={() => goToUserProfile(req.sender_role, req.sender_student_id, req.sender_user_id)}
                        style={{ marginLeft: 10, padding: "4px 8px", borderRadius: 6, border: "1px solid #94a3b8", background: "transparent", color: LightMode ? "#1f2937" : "#f3f4f6", cursor: "pointer" }}
                      >
                        View Profile
                      </button>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => handleAcceptRequest(req._id)} style={{ padding: "6px 10px", borderRadius: 6, border: "none", background: "#22c55e", color: "#fff", cursor: "pointer" }}>Accept</button>
                    <button onClick={() => handleRejectRequest(req._id)} style={{ padding: "6px 10px", borderRadius: 6, border: "none", background: "#ef4444", color: "#fff", cursor: "pointer" }}>Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <h4 style={{ margin: "8px 0" }}>Your Friends</h4>
          {!friendsLoading && friends.length === 0 && <div style={{ color: textSecondary }}>No friends yet.</div>}
          {!friendsLoading && friends.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {friends.map((f) => (
                <div key={f._id} style={{ background: LightMode ? "#fff" : "#111827", borderRadius: 8, padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <button
                      onClick={() => goToUserProfile(f.friend_role, f.friend_student_id, f.friend_user_id)}
                      style={{ padding: 0, border: "none", background: "transparent", color: "#2563eb", textDecoration: "underline", cursor: (f.friend_student_id || (f.friend_role === "teacher" && f.friend_user_id)) ? "pointer" : "default", fontSize: 15 }}
                      disabled={!f.friend_student_id && !(f.friend_role === "teacher" && f.friend_user_id)}
                    >
                      {f.friend_full_name || f.friend_username}
                    </button>
                  </div>
                  <button onClick={() => handleDeleteFriend(f.friend_id)} style={{ padding: "6px 10px", borderRadius: 6, border: "none", background: "#ef4444", color: "#fff", cursor: "pointer" }}>Betray Friend?</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div
        style={{
          background: LightMode ? "#f9fafb" : "#111827",
          borderRadius: 14,
          boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
          padding: 20,
        }}
      >
        <h3 style={{ marginTop: 0, color: textPrimary }}>Reviews Left</h3>
        {reviews.length === 0 && (
          <div style={{ color: textSecondary }}>No reviews posted yet.</div>
        )}
        {reviews.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {reviews.map((r) => (
              <div
                key={r._id}
                style={{
                  background: LightMode ? "#fff" : "#1f2937",
                  borderRadius: 10,
                  padding: 14,
                  borderLeft: `6px solid ${r.rating >= 4 ? "#22c55e" : r.rating >= 2 ? "#facc15" : "#ef4444"}`,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ fontWeight: 700, marginBottom: 6, color: textPrimary }}>
                    {r.student_name} - {r.rating}/5
                  </div>
                  {isOwner && (
                    <button
                      type="button"
                      title={r.visible_to_friends ? "Hide this review" : "Show this review"}
                      onClick={() => toggleReviewVisibility(r._id, Boolean(r.visible_to_friends))}
                      style={{
                        border: "none",
                        borderRadius: 8,
                        padding: "6px 10px",
                        cursor: "pointer",
                        background: LightMode ? "#e5e7eb" : "#374151",
                        color: textPrimary,
                        fontSize: 14,
                      }}
                    >
                      {r.visible_to_friends ? "👁 Visible" : "🙈 Hidden"}
                    </button>
                  )}
                </div>
                <div style={{ color: textSecondary, marginBottom: 8 }}>{r.comment}</div>
                <button
                  type="button"
                  onClick={() => navigate(`/student/${r.student_id}`)}
                  style={{
                    border: "none",
                    background: "#2563eb",
                    color: "#fff",
                    borderRadius: 6,
                    padding: "6px 10px",
                    cursor: "pointer",
                  }}
                >
                  View Student
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TeacherProfile;
