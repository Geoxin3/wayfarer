import { useState } from "react";
import "../styles/Register.css";
import { registerUser } from "../services/authService";
import { Link, useNavigate } from "react-router-dom";

function Register() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const navigate = useNavigate();

    async function handleRegister(event) {
        event.preventDefault();

        const response = await registerUser({
            name,
            email,
            password,
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.message);

            setTimeout(() => {
                navigate("/");
            }, 2000);
        } else {
            alert(data.detail);
        }
    }
    
    return (
        <div className="register-container">
            <div className="register-box">
                <h1>Wayfarer</h1>
                <p>Create your account</p>

                <form onSubmit={handleRegister }>
                    <div className="input-box">
                        <input
                            type="text"
                            placeholder="Full Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

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

                    <div className="input-box">
                        <input
                            type="password"
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit">
                        Create Account
                    </button>
                </form>

                <div className="login-link">
                    Already have an account?{" "}
                    <Link to="/">Login</Link>
                </div>
            </div>
        </div>
    );
}

export default Register;