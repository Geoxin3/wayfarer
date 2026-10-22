import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn, Lock, ShieldCheck, User } from "lucide-react";
import "./styles/AdminLogin.css";

function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});

  const usernameRef = useRef(null);
  const passwordRef = useRef(null);

  const navigate = useNavigate();

  const handleUsernameChange = (event) => {
    setUsername(event.target.value);
    setErrors({});
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
    setErrors({});
  };

  const handleUsernameKeyDown = (event) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();

    if (usernameRef.current.checkValidity()) {
      passwordRef.current?.focus();
    } else {
      usernameRef.current.reportValidity();
    }
  };

  const handleLogin = (event) => {
    event.preventDefault();
    setErrors({});

    if (username === "admin" && password === "123") {
      navigate("/admin/home");
      return;
    }

    setErrors({ form: "Invalid username or password." });
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-icon" aria-hidden="true">
          <ShieldCheck size={26} strokeWidth={1.8} />
        </div>

        <span className="admin-login-eyebrow">WAYFARER</span>

        <h1>Admin Login</h1>

        <p className="admin-login-subtitle">
          Sign in to manage destinations.
        </p>

        <form onSubmit={handleLogin}>
          <div className="admin-login-field">
            <div className="admin-login-input">
              <User size={16} aria-hidden="true" />

              <input
                ref={usernameRef}
                id="username"
                name="username"
                type="text"
                value={username}
                onChange={handleUsernameChange}
                onKeyDown={handleUsernameKeyDown}
                placeholder="Enter username"
                aria-label="Username"
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className="admin-login-field">
            <div className="admin-login-input">
              <Lock size={16} aria-hidden="true" />

              <input
                ref={passwordRef}
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="Enter password"
                aria-label="Password"
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          {errors.form && (
            <p className="admin-login-error" role="alert">
              {errors.form}
            </p>
          )}

          <button type="submit">
            <LogIn size={16} aria-hidden="true" />
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;