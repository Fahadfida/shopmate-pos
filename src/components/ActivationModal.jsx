import React, { useState, useEffect } from "react";

const getIpc = () => window.require ? window.require("electron").ipcRenderer : null;

export default function ActivationModal({ onActivated }) {
  const [machineId, setMachineId] = useState("");
  const [licenseKeyInput, setLicenseKeyInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchMachineId = async () => {
      const ipc = getIpc();
      if (ipc) {
        const res = await ipc.invoke("get-machine-id");
        if (res.success) {
          setMachineId(res.machineId);
        } else {
          setErrorMsg("Failed to retrieve hardware ID: " + res.error);
        }
      }
    };
    fetchMachineId();
  }, []);

  const handleActivate = async (e) => {
    e.preventDefault();
    const ipc = getIpc();
    if (ipc) {
      const res = await ipc.invoke("activate-license", licenseKeyInput);
      if (res.success) {
        alert(`✅ ShopMate activated successfully for: ${res.payload.shop}!`);
        if (onActivated) onActivated(res.payload);
        window.location.reload();
      } else {
        setErrorMsg("❌ Activation failed: " + res.error);
      }
    }
  };

  return (
    <div className="receipt-modal-backdrop">
      <div className="card" style={{ width: "460px", background: "#ffffff", padding: "28px", borderRadius: "8px", border: "1px solid #d1d9e2" }}>
        <h3 style={{ margin: "0 0 6px 0", color: "#0a1128", fontWeight: "800" }}>🔐 ShopMate License Activation</h3>
        <p style={{ fontSize: "0.78rem", color: "#53647c", marginBottom: "20px" }}>
          This copy of ShopMate requires an active license key to unlock business management tools. 
        </p>

        {errorMsg && (
          <div style={{ background: "#fef2f2", color: "#991b1b", padding: "10px 14px", borderRadius: "6px", fontSize: "0.8rem", marginBottom: "14px", border: "1px solid #fecaca", fontWeight: "600" }}>
            {errorMsg}
          </div>
        )}

        {/* Hardware ID Box */}
        <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: "6px", border: "1px solid #d1d9e2", marginBottom: "16px" }}>
          <div style={{ fontSize: "0.7rem", fontWeight: "700", color: "#53647c", textTransform: "uppercase" }}>Your Terminal Hardware ID</div>
          <div className="monospace" style={{ fontSize: "0.82rem", fontWeight: "bold", color: "#034078", userSelect: "all", marginTop: "4px", wordBreak: "break-all" }}>
            {machineId || "Generating hardware fingerprint..."}
          </div>
          <button 
            type="button"
            className="btn" 
            style={{ marginTop: "8px", fontSize: "0.7rem", padding: "4px 10px", background: "#1282a2", color: "#fff" }}
            onClick={() => { 
              navigator.clipboard.writeText(machineId); 
              alert("Hardware ID copied to clipboard! Send this to your vendor."); 
            }}
          >
            📋 Copy Hardware ID
          </button>
        </div>

        {/* Activation Form */}
        <form onSubmit={handleActivate} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ fontSize: "0.78rem", fontWeight: "700", color: "#0a1128" }}>Paste Activation Key</label>
            <textarea
              className="input-field monospace"
              rows="3"
              value={licenseKeyInput}
              onChange={(e) => setLicenseKeyInput(e.target.value)}
              placeholder="Paste your signed cryptographic license key here..."
              required
              style={{ fontSize: "0.75rem", padding: "8px" }}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ padding: "11px", fontWeight: "700", background: "#1282a2", color: "#fefcfb", marginTop: "4px" }}>
            🔑 Activate Software
          </button>
        </form>
      </div>
    </div>
  );
}