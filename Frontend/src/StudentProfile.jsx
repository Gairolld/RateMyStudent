import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

function StudentProfile({ LightMode }) {
  const { userid } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [auth, setAuth] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [editReviewId, setEditReviewId] = useState(null);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState("");
  const [friendCodeInput, setFriendCodeInput] = useState("");
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [profileFriendStatus, setProfileFriendStatus] = useState(null);
  const [reportingReviewId, setReportingReviewId] = useState(null);
  const [reportReason, setReportReason] = useState("");
  const [pendingAppeal, setPendingAppeal] = useState(null);
  const [newSchool, setNewSchool] = useState("");
  const [appealReason, setAppealReason] = useState("");
  const [appealLoading, setAppealLoading] = useState(false);
  const REPORT_REASONS = ["Inappropriate language", "Harassment", "Spam", "Unfair review", "Other"];
  const baseText = LightMode ? "#111" : "#f3f4f6";
  const mutedText = LightMode ? "#666" : "#f3f4f6";
  const softText = LightMode ? "#444" : "#e5e7eb";
  const hintText = LightMode ? "#888" : "#d1d5db";
  const starOutline = LightMode ? "#111" : "#fff";

  useEffect(() => {
    fetch(`/api/student/${userid}`, { credentials: "include" })
      .then((res) => {
        if (res.status === 401) setAuth(false);
        return res.json();
      })
      .then((data) => {
        if (data.student) {
          setStudent(data.student);
          setReviews(data.reviews);
          setAuth(true);
        } else if (data.error === "Not authenticated.") {
          setAuth(false);
        } else {
          setError(data.error || "Failed to load student");
        }
      })
      .catch(() => setError("Failed to load student"));
  }, [userid]);

  useEffect(() => {
    fetch("/api/me", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.user_id) {
          setCurrentUserId(data.user_id);
          setCurrentUser(data);
        }
      });
  }, []);

  useEffect(() => {
    setSuccess("");
    setError("");
  }, [userid]);

  const isOwnProfile = Boolean(currentUser && String(currentUser.student_id) === String(userid));
  const canPostReview = Boolean(
    auth &&
    currentUser &&
    currentUser.role === "teacher"
  );

  const loadFriendsData = async () => {
    if (!currentUserId) return;
    setFriendsLoading(true);
    try {
      const incomingRes = await fetch("/api/friend_request/incoming", { credentials: "include" });
      const incomingData = incomingRes.ok ? await incomingRes.json() : [];
      setIncomingRequests(Array.isArray(incomingData) ? incomingData : []);

      if (isOwnProfile) {
        const friendsRes = await fetch("/api/friends", { credentials: "include" });
        const friendsData = friendsRes.ok ? await friendsRes.json() : [];
        setFriends(Array.isArray(friendsData) ? friendsData : []);
      } else {
        setFriends([]);
      }
    } catch {
      setError("Failed to load friends data");
    }
    setFriendsLoading(false);
  };

  useEffect(() => {
    loadFriendsData();
  }, [isOwnProfile, currentUserId]);

  useEffect(() => {
    if (!currentUserId || isOwnProfile) {
      setProfileFriendStatus(null);
      return;
    }

    fetch(`/api/friend_status/student/${userid}`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) {
          setProfileFriendStatus(data.status);
        } else {
          setProfileFriendStatus(null);
        }
      })
      .catch(() => setProfileFriendStatus(null));
  }, [currentUserId, isOwnProfile, userid]);

  const requestFromViewedProfile = incomingRequests.find(
    (req) => String(req.sender_student_id) === String(userid)
  );

  const goToUserProfile = (role, studentId, userId) => {
    if (role === "teacher" && userId) {
      navigate(`/teacher/${userId}`);
      return;
    }
    if (studentId) {
      navigate(`/student/${studentId}`);
    }
  };

  const handleReview = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (rating < 1 || rating > 5) {
      setError("Please select a star rating from 1 to 5.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/student/${userid}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ rating, comment }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Review posted!");
        setReviews((prev) => [...prev, { _id: data.review_id, rating, comment, user_id: currentUserId }]);
        setStudent((prev) => prev ? { ...prev, avg_rating: data.avg_rating } : prev);
        setRating(0);
        setComment("");
      } else {
        setError(data.error || "Failed to post review");
      }
    } catch {
      setError("Failed to post review");
    }
    setLoading(false);
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/review/${reviewId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Review deleted.");
        setReviews((prev) => prev.filter((r) => r._id !== reviewId));
        setStudent((prev) => prev ? { ...prev, avg_rating: data.avg_rating } : prev);
      } else {
        setError(data.error || "Failed to delete review");
      }
    } catch {
      setError("Failed to delete review");
    }
  };

  const startEdit = (review) => {
    setEditReviewId(review._id);
    setEditRating(review.rating);
    setEditComment(review.comment);
  };

  const cancelEdit = () => {
    setEditReviewId(null);
    setEditRating(0);
    setEditComment("");
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/review/${editReviewId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ rating: editRating, comment: editComment }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Review updated.");
        setReviews((prev) => prev.map((r) => r._id === editReviewId ? { ...r, rating: editRating, comment: editComment } : r));
        setStudent((prev) => prev ? { ...prev, avg_rating: data.avg_rating } : prev);
        cancelEdit();
      } else {
        setError(data.error || "Failed to update review");
      }
    } catch {
      setError("Failed to update review");
    }
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
        setError(data.error || "Failed to send friend request");
      }
    } catch {
      setError("Failed to send friend request");
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
        setError(data.error || "Failed to accept request");
      }
    } catch {
      setError("Failed to accept request");
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
        setError(data.error || "Failed to reject request");
      }
    } catch {
      setError("Failed to reject request");
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
        setError(data.error || "Failed to remove friend");
      }
    } catch {
      setError("Failed to remove friend");
    }
  };

  const handleDeleteFriendFromProfile = async () => {
    if (!window.confirm("Remove as friend?")) return;
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/friend/student/${userid}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Friend removed.");
        setProfileFriendStatus("none");
        loadFriendsData();
      } else {
        setError(data.error || "Failed to remove friend");
      }
    } catch {
      setError("Failed to remove friend");
    }
  };

  const handleAddFriendFromProfile = async () => {
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/friend_request/student/${userid}`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Friend request sent.");
        setProfileFriendStatus("outgoing_pending");
        loadFriendsData();
      } else {
        setError(data.error || "Failed to send friend request");
      }
    } catch {
      setError("Failed to send friend request");
    }
  };

  const handleReport = async (reviewId) => {
    if (!reportReason) {
      setError("Please select a reason.");
      return;
    }
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/review/${reviewId}/report`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reportReason }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Review reported.");
        setReportingReviewId(null);
        setReportReason("");
      } else {
        setError(data.error || "Failed to report review.");
      }
    } catch {
      setError("Failed to report review.");
    }
  };

  useEffect(() => {
    if (!isOwnProfile) return;
    fetch("/api/school_appeal/pending", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) {
          setPendingAppeal(data.appeal || null);
        }
      });
  }, [isOwnProfile]);

  const submitSchoolAppeal = async () => {
    setAppealLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/school_appeal", {
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

        fetch("/api/school_appeal/pending", { credentials: "include" })
          .then((res) => res.json())
          .then((data) => {
            if (data?.success) {
              setPendingAppeal(data.appeal || null);
            }
          });
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
      const res = await fetch(`/api/school_appeal/${pendingAppeal._id}`, {
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

  const renderStars = (selected, onSelect, size = 30) => (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map((value) => {
        const filled = value <= selected;
        return (
          <button
            key={value}
            type="button"
            onClick={() => onSelect(value)}
            aria-label={`Set rating to ${value}`}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              padding: 0,
              lineHeight: 1,
              fontSize: size,
              color: filled ? "#facc15" : "transparent",
              WebkitTextStroke: `1.2px ${starOutline}`,
            }}
          >
            ★
          </button>
        );
      })}
    </div>
  );

  if (error) return <div style={{ color: "red", padding: 24 }}>{error}</div>;
  if (!student) return <div style={{ padding: 24 }}>Loading...</div>;

  // doublecheck if the current teacher has already reviewed this student
  const hasReviewed = currentUser && currentUser.role === "teacher" && reviews.some(r => r.user_id === currentUserId);

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 24, color: baseText }}>
      <div style={{
        background: LightMode ? "#f5f7fa" : "#23243a",
        borderRadius: 14,
        boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
        padding: 32,
        marginBottom: 32
      }}>
        <h2 style={{ marginBottom: 8 }}>{student.name}</h2>
        <p style={{ margin: 0, color: mutedText }}>School: {student.school}</p>
        <p style={{ margin: "8px 0 0 0", color: mutedText }}>Average Rating: <b>{student.avg_rating}</b></p>
        {isOwnProfile && currentUser?.friend_code && (
          <p style={{ margin: "10px 0 0 0", color: softText }}>
            Your Friend Code: <b>{currentUser.friend_code}</b>
          </p>
        )}
      </div>

      {!isOwnProfile && requestFromViewedProfile && (
        <div style={{
          background: LightMode ? "#eef4ff" : "#1e293b",
          borderRadius: 14,
          boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
          padding: 18,
          marginBottom: 24
        }}>
          <div style={{ marginBottom: 10 }}>
            Incoming friend request from this user.
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => handleAcceptRequest(requestFromViewedProfile._id)} style={{ padding: "6px 10px", borderRadius: 6, border: "none", background: "#22c55e", color: "#fff", cursor: "pointer" }}>Accept</button>
            <button onClick={() => handleRejectRequest(requestFromViewedProfile._id)} style={{ padding: "6px 10px", borderRadius: 6, border: "none", background: "#ef4444", color: "#fff", cursor: "pointer" }}>Reject</button>
          </div>
        </div>
      )}

      {!isOwnProfile && profileFriendStatus === "none" && (
        <div style={{
          background: LightMode ? "#eef4ff" : "#1e293b",
          borderRadius: 14,
          boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
          padding: 18,
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap"
        }}>
          <span>Add this user as a friend?</span>
          <button onClick={handleAddFriendFromProfile} style={{ padding: "6px 10px", borderRadius: 6, border: "none", background: "#2563eb", color: "#fff", cursor: "pointer" }}>Add Friend</button>
        </div>
      )}

      {!isOwnProfile && profileFriendStatus === "outgoing_pending" && (
        <div style={{
          background: LightMode ? "#eef4ff" : "#1e293b",
          borderRadius: 14,
          boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
          padding: 18,
          marginBottom: 24
        }}>
          Friend request pending.
        </div>
      )}

      {!isOwnProfile && profileFriendStatus === "friends" && (
        <div style={{
          background: LightMode ? "#eef4ff" : "#1e293b",
          borderRadius: 14,
          boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
          padding: 18,
          marginBottom: 24
        ,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap"
        }}>
          <span>Friends We Are</span>
          <button
            onClick={handleDeleteFriendFromProfile}
            style={{ padding: "6px 10px", borderRadius: 6, border: "none", background: "#ef4444", color: "#fff", cursor: "pointer" }}
          >
            Betray Friend?
          </button>
        </div>
      )}

      {isOwnProfile && (
        <div style={{
          background: LightMode ? "#eef4ff" : "#1e293b",
          borderRadius: 14,
          boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
          padding: 24,
          marginBottom: 32
        }}>
          <h3 style={{ marginTop: 0, marginBottom: 12 }}>Friends</h3>

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
          {friendsLoading && <div style={{ color: "#777" }}>Loading friends...</div>}
          {!friendsLoading && incomingRequests.length === 0 && <div style={{ color: "#777", marginBottom: 12 }}>No incoming requests.</div>}
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
          {!friendsLoading && friends.length === 0 && <div style={{ color: "#777" }}>No friends yet.</div>}
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

      {isOwnProfile && currentUser?.role === "student" && (
        <div style={{
          background: LightMode ? "#eef4ff" : "#1e293b",
          borderRadius: 14,
          boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
          padding: 20,
          marginBottom: 24,
        }}>
          <h3 style={{ marginTop: 0, color: baseText }}>Appeal School Change</h3>
          {pendingAppeal ? (
            <div>
              <div style={{ color: hintText, marginBottom: 6 }}>
                Pending appeal to change school to: <b>{pendingAppeal.new_school}</b>
              </div>
              <div style={{ color: hintText, marginBottom: 10 }}>
                Reason: {pendingAppeal.reason}
              </div>
              <div style={{ color: hintText, marginBottom: 10 }}>
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
          {success && <div style={{ marginTop: 10, color: "#22c55e" }}>{success}</div>}
          {error && <div style={{ marginTop: 10, color: "#ef4444" }}>{error}</div>}
        </div>
      )}

      <h3 style={{ marginBottom: 12, color: baseText }}>Reviews</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 32 }}>
        {reviews.length === 0 && <div style={{ color: hintText }}>No reviews yet.</div>}
        {reviews.map((r, i) => (
          <div key={r._id || i} style={{
            background: LightMode ? "#fff" : "#18192b",
            borderRadius: 10,
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            padding: 18,
            borderLeft: `6px solid ${r.rating >= 4 ? '#22c55e' : r.rating >= 2 ? '#facc15' : '#ef4444'}`
          }}>
            {editReviewId === r._id ? (
              <form onSubmit={handleEdit} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ marginBottom: 6 }}>{renderStars(editRating, setEditRating, 40)}</div>
                <input type="number" min="1" max="5" value={editRating} onChange={e => setEditRating(Number(e.target.value))} required style={{ display: 'none' }} />
                <input value={editComment} onChange={e => setEditComment(e.target.value)} required style={{ padding: 8, borderRadius: 6, border: "1px solid #ccc", fontSize: 15 }} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="submit" style={{ padding: "6px 16px", borderRadius: 6, background: "#2563eb", color: "#fff", border: "none", cursor: "pointer" }}>Save</button>
                  <button type="button" onClick={cancelEdit} style={{ padding: "6px 16px", borderRadius: 6, background: "#888", color: "#fff", border: "none", cursor: "pointer" }}>Cancel</button>
                </div>
              </form>
            ) : (
              <>
                <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 4 }}>Rating: {r.rating} / 5</div>
                <div style={{ color: softText, fontSize: 15 }}>{r.comment}</div>
                {currentUserId && r.user_id === currentUserId && (
                  <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                    <button onClick={() => startEdit(r)} style={{ padding: "6px 16px", borderRadius: 6, background: "#facc15", color: "#000", border: "none", cursor: "pointer" }}>Edit</button>
                    <button onClick={() => handleDelete(r._id)} style={{ padding: "6px 16px", borderRadius: 6, background: "#ef4444", color: "#fff", border: "none", cursor: "pointer" }}>Delete</button>
                  </div>
                )}
                {currentUserId && r.user_id !== currentUserId && (
                  <div style={{ marginTop: 8 }}>
                    {reportingReviewId === r._id ? (
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <select
                          value={reportReason}
                          onChange={e => setReportReason(e.target.value)}
                          style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid #ccc", fontSize: 14 }}
                        >
                          <option value="">Select reason...</option>
                          {REPORT_REASONS.map(reason => (
                            <option key={reason} value={reason}>{reason}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleReport(r._id)}
                          style={{ padding: "6px 14px", borderRadius: 6, background: "#ef4444", color: "#fff", border: "none", cursor: "pointer", fontSize: 14 }}
                        >
                          Submit
                        </button>
                        <button
                          onClick={() => { setReportingReviewId(null); setReportReason(""); }}
                          style={{ padding: "6px 14px", borderRadius: 6, background: "#888", color: "#fff", border: "none", cursor: "pointer", fontSize: 14 }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setReportingReviewId(r._id); setReportReason(""); }}
                        style={{ padding: "4px 12px", borderRadius: 6, background: "transparent", color: hintText, border: `1px solid ${hintText}`, cursor: "pointer", fontSize: 13 }}
                      >
                        Report
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
      <h3 style={{ marginBottom: 10, color: baseText }}>Post a Review</h3>
      {canPostReview && hasReviewed ? (
        <div style={{ color: hintText, marginBottom: 32 }}>
          You have already submitted a review for this student.
        </div>
      ) : canPostReview ? (
        <div style={{
          background: LightMode ? "#fff" : "#18192b",
          borderRadius: 10,
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          padding: 18,
          marginBottom: 32
        }}>
          <form onSubmit={handleReview} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <div style={{ marginBottom: 6, color: baseText }}>Rating</div>
              {renderStars(rating, setRating, 40)}
            </div>
            <input value={comment} onChange={e => setComment(e.target.value)} placeholder="Comment" required disabled={loading}
              style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc", fontSize: 16 }} />
            <button type="submit" disabled={loading} style={{ padding: "10px 0", borderRadius: 6, background: "#2563eb", color: "#fff", fontWeight: 600, fontSize: 16, border: "none", cursor: "pointer" }}>{loading ? "Submitting..." : "Submit"}</button>
          </form>
        </div>
      ) : auth && currentUser?.role === "teacher" ? (
        <div style={{ color: hintText, marginTop: 8 }}>
          You can review any student.
        </div>
      ) : auth ? (
        <div style={{ color: hintText, marginTop: 8 }}>
          Only teacher accounts can post reviews.
        </div>
      ) : (
        <div style={{ color: hintText, marginTop: 8 }}>
          Please <span style={{ color: "#2563eb", cursor: "pointer" }} onClick={() => navigate('/login')}>log in</span> to post a review.
        </div>
      )}
      {success && <div style={{ color: "green", marginTop: 8 }}>{success}</div>}
      {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
    </div>
  );
}

export default StudentProfile;

