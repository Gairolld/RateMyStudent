import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function Header({ onSearch, query, setQuery, LightMode, auth, handleLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  // only show search bar on some pages (AKA not login)
  const showSearch = location.pathname !== "/login";

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
            <button onClick={handleLogout} style={{ ...buttonStyle, background: "#ef4444" }}>Logout</button>
          ) : (
            location.pathname !== "/login" && (
              <button onClick={() => navigate("/login") } style={buttonStyle}>Login</button>
            )
          )}
        </div>
      </div>
      {showSearch && (
        <form onSubmit={e => { e.preventDefault(); onSearch && onSearch(); }} style={{ display: "flex", justifyContent: "center", marginTop: 18 }}>
          <input
            type="text"
            placeholder="Find a Student"
            value={query}
            onChange={e => setQuery(e.target.value)}
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
          />
        </form>
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

