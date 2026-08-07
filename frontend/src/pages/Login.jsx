import { useState } from "react";
import "../styles/Login.css";
import { loginUser } from "../services/authService";
import { Link,useNavigate } from "react-router-dom";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const navigate = useNavigate();

    async function handleLogin(event) {
        event.preventDefault();

        const response = await loginUser({
            email,
            password,
        });

        const data = await response.json();

        if (response.ok) {
            navigate("/home");
        } else {
            alert(data.detail);
        }
    }

    return (
        <div className="login-container">
            <div className="login-box">

                <h1>Wayfarer</h1>
                <p>Welcome back</p>

                <form onSubmit={handleLogin}>
                    <div className="input-box">
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-box">
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit">
                        Login
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