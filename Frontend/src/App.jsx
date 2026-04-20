import { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Login from "./Login";
import StudentProfile from "./StudentProfile";
import TeacherProfile from "./TeacherProfile";
import AdminProfile from "./AdminProfile";
import SearchResults from "./SearchResults";
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

  // live search as you type
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

  // logout
  const handleLogout = async () => {
    await fetch("/logout", { method: "POST", credentials: "include" });
    setAuth({ loggedIn: false, studentId: null, userId: null, role: null });
    navigate("/login");
  };

  const handleSearch = () => {
    if (query.trim()) {
      navigate("/");
    }
  };

  return (
    <div
      className={LightMode ? "theme-light" : "theme-dark"}
      style={{ backgroundColor: LightMode ? "#fff" : "#121212", minHeight: "100vh" }}
    >
      <Header
        onSearch={handleSearch}
        query={query}
        setQuery={setQuery}
        LightMode={LightMode}
        auth={auth}
        handleLogout={handleLogout}
        myStudentId={auth.studentId}
        myUserId={auth.userId}
        myRole={auth.role}
      />
      <Routes>
        <Route
          path="/"
          element={
            <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
              {searching && <div style={{ textAlign: "center" }}>Searching...</div>}
              {searchResults.length > 0 && <SearchResults results={searchResults} LightMode={LightMode} />}
              {/* Images and info */}
              <div style={{ display: "flex", justifyContent: "space-between", gap: "0px", marginTop: "60px" }}>
                <img src={myImage} alt="My image" style={{ padding: "20px 0px", width: "275px", height: "183px", objectFit: "cover", borderRadius: 12 }} />
                <img src={myImage2} alt="My image" style={{ padding: "20px 0px", width: "275px", height: "183px", objectFit: "cover", borderRadius: 12 }} />
                <img src={myImage3} alt="My image" style={{ padding: "20px 0px", width: "275px", height: "183px", objectFit: "cover", borderRadius: 12 }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "0px", marginTop: "20px" }}>
                <p style={{ width: "275px", color: LightMode ? "#000" : "#fff" }}>Do you want to give your student a rating?</p>
                <p style={{ width: "275px", color: LightMode ? "#000" : "#fff" }}>Wish you could do something about a student's bad behavior?</p>
                <p style={{ width: "275px", color: LightMode ? "#000" : "#fff" }}>Want to see what your rating is?</p>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "120px" }}>
                <button
                  onClick={() => setLightMode(!LightMode)}
                  style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", fontSize: "16px", backgroundColor: LightMode ? "#000" : "#fff", color: LightMode ? "#fff" : "#000", border: "none", borderRadius: "8px", cursor: "pointer", transition: "0.2s" }}>
                  {!LightMode && "Light Mode"}
                  {LightMode && "Dark Mode"}
                </button>
              </div>
            </div>
          }
        />
        <Route path="/login" element={<Login setAuth={setAuth} LightMode={LightMode} />} />
        <Route path="/student/:userid" element={<StudentProfile LightMode={LightMode} />} />
        <Route path="/teacher/:teacherid" element={<TeacherProfile LightMode={LightMode} />} />
        <Route path="/admin" element={<AdminProfile LightMode={LightMode} />} />
      </Routes>
    </div>
  );
}

export default App;
