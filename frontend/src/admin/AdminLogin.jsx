import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./styles/AdminLogin.css";

function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleLogin = (event) => {
    event.preventDefault();

    if (username === "admin" && password === "123") {
      navigate("/admin/home");
      return;
    }

    setError("Invalid username or password");
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <span className="admin-login-eyebrow">WAYFARER</span>

        <h1>Admin Login</h1>

        <p className="admin-login-subtitle">
          Sign in to manage destinations.
        </p>

        <form onSubmit={handleLogin}>
          <div className="admin-login-field">
            <label htmlFor="username">Username</label>

            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Enter username"
            />
          </div>

          <div className="admin-login-field">
            <label htmlFor="password">Password</label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
            />
          </div>

          {error && <p className="admin-login-error">{error}</p>}

          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;