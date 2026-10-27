import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Lock,
  Mail,
  Sparkles,
  User,
} from "lucide-react";

import "../styles/Register.css";
import { registerUser } from "../services/authService";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");

  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  const navigate = useNavigate();

  function handleNameChange(event) {
    setName(event.target.value);
    setErrors({});
    setSuccess("");
  }

  function handleEmailChange(event) {
    setEmail(event.target.value);
    setErrors({});
    setSuccess("");
  }

  function handlePasswordChange(event) {
    setPassword(event.target.value);
    setErrors({});
    setSuccess("");
  }

  function handleConfirmPasswordChange(event) {
    setConfirmPassword(event.target.value);
    setErrors({});
    setSuccess("");
  }

  function handleEnterKey(event, currentRef, nextRef) {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();

    if (currentRef.current.checkValidity()) {
      nextRef.current?.focus();
    } else {
      currentRef.current.reportValidity();
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    setErrors({});
    setSuccess("");

    if (password !== confirmPassword) {
      setErrors({
        form: "Passwords do not match.",
      });
      confirmPasswordRef.current?.focus();
      return;
    }

    try {
      const response = await registerUser({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({
          form:
            typeof data.detail === "string"
              ? data.detail
              : "Unable to create your account.",
        });
        return;
      }

      setSuccess("Account created successfully! Please log in.");

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2000);
    } catch {
      setErrors({
        form: "Unable to connect to the server. Please try again.",
      });
    }
  }

  return (
    <div className="register-container">
      <div className="register-box">
        <div className="register-icon">
          <Sparkles size={30} />
        </div>

        <p className="register-eyebrow">WAYFARER</p>

        <h1>Create Account</h1>

        <p className="register-subtitle">
          Start planning your next adventure.
        </p>

        <form onSubmit={handleRegister}>
          <div className="input-box">

            <div className="register-input">
              <User size={18} />

              <input
                ref={nameRef}
                id="name"
                name="name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={handleNameChange}
                onKeyDown={(event) =>
                  handleEnterKey(event, nameRef, emailRef)
                }
                autoComplete="name"
                required
              />
            </div>
          </div>

          <div className="input-box">

            <div className="register-input">
              <Mail size={18} />

              <input
                ref={emailRef}
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={handleEmailChange}
                onKeyDown={(event) =>
                  handleEnterKey(event, emailRef, passwordRef)
                }
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="input-box">

            <div className="register-input">
              <Lock size={18} />

              <input
                ref={passwordRef}
                id="password"
                name="password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={handlePasswordChange}
                onKeyDown={(event) =>
                  handleEnterKey(
                    event,
                    passwordRef,
                    confirmPasswordRef
                  )
                }
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          <div className="input-box">

            <div className="register-input">
              <Lock size={18} />

              <input
                ref={confirmPasswordRef}
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          {errors.form && (
            <p className="register-error" role="alert">
              {errors.form}
            </p>
          )}

          {success && (
            <p className="register-success" role="status">
              {success}
            </p>
          )}

          <button type="submit">
            Create Account
          </button>
        </form>

        <div className="login-link">
          Already have an account?{" "}
          <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;