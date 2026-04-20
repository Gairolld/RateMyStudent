import { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Login from "./Login";
import StudentProfile from "./StudentProfile";
import TeacherProfile from "./TeacherProfile";
import AdminProfile from "./AdminProfile";
import Header from "./Header";
import myImage from "./assets/pic1.jpg";
import myImage2 from "./assets/pic2.jpg";
import myImage3 from "./assets/pic3.webp";
import "./App.css";

function App() {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [auth, setAuth] = useState({ loggedIn: false, studentId: null, userId: null, role: null });
  const [LightMode, setLightMode] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/me", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data?.student_id) {
          setAuth({ loggedIn: true, studentId: data.student_id, userId: data.user_id, role: data.role });
          return;
        }
        if (data?.success && data?.user_id) {
          setAuth({ loggedIn: true, studentId: data.student_id || null, userId: data.user_id, role: data.role || null });
          return;
        }
        setAuth({ loggedIn: false, studentId: null, userId: null, role: null });
      })
      .catch(() => setAuth({ loggedIn: false, studentId: null, userId: null, role: null }));
  }, []);

  useEffect(() => {
    if (query.trim() === "") {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    fetch(`/search?name=${encodeURIComponent(query)}`, { credentials: "include" })
      .then(res => res.ok ? res.json() : [])
      .then(data => setSearchResults(data))
      .catch(() => setSearchResults([]))
      .finally(() => setSearching(false));
  }, [query]);

  const handleLogout = async () => {
    await fetch("/logout", { method: "POST", credentials: "include" });
    setAuth({ loggedIn: false, studentId: null, userId: null, role: null });
    navigate("/login");
  };

  return (
    <div
      className={LightMode ? "theme-light" : "theme-dark"}
      style={{ backgroundColor: LightMode ? "#fff" : "#121212", minHeight: "100vh" }}
    >
      <Header
        query={query}
        setQuery={setQuery}
        LightMode={LightMode}
        setLightMode={setLightMode}
        auth={auth}
        handleLogout={handleLogout}
        myStudentId={auth.studentId}
        myUserId={auth.userId}
        myRole={auth.role}
        searchResults={searchResults}
        searching={searching}
      />
      <Routes>
        <Route
          path="/"
          element={
            <div style={{ maxWidth: 1000, margin: "0 auto", padding: 40 }}>
              {/* Images and info */}
              <div style={{ textAlign: "center", marginBottom: 60 }}>
                <h1 style={{ fontSize: "3rem", marginBottom: 20, color: LightMode ? "#111" : "#fff" }}>Welcome to RateMyStudent</h1>
                <p style={{ fontSize: "1.2rem", color: LightMode ? "#666" : "#ccc", marginBottom: 40 }}>Connect, rate, and improve student experiences</p>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "20px", marginBottom: 60 }}>
                <div style={{ flex: 1, textAlign: "center", padding: 20, background: LightMode ? "rgba(59, 130, 246, 0.1)" : "rgba(96, 165, 250, 0.1)", borderRadius: 12 }}>
                  <img src={myImage} alt="Rate students" style={{ width: "200px", height: "133px", objectFit: "cover", borderRadius: 8, marginBottom: 20 }} />
                  <h3 style={{ color: LightMode ? "#000" : "#fff", marginBottom: 10 }}>Rate Students</h3>
                  <p style={{ color: LightMode ? "#555" : "#ccc" }}>Share your honest feedback to help students improve</p>
                </div>
                <div style={{ flex: 1, textAlign: "center", padding: 20, background: LightMode ? "rgba(59, 130, 246, 0.1)" : "rgba(96, 165, 250, 0.1)", borderRadius: 12 }}>
                  <img src={myImage2} alt="Address behavior" style={{ width: "200px", height: "133px", objectFit: "cover", borderRadius: 8, marginBottom: 20 }} />
                  <h3 style={{ color: LightMode ? "#000" : "#fff", marginBottom: 10 }}>Address Behavior</h3>
                  <p style={{ color: LightMode ? "#555" : "#ccc" }}>Report and discuss student conduct issues</p>
                </div>
                <div style={{ flex: 1, textAlign: "center", padding: 20, background: LightMode ? "rgba(59, 130, 246, 0.1)" : "rgba(96, 165, 250, 0.1)", borderRadius: 12 }}>
                  <img src={myImage3} alt="View ratings" style={{ width: "200px", height: "133px", objectFit: "cover", borderRadius: 8, marginBottom: 20 }} />
                  <h3 style={{ color: LightMode ? "#000" : "#fff", marginBottom: 10 }}>View Ratings</h3>
                  <p style={{ color: LightMode ? "#555" : "#ccc" }}>Check your ratings and see what others think</p>
                </div>
              </div>
            </div>
          }
        />
        <Route path="/login" element={<Login setAuth={setAuth} LightMode={LightMode} setLightMode={setLightMode} />} />
        <Route path="/student/:userid" element={<StudentProfile LightMode={LightMode} />} />
        <Route path="/teacher/:teacherid" element={<TeacherProfile LightMode={LightMode} />} />
        <Route path="/admin" element={<AdminProfile LightMode={LightMode} />} />
      </Routes>
    </div>
  );
}

export default App;
