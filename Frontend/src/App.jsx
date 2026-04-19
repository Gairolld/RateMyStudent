import { useState, useEffect } from "react";
import { FaUser } from "react-icons/fa";
import myImage from "./assets/pic1.jpg";
import myImage2 from "./assets/pic2.jpg";
import myImage3 from "./assets/pic3.webp";
import { Routes, Route, useNavigate } from "react-router-dom";
import Login from "./Login";
import StudentProfile from "./StudentProfile";
import SearchResults from "./SearchResults";
import "./App.css";

function App() {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [auth, setAuth] = useState({ loggedIn: false });
  const [LightMode, setLightMode] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/search", { credentials: "include" })
      .then((res) => {
        if (res.status === 200) setAuth({ loggedIn: true });
        else setAuth({ loggedIn: false });
      })
      .catch(() => setAuth({ loggedIn: false }));
  }, []);

  // search students
  const handleSearch = async (e) => {
    e.preventDefault();
    setSearching(true);
    setSearchResults([]);
    try {
      const res = await fetch(`/search?name=${encodeURIComponent(query)}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      } else {
        setSearchResults([]);
      }
    } catch {
      setSearchResults([]);
    }
    setSearching(false);
  };

  // logout
  const handleLogout = async () => {
    await fetch("/logout", { method: "POST", credentials: "include" });
    setAuth({ loggedIn: false });
    navigate("/login");
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div style={{ backgroundColor: LightMode ? "#ffffff" : "#121212", minHeight: "100vh" }}>
            {/* Top bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: LightMode ? "#000000" : "#ffffff" }}>
              <h1 style={{ cursor: "pointer" }} onClick={() => navigate("/")}>Rate My Student</h1>
              <div>
                {auth.loggedIn ? (
                  <button onClick={handleLogout} style={{ ...buttonStyle, backgroundColor: "#ef4444" }}>Logout</button>
                ) : (
                  <>
                    <button onClick={() => navigate("/login")} style={buttonStyle}><FaUser /> Login</button>
                    {/* remove Sign Up button after use */}
                  </>
                )}
              </div>
            </div>

            {/* actual search bar */}
            <form onSubmit={handleSearch} style={{ display: "flex", justifyContent: "center", marginTop: "100px" }}>
              <input
                type="text"
                placeholder="Find a Student"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ padding: "10px", fontSize: "16px", width: "300px", color: LightMode ? "#000000" : "#ffffff" }}
              />
              <button type="submit" style={{ ...buttonStyle, marginLeft: 8 }}>Search</button>
            </form>
            {searching && <div style={{ textAlign: "center" }}>Searching...</div>}
            {searchResults.length > 0 && <SearchResults results={searchResults} />}

            {/* images and lore */}
            <div style={{ display: "flex", justifyContent: "space-between", gap: "0px", marginTop: "100px", marginLeft: "40px", marginRight: "40px" }}>
              <img src={myImage} alt="My image" style={{ padding: "20px 0px", width: "275px", height: "183px", objectFit: "cover" }} />
              <img src={myImage2} alt="My image" style={{ padding: "20px 0px", width: "275px", height: "183px", objectFit: "cover" }} />
              <img src={myImage3} alt="My image" style={{ padding: "20px 0px", width: "275px", height: "183px", objectFit: "cover" }} />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: "0px", marginTop: "20px", marginLeft: "40px", marginRight: "40px" }}>
              <p style={{ padding: "0px 0px", width: "275px", color: LightMode ? "#000000" : "#ffffff" }}>Do you want to give your student a rating?</p>
              <p style={{ padding: "0px 0px", width: "275px", color: LightMode ? "#000000" : "#ffffff" }}>Wish you could do something about a student's bad behavior?</p>
              <p style={{ padding: "0px 0px", width: "275px", color: LightMode ? "#000000" : "#ffffff" }}>Want to see what your rating is?</p>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "300px" }}>
              <button onClick={() => setLightMode(!LightMode)} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", fontSize: "16px", backgroundColor: LightMode ? "#000000" : "#ffffff", color: LightMode ? "#ffffff" : "#000000", border: "none", borderRadius: "8px", cursor: "pointer", transition: "0.2s" }}>
                {!LightMode && "Light Mode"}
                {LightMode && "Dark Mode"}
              </button>
            </div>
          </div>
        }
      />
      <Route path="/login" element={<Login setAuth={setAuth} />} />
      <Route path="/student/:userid" element={<StudentProfile />} />
    </Routes>
  );
}

const buttonStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "10px 18px",
  fontSize: "16px",
  backgroundColor: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  transition: "0.2s"
};

export default App;
