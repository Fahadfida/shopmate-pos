import React, { useState } from "react";
import bgImage from "../assets/login-bg.jpg"; // Import your background image asset
import logoImage from "../assets/logo.png";
const getIpc = () =>
  window.require ? window.require("electron").ipcRenderer : null;

export default function Login({ onLoginSuccess }) {
  const [loginForm, setLoginForm] = useState({
    username: "Manager",
    pin: "1234",
  });
  const [loginError, setLoginError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    const ipc = getIpc();

    if (!ipc) {
      onLoginSuccess({
        id: 1,
        username: loginForm.username,
        role: loginForm.username === "Manager" ? "ADMIN" : "CASHIER",
      });
      return;
    }

    const res = await ipc.invoke("login", loginForm);
    if (res.success) {
      onLoginSuccess(res.user);
    } else {
      setLoginError(res.error);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        justifyContent: "center",
        alignItems: "center",
        backgroundImage: `linear-gradient(rgba(26, 35, 50, 0.75), rgba(26, 35, 50, 0.85)), url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div
        className="card"
        style={{
          width: "360px",
          padding: "28px",
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
          borderRadius: "12px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            marginBottom: "8px",
          }}
        >
          <img
            src={logoImage}
            alt="ShopMate Logo"
            style={{
              width: "36px",
              height: "36px",
              objectFit: "contain",
              borderRadius: "4px",
            }}
          />
          <h2
            style={{
              margin: 0,
              color: "#0d5c75",
              fontSize: "1.5rem",
            }}
          >
            ShopMate POS
          </h2>
        </div>
        <p
          style={{
            textAlign: "center",
            fontSize: "0.85rem",
            color: "#555",
            marginBottom: "20px",
          }}
        >
          Sign in to access counter & accounts
        </p>

        {loginError && (
          <div
            style={{
              background: "#fde8e8",
              color: "#e53935",
              padding: "8px",
              fontSize: "0.8rem",
              borderRadius: "4px",
              marginBottom: "12px",
            }}
          >
            {loginError}
          </div>
        )}

        <form
          onSubmit={handleLogin}
          style={{ display: "flex", flexDirection: "column", gap: "14px" }}
        >
          <div>
            <label
              style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#333" }}
            >
              Username / Account
            </label>
            <select
              className="input-field"
              value={loginForm.username}
              onChange={(e) =>
                setLoginForm({ ...loginForm, username: e.target.value })
              }
            >
              <option value="Manager">Manager (Admin)</option>
              <option value="Cashier">Cashier (Standard)</option>
            </select>
          </div>
          <div>
            <label
              style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#333" }}
            >
              PIN Code
            </label>
            <input
              type="password"
              className="input-field"
              value={loginForm.pin}
              onChange={(e) =>
                setLoginForm({ ...loginForm, pin: e.target.value })
              }
              placeholder="Enter PIN"
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ marginTop: "8px", padding: "10px", fontWeight: "bold" }}
          >
            Sign In to ShopMate
          </button>
        </form>
        <div
          style={{
            fontSize: "0.75rem",
            color: "#666",
            textAlign: "center",
            marginTop: "16px",
          }}
        >
          Default PINs: Admin (1234) | Cashier (0000)
        </div>
      </div>
    </div>
  );
}
