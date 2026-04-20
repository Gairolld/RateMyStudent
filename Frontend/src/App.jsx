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
    fetch(`/api/search?name=${encodeURIComponent(query)}`, { credentials: "include" })
      .then(res => res.ok ? res.json() : [])
      .then(data => setSearchResults(data))
      .catch(() => setSearchResults([]))
      .finally(() => setSearching(false));
  }, [query]);

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST", credentials: "include" });
    setAuth({ loggedIn: false, studentId: null, userId: null, role: null });
    navigate("/login");
  };

  useEffect(() => {
    // add pop animation for images ONCE
    const styleId = 'pop-in-keyframes';
    if (!document.getElementById(styleId)) {
      const styleSheet = document.createElement('style');
      styleSheet.id = styleId;
      styleSheet.innerHTML = `@keyframes popIn { 0% { opacity: 0; transform: scale(0.7); } 80% { opacity: 1; transform: scale(1.05); } 100% { opacity: 1; transform: scale(1); } }`;
      document.head.appendChild(styleSheet);
    }
    return () => {
      const styleSheet = document.getElementById(styleId);
      if (styleSheet) {
        styleSheet.parentNode.removeChild(styleSheet);
      }
    };
  }, []);

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
                <h1 style={{ fontSize: "3rem", marginBottom: 20, color: LightMode ? "#18181b" : "#f9fafb", fontWeight: 800, letterSpacing: 1, textShadow: LightMode ? "0 2px 8px rgba(0,0,0,0.07)" : "0 2px 8px rgba(0,0,0,0.22)" }}>Welcome to RateMyStudent</h1>
                <p style={{ fontSize: "1.2rem", color: LightMode ? "#374151" : "#d1d5db", marginBottom: 40 }}>Connect, rate, and improve student experiences</p>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "32px", marginBottom: 60 }}>
                <div style={{ flex: 1, textAlign: "center", padding: 24, background: LightMode ? "rgba(59, 130, 246, 0.10)" : "rgba(96, 165, 250, 0.10)", borderRadius: 16, boxShadow: LightMode ? "0 2px 8px rgba(59,130,246,0.07)" : "0 2px 8px rgba(96,165,250,0.09)", transition: 'box-shadow 0.2s', animation: 'fadeInUp 0.7s cubic-bezier(.23,1.01,.32,1) 0.1s both' }}>
                  <img src={myImage} alt="Rate students" style={{ width: 140, height: 140, objectFit: "cover", borderRadius: "50%", marginBottom: 20, border: '4px solid #6366f1', boxShadow: '0 4px 16px rgba(99,102,241,0.13)', transition: 'box-shadow 0.2s', animation: 'popIn 0.7s cubic-bezier(.23,1.01,.32,1) 0.1s both' }} />
                  <h3 style={{ color: LightMode ? "#18181b" : "#f9fafb", marginBottom: 10, fontWeight: 700 }}>Rate Students</h3>
                  <p style={{ color: LightMode ? "#374151" : "#d1d5db" }}>Share your honest feedback to help students improve</p>
                </div>
                <div style={{ flex: 1, textAlign: "center", padding: 24, background: LightMode ? "rgba(59, 130, 246, 0.10)" : "rgba(96, 165, 250, 0.10)", borderRadius: 16, boxShadow: LightMode ? "0 2px 8px rgba(59,130,246,0.07)" : "0 2px 8px rgba(96,165,250,0.09)", transition: 'box-shadow 0.2s', animation: 'fadeInUp 0.7s cubic-bezier(.23,1.01,.32,1) 0.2s both' }}>
                  <img src={myImage2} alt="Address behavior" style={{ width: 140, height: 140, objectFit: "cover", borderRadius: "50%", marginBottom: 20, border: '4px solid #a78bfa', boxShadow: '0 4px 16px rgba(167,139,250,0.13)', transition: 'box-shadow 0.2s', animation: 'popIn 0.7s cubic-bezier(.23,1.01,.32,1) 0.2s both' }} />
                  <h3 style={{ color: LightMode ? "#18181b" : "#f9fafb", marginBottom: 10, fontWeight: 700 }}>Address Behavior</h3>
                  <p style={{ color: LightMode ? "#374151" : "#d1d5db" }}>Report and discuss student conduct issues</p>
                </div>
                <div style={{ flex: 1, textAlign: "center", padding: 24, background: LightMode ? "rgba(59, 130, 246, 0.10)" : "rgba(96, 165, 250, 0.10)", borderRadius: 16, boxShadow: LightMode ? "0 2px 8px rgba(59,130,246,0.07)" : "0 2px 8px rgba(96,165,250,0.09)", transition: 'box-shadow 0.2s', animation: 'fadeInUp 0.7s cubic-bezier(.23,1.01,.32,1) 0.3s both' }}>
                  <img src={myImage3} alt="View ratings" style={{ width: 140, height: 140, objectFit: "cover", borderRadius: "50%", marginBottom: 20, border: '4px solid #7c3aed', boxShadow: '0 4px 16px rgba(124,58,237,0.13)', transition: 'box-shadow 0.2s', animation: 'popIn 0.7s cubic-bezier(.23,1.01,.32,1) 0.3s both' }} />
                  <h3 style={{ color: LightMode ? "#18181b" : "#f9fafb", marginBottom: 10, fontWeight: 700 }}>View Ratings</h3>
                  <p style={{ color: LightMode ? "#374151" : "#d1d5db" }}>Check your ratings and see what others think</p>
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
