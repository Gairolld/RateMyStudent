import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function Header({ onSearch, query, setQuery, LightMode, auth, handleLogout, myStudentId, myUserId, myRole, searchResults, searching }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const [inputWidth, setInputWidth] = useState(0);

  useEffect(() => {
    if (inputRef.current) {
      setInputWidth(inputRef.current.offsetWidth);
    }
  }, [query, LightMode]);

  const showSearch = location.pathname !== "/login";

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    setShowDropdown(true);
  };

  const handleResultClick = (studentId) => {
    setShowDropdown(false);
    setQuery("");
    navigate(`/student/${studentId}`);
  };

  const handleBlur = (e) => {
    setTimeout(() => setShowDropdown(false), 120);
  };

  return (
    <header style={{
      background: LightMode ? "#2563eb" : "#1a1a2e",
      color: "#fff",
      padding: "20px 0 10px 0",
      marginBottom: 30,
      boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
      position: "sticky",
      top: 0,
      zIndex: 1000
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        maxWidth: 900,
        margin: "0 auto",
        padding: "0 20px"
      }}>
        <h1 style={{ cursor: "pointer", fontWeight: 700, fontSize: 32, letterSpacing: 1 }} onClick={() => navigate("/")}>RateMyStudent</h1>
        <div>
          {auth && auth.loggedIn ? (
            <>
              {myStudentId && (
                <button onClick={() => navigate(`/student/${myStudentId}`)} style={buttonStyle}>Profile</button>
              )}
              {myRole === "teacher" && myUserId && (
                <button onClick={() => navigate(`/teacher/${myUserId}`)} style={buttonStyle}>Profile</button>
              )}
              {myRole === "admin" && (
                <button onClick={() => navigate(`/admin`)} style={buttonStyle}>Profile</button>
              )}
              <button onClick={handleLogout} style={{ ...buttonStyle, background: "#ef4444" }}>Logout</button>
            </>
          ) : (
            location.pathname !== "/login" && (
              <button onClick={() => navigate("/login") } style={buttonStyle}>Login</button>
            )
          )}
        </div>
      </div>
      {showSearch && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 18, position: "relative" }}>
          <input
            ref={inputRef}
            type="text"
            placeholder="Find a Student"
            value={query}
            onChange={handleInputChange}
            onFocus={() => setShowDropdown(true)}
            onBlur={handleBlur}
            style={{
              padding: "10px",
              fontSize: "16px",
              width: "320px",
              borderRadius: 6,
              border: "1px solid #ccc",
              marginRight: 8,
              color: LightMode ? "#000" : "#fff",
              background: LightMode ? "#fff" : "#222"
            }}
            autoComplete="off"
          />
          {showDropdown && query.trim() && (
            <div
              ref={dropdownRef}
              style={{
                position: "absolute",
                left: "50%",
                top: 48,
                transform: "translateX(-50%)",
                width: inputWidth || 320,
                background: LightMode ? "#fff" : "#23243a",
                color: LightMode ? "#111" : "#f3f4f6",
                border: "1px solid #ccc",
                borderRadius: 8,
                boxShadow: "0 4px 16px rgba(0,0,0,0.13)",
                zIndex: 2000,
                maxHeight: 320,
                overflowY: "auto"
              }}
            >
              {searching ? (
                <div style={{ padding: 16, textAlign: "center" }}>Searching...</div>
              ) : searchResults && searchResults.length > 0 ? (
                searchResults.slice(0, 8).map((student) => (
                  <div
                    key={student._id}
                    onMouseDown={() => handleResultClick(student._id)}
                    style={{
                      padding: "10px 18px",
                      cursor: "pointer",
                      borderBottom: LightMode ? "1px solid #f1f1f1" : "1px solid #23243a",
                      fontWeight: 500,
                      fontSize: 16,
                      background: "none"
                    }}
                  >
                    {student.name} <span style={{ color: LightMode ? "#666" : "#d1d5db", fontWeight: 400, fontSize: 14 }}>({student.school})</span>
                  </div>
                ))
              ) : (
                <div style={{ padding: 16, color: LightMode ? "#888" : "#d1d5db", textAlign: "center" }}>No students found.</div>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
}

const buttonStyle = {
  padding: "8px 18px",
  fontSize: "16px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 500,
  marginLeft: 8
};

export default Header;
