import { useState } from "react";
import { FaUser } from "react-icons/fa";
import myImage from "./assets/pic1.jpg";
import myImage2 from "./assets/pic2.jpg";
import myImage3 from "./assets/pic3.webp";
import { Routes, Route, useNavigate } from "react-router-dom";
import Login from "./Login";
import "./App.css";

function App() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const [LightMode, setLightMode] = useState(true);

  return (
    <Routes>
      <Route
        path="/"
        element={
          
          <div style={{ 
            backgroundColor: LightMode ? "#ffffff" : "#121212",
            minHeight: "100vh"
           }}>
            


            {/* Top bar */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
                color: LightMode ? "#000000": "#ffffff"
            }}>
            <h1>Rate My Student</h1>

              <button
                onClick={() => navigate("/login")}
                style={{
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
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = "#1d4ed8"}
                onMouseOut={(e) => e.target.style.backgroundColor = "#2563eb"}
              >
                <FaUser />
                Login
              </button>
            </div>


            
            {/* Search bar */}
            <div style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "100px"
            }}>
              <input
              type="text"
              placeholder="Find a Student"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                padding: "10px",
                fontSize: "16px",
                width: "300px",
                color: LightMode ? "#000000": "#ffffff"
              }}
              />
            </div>

            

            <div style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "0px",
              marginTop: "100px",
              marginLeft: "40px",
              marginRight: "40px",
            }}>

              <img 
              src={myImage} 
              alt="My image" 
              style={{
                padding: "20px 0px",
                width: "275px",
                height: "183px",
                objectFit: "cover"
              }}
              />

              <img 
              src={myImage2} 
              alt="My image" 
              style={{
                padding: "20px 0px",
                width: "275px",
                height: "183px",
                objectFit: "cover"
              }}
              />

              <img 
              src={myImage3} 
              alt="My image" 
              style={{
                padding: "20px 0px",
                width: "275px",
                height: "183px",
                objectFit: "cover"
              }}
              />
            </div>


            <div style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "0px",
              marginTop: "20px",
              marginLeft: "40px",
              marginRight: "40px"
            }}>
              <p style={{
                padding: "0px 0px",
                width: "275px",
                color: LightMode ? "#000000": "#ffffff"
              }}>
                Do you want to give your student a rating?
              </p>

              <p style={{
                padding: "0px 0px",
                width: "275px",
                color: LightMode ? "#000000": "#ffffff"
              }}>
                Wish you could do something about a student's bad behavoir?
              </p>

              <p style={{
                padding: "0px 0px",
                width: "275px",
                color: LightMode ? "#000000": "#ffffff"
              }}>
                Want to see what your rating is?
              </p>

            </div>
            
            <div style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: "300px"
            }}>
              <button
                onClick={() => setLightMode(!LightMode)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 20px",
                  fontSize: "16px",
                  backgroundColor: LightMode ? "#000000": "#ffffff",
                  color: LightMode ? "#ffffff": "#000000",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "0.2s"
                }}
              >
                {!LightMode && "Light Mode"}
                {LightMode && "Dark Mode"}
              </button>
            </div>

          </div>
        }
      />
      <Route path="/login" element={<Login />} />
    </Routes>
  );
}

export default App;