import React, { useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./AdminLogin.css";
import apiClient from "../services/apiClient";

const AdminLogin = () => {
  const navigate = useNavigate();

  // Sign-in state
  const [signinUsername, setSigninUsername] = useState("");
  const [signinPassword, setSigninPassword] = useState("");
  const [keepSigned, setKeepSigned] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = useCallback(async (e) => {
    e.preventDefault();

    // Prevent rapid submissions (debouncing)
    if (loading) return;

    setError("");
    setLoading(true);
    try {
      const data = await apiClient.login(signinUsername, signinPassword);
      if (data && data.token) {
        const token = data.token;
        const user = data.user;
        if (keepSigned) {
          localStorage.setItem("authToken", token);
          localStorage.setItem("user", JSON.stringify(user));
        } else {
          sessionStorage.setItem("authToken", token);
          sessionStorage.setItem("user", JSON.stringify(user));
        }
        // Notify other tabs/components
        try { window.dispatchEvent(new Event("authChanged")); } catch (e) { }
        navigate("/admin");
      } else {
        setError(data.message || "Invalid admin credentials");
      }
    } catch (err) {
      console.error(err);
      // Improved error messages
      if (err.message.includes("timeout")) {
        setError("Login is taking longer than expected. Please check your connection and try again.");
      } else if (err.message.includes("Session expired")) {
        setError("Session expired. Please login again.");
      } else {
        setError(err.message || "Connection error. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [loading, signinUsername, signinPassword, keepSigned, navigate]);

  return (
    <div className="login-wrap">
      <div className="login-html">

        <h2 style={{ textAlign: "center", fontWeight: 700, marginBottom: "1rem" }}>
          👤 Admin Portal
        </h2>


        {/* SIGN IN TAB ONLY */}
        <input
          id="tab-1"
          type="radio"
          name="tab"
          className="sign-in"
          defaultChecked
        />
        <label htmlFor="tab-1" className="tab">Sign In</label>

        <div className="login-form">
          <div className="sign-in-htm">
            <form onSubmit={handleSignIn}>
              {error && (
                <div style={{ color: "red", marginBottom: 12, fontSize: "0.9rem" }}>
                  {error}
                </div>
              )}

              {/* Username */}
              <div className="group">
                <label htmlFor="signin-user" className="label">
                  Username
                </label>
                <input
                  id="signin-user"
                  type="text"
                  className="input"
                  value={signinUsername}
                  onChange={(e) => setSigninUsername(e.target.value)}
                  required
                />
              </div>

              {/* Password */}
              <div className="group">
                <label htmlFor="signin-pass" className="label">
                  Password
                </label>
                <input
                  id="signin-pass"
                  type="password"
                  className="input"
                  value={signinPassword}
                  onChange={(e) => setSigninPassword(e.target.value)}
                  required
                />
              </div>

              {/* Keep me signed in */}
              <div className="group">
                <input
                  id="check"
                  type="checkbox"
                  className="check"
                  checked={keepSigned}
                  onChange={(e) => setKeepSigned(e.target.checked)}
                />
                <label htmlFor="check">Keep me signed in</label>
              </div>

              {/* Submit */}
              <div className="group">
                <input
                  type="submit"
                  className="button"
                  value={loading ? "Signing in..." : "Sign In"}
                  disabled={loading}
                />
              </div>

              <div className="hr"></div>
              <div className="foot-lnk">
                <Link to="/admin/signup">Create an Account</Link>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminLogin;
