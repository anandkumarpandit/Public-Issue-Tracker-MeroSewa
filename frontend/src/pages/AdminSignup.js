import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./AdminLogin.css"; // Reusing AdminLogin styles
import apiClient from "../services/apiClient";

const AdminSignup = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        registrationSecret: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSignup = async (e) => {
        e.preventDefault();

        // Prevent rapid submissions (debouncing)
        if (loading) return;

        setError("");
        setSuccess("");
        setLoading(true);

        try {
            const data = await apiClient.registerAdmin(formData);
            setSuccess(data.message);
            setTimeout(() => {
                navigate("/admin/login");
            }, 2000);
        } catch (err) {
            // Improved error messages
            if (err.message.includes("timeout")) {
                setError("Registration is taking longer than expected. Please check your connection and try again.");
            } else {
                setError(err.message || "Registration failed");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-wrap">
            <div className="login-html">
                <h2 style={{ textAlign: "center", fontWeight: 700, marginBottom: "1rem" }}>
                    👤 Admin Portal
                </h2>

                <input
                    id="tab-1"
                    type="radio"
                    name="tab"
                    className="sign-in"
                    defaultChecked
                />
                <label htmlFor="tab-1" className="tab">Sign Up</label>

                <div className="login-form">
                    <div className="sign-in-htm">
                        <form onSubmit={handleSignup}>
                            {error && (
                                <div style={{ color: "red", marginBottom: 12, fontSize: "0.9rem" }}>
                                    {error}
                                </div>
                            )}
                            {success && (
                                <div style={{ color: "green", marginBottom: 12, fontSize: "0.9rem" }}>
                                    {success}
                                </div>
                            )}

                            <div className="group">
                                <label htmlFor="username" className="label">Username</label>
                                <input
                                    id="username"
                                    type="text"
                                    className="input"
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="group">
                                <label htmlFor="email" className="label">Email</label>
                                <input
                                    id="email"
                                    type="email"
                                    className="input"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="group">
                                <label htmlFor="password" className="label">Password</label>
                                <input
                                    id="password"
                                    type="password"
                                    className="input"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    minLength="8"
                                />
                            </div>

                            <div className="group">
                                <label htmlFor="registrationSecret" className="label">Secret Key</label>
                                <input
                                    id="registrationSecret"
                                    type="password"
                                    className="input"
                                    value={formData.registrationSecret}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="group">
                                <input
                                    type="submit"
                                    className="button"
                                    value={loading ? "Signing up..." : "Sign Up"}
                                    disabled={loading}
                                />
                            </div>

                            <div className="hr"></div>
                            <div className="foot-lnk">
                                <Link to="/admin/login">Already have an account? Sign In</Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSignup;
