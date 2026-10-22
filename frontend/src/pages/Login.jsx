import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LogIn,
  Lock,
  Mail,
  Sparkles,
} from "lucide-react";

import "../styles/Login.css";
import { loginUser } from "../services/authService";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});

  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const navigate = useNavigate();

  function handleEmailChange(event) {
    setEmail(event.target.value);
    setErrors({});
  }

  function handlePasswordChange(event) {
    setPassword(event.target.value);
    setErrors({});
  }

  async function handleLogin(event) {
    event.preventDefault();
    setErrors({});

    try {
      const response = await loginUser({
        email: email.trim(),
        password,
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({
          form:
            typeof data.detail === "string"
              ? data.detail
              : "Invalid email or password.",
        });
        return;
      }

      localStorage.setItem("userId", data.id);
      navigate("/home", { replace: true });
    } catch {
      setErrors({
        form: "Unable to connect to the server. Please try again.",
      });
    }
  }

  function handleEmailKeyDown(event) {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();

    if (emailRef.current.checkValidity()) {
      passwordRef.current?.focus();
    } else {
      emailRef.current.reportValidity();
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-icon">
          <Sparkles size={30} />
        </div>

        <p className="login-eyebrow">WAYFARER</p>

        <h1>Welcome Back</h1>

        <p className="login-subtitle">
          Sign in to continue your journey.
        </p>

        <form onSubmit={handleLogin}>
          <div className="login-field">

            <div className="login-input">
              <Mail size={18} />

              <input
                ref={emailRef}
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={handleEmailChange}
                onKeyDown={handleEmailKeyDown}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="login-field">

            <div className="login-input">
              <Lock size={18} />

              <input
                ref={passwordRef}
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={handlePasswordChange}
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          {errors.form && (
            <p className="login-error" role="alert">
              {errors.form}
            </p>
          )}

          <button type="submit">
            <LogIn size={18} />
            <span>Login</span>
          </button>
        </form>

        <div className="register-link">
          Don't have an account?{" "}
          <Link to="/register">Sign Up</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;