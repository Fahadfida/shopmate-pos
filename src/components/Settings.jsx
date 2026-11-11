import React, { useState, useEffect } from "react";
import logoImage from "../assets/logo.png";

const getIpc = () =>
  window.require ? window.require("electron").ipcRenderer : null;

export default function Settings({ currentUser }) {
  const [activeSubTab, setActiveSubTab] = useState("shop");
  const [settings, setSettings] = useState({
    shop_name: "",
    shop_address: "",
    shop_phone: "",
    shop_logo: "",
    sku_format: "CAT_SEQ",
    cloud_provider: "NONE",
    cloud_sync_enabled: false,
    last_sync_time: "Never",
  });

  const [saveStatus, setSaveStatus] = useState("");
  const [backupStatus, setBackupStatus] = useState("");

  // --- ADMIN USER & PASSWORD MANAGEMENT STATES ---
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState("");

  const loadSettingsAndUsers = async () => {
    const ipc = getIpc();
    if (ipc) {
      const data = await ipc.invoke("get-settings");
      if (data) {
        setSettings((prev) => ({ ...prev, ...data }));
      }

      if (currentUser?.role?.toUpperCase() === "ADMIN") {
        const fetchedUsers = await ipc.invoke("get-users");
        setUsers(fetchedUsers || []);
      }
    }
  };

  useEffect(() => {
    loadSettingsAndUsers();
  }, [currentUser]);

  const handleSave = async (e) => {
    e.preventDefault();
    const ipc = getIpc();
    if (ipc) {
      const res = await ipc.invoke("save-settings", settings);
      if (res && res.success) {
        setSaveStatus("✅ Settings saved successfully!");
        setTimeout(() => setSaveStatus(""), 3000);
      } else {
        alert("Error: " + (res?.error || "Unknown error"));
      }
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings((prev) => ({ ...prev, shop_logo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // --- PASSWORD UPDATE HANDLER (ADMIN ONLY) ---
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (currentUser?.role?.toUpperCase() !== "ADMIN") {
      return alert(
        "Unauthorized: Only Admin accounts can change user passwords.",
      );
    }
    if (!selectedUserId) return alert("Please select a user operator.");
    if (!newPassword || newPassword.length < 4) {
      return alert("Password must be at least 4 characters long.");
    }

    const ipc = getIpc();
    if (ipc) {
      const res = await ipc.invoke("update-user-password", {
        userId: parseInt(selectedUserId),
        newPassword,
        currentUser,
      });

      if (res && res.success) {
        setPasswordStatus("✅ Operator password updated successfully!");
        setNewPassword("");
        setSelectedUserId("");
        setTimeout(() => setPasswordStatus(""), 4000);
      } else {
        alert("Failed to update password: " + (res?.error || "Unknown error"));
      }
    }
  };

  // --- DATABASE BACKUP & RESTORE HANDLERS ---
  const handleExportBackup = async () => {
    const ipc = getIpc();
    if (ipc) {
      setBackupStatus("⏳ Generating backup file...");
      const res = await ipc.invoke("export-database-backup");
      if (res && res.success) {
        setBackupStatus("✅ Backup saved successfully to: " + res.filePath);
      } else if (res && res.canceled) {
        setBackupStatus("");
      } else {
        setBackupStatus("❌ Backup failed: " + (res?.error || "Unknown error"));
      }
    } else {
      alert("Backup feature requires Electron desktop environment.");
    }
  };

  const handleRestoreBackup = async () => {
    const confirmed = window.confirm(
      "⚠️ WARNING: Restoring a database backup will overwrite all current sales, inventory, and khata records with the backup file data. Are you sure you want to proceed?",
    );
    if (!confirmed) return;

    const ipc = getIpc();
    if (ipc) {
      setBackupStatus("⏳ Restoring database...");
      const res = await ipc.invoke("restore-database-backup");
      if (res && res.success) {
        alert(
          "✅ Database restored successfully! The application will now reload.",
        );
        window.location.reload();
      } else if (res && res.canceled) {
        setBackupStatus("");
      } else {
        setBackupStatus(
          "❌ Restore failed: " + (res?.error || "Unknown error"),
        );
      }
    }
  };

  const handleCloudConnect = async (provider) => {
    const ipc = getIpc();
    if (ipc) {
      const res = await ipc.invoke("link-cloud-account", provider);
      if (res && res.success) {
        setSettings((prev) => ({
          ...prev,
          cloud_provider: provider,
          cloud_sync_enabled: true,
        }));
      } else {
        alert("Failed to open browser: " + (res?.error || "Unknown error"));
      }
    }
  };

  const handleCloudDisconnect = () => {
    setSettings((prev) => ({
      ...prev,
      cloud_provider: "NONE",
      cloud_sync_enabled: false,
    }));
    alert("🔌 Cloud sync disconnected.");
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        height: "calc(100vh - 100px)",
        overflow: "hidden",
      }}
    >
      <div className="page-title">⚙️ Settings & System Administration</div>

      {/* Modern Pill Sub-Tab Navigation */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
          background: "#ffffff",
          padding: "8px",
          borderRadius: "10px",
          border: "1px solid #e2e8f0",
        }}
      >
        <button
          type="button"
          className={"btn " + (activeSubTab === "shop" ? "btn-primary" : "")}
          style={{
            background: activeSubTab === "shop" ? "#1b75bc" : "transparent",
            color: activeSubTab === "shop" ? "#fff" : "#475569",
            fontSize: "0.78rem",
            border: "none",
            borderRadius: "6px",
            fontWeight: "700",
            padding: "8px 14px",
            cursor: "pointer",
          }}
          onClick={() => setActiveSubTab("shop")}
        >
          🏬 Shop Info & SKU
        </button>

        <button
          type="button"
          className={
            "btn " + (activeSubTab === "security" ? "btn-primary" : "")
          }
          style={{
            background: activeSubTab === "security" ? "#1b75bc" : "transparent",
            color: activeSubTab === "security" ? "#fff" : "#475569",
            fontSize: "0.78rem",
            border: "none",
            borderRadius: "6px",
            fontWeight: "700",
            padding: "8px 14px",
            cursor: "pointer",
          }}
          onClick={() => setActiveSubTab("security")}
        >
          🔒 Security & Passwords{" "}
          {currentUser?.role?.toUpperCase() !== "ADMIN" && "(Admin Only)"}
        </button>

        <button
          type="button"
          className={"btn " + (activeSubTab === "backup" ? "btn-primary" : "")}
          style={{
            background: activeSubTab === "backup" ? "#1b75bc" : "transparent",
            color: activeSubTab === "backup" ? "#fff" : "#475569",
            fontSize: "0.78rem",
            border: "none",
            borderRadius: "6px",
            fontWeight: "700",
            padding: "8px 14px",
            cursor: "pointer",
          }}
          onClick={() => setActiveSubTab("backup")}
        >
          💾 Backup
        </button>

        <button
          type="button"
          className={"btn " + (activeSubTab === "about" ? "btn-primary" : "")}
          style={{
            background: activeSubTab === "about" ? "#1b75bc" : "transparent",
            color: activeSubTab === "about" ? "#fff" : "#475569",
            fontSize: "0.78rem",
            border: "none",
            borderRadius: "6px",
            fontWeight: "700",
            padding: "8px 14px",
            cursor: "pointer",
          }}
          onClick={() => setActiveSubTab("about")}
        >
          ℹ️ About & Support
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", paddingBottom: "20px" }}>
        {/* SHOP INFO SUB-TAB */}
        {activeSubTab === "shop" && (
          <div
            className="card"
            style={{
              maxWidth: "680px",
              background: "#fff",
              padding: "24px",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
            }}
          >
            <h4
              style={{
                margin: "0 0 4px 0",
                color: "#1e293b",
                fontWeight: "800",
              }}
            >
              Custom Receipt Headers & SKU Configuration
            </h4>
            <p
              style={{
                fontSize: "0.78rem",
                color: "#64748b",
                marginBottom: "16px",
              }}
            >
              These details will automatically display on all 80mm thermal
              receipt prints and inventory auto-sku generators.
            </p>

            {saveStatus && (
              <div
                style={{
                  background: "#f0fdf4",
                  color: "#15803d",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  fontSize: "0.8rem",
                  marginBottom: "14px",
                  border: "1px solid #bbf7d0",
                  fontWeight: "600",
                }}
              >
                {saveStatus}
              </div>
            )}

            <form
              onSubmit={handleSave}
              style={{ display: "flex", flexDirection: "column", gap: "14px" }}
            >
              <div>
                <label
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: "700",
                    color: "#334155",
                  }}
                >
                  Shop / Business Name
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={settings.shop_name || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, shop_name: e.target.value })
                  }
                  placeholder="e.g. ShopMate Gaming & Tech"
                  required
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: "700",
                    color: "#334155",
                  }}
                >
                  Shop Physical Address
                </label>
                <textarea
                  className="input-field"
                  rows="2"
                  value={settings.shop_address || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, shop_address: e.target.value })
                  }
                  placeholder="e.g. Shop #42, Main Plaza, Saddar Market"
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: "700",
                    color: "#334155",
                  }}
                >
                  Contact Phone / Helpline
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={settings.shop_phone || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, shop_phone: e.target.value })
                  }
                  placeholder="e.g. +92 300 1234567"
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: "700",
                    color: "#334155",
                  }}
                >
                  Automated SKU Generation Format
                </label>
                <select
                  className="input-field"
                  value={settings.sku_format || "CAT_SEQ"}
                  onChange={(e) =>
                    setSettings({ ...settings, sku_format: e.target.value })
                  }
                >
                  <option value="CAT_SEQ">
                    Category Prefix + Sequential (e.g. ELE-0001)
                  </option>
                  <option value="NAME_SEQ">
                    Name Abbreviation + Sequential (e.g. WHP-0001)
                  </option>
                  <option value="TIMESTAMP">
                    Epoch Timestamp Hex (e.g. TS-19FA8C)
                  </option>
                  <option value="NUMERIC">
                    Pure Numeric (e.g. 1001, 1002)
                  </option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: "700",
                    color: "#334155",
                  }}
                >
                  Shop Logo (Displays on Receipt)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  style={{ marginTop: "6px", fontSize: "0.8rem" }}
                />
                {settings.shop_logo && (
                  <div style={{ marginTop: "10px" }}>
                    <img
                      src={settings.shop_logo}
                      alt="Shop Logo"
                      style={{
                        maxHeight: "55px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e0",
                      }}
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: "11px", marginTop: "8px", fontWeight: "700" }}
              >
                💾 Save Shop Branding Settings
              </button>
            </form>
          </div>
        )}

        {/* ADMIN SECURITY & PASSWORD MANAGEMENT SUB-TAB */}
        {activeSubTab === "security" && (
          <div
            className="card"
            style={{
              maxWidth: "680px",
              background: "#fff",
              padding: "24px",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
            }}
          >
            <h4
              style={{
                margin: "0 0 4px 0",
                color: "#1e293b",
                fontWeight: "800",
              }}
            >
              🔒 Admin Password & Operator Security
            </h4>
            <p
              style={{
                fontSize: "0.78rem",
                color: "#64748b",
                marginBottom: "16px",
              }}
            >
              Securely update operator credentials and manager passwords. Strict
              RBAC enforcement is active.
            </p>

            {currentUser?.role?.toUpperCase() !== "ADMIN" ? (
              <div
                style={{
                  background: "#fef2f2",
                  color: "#991b1b",
                  padding: "14px",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                  border: "1px solid #fecaca",
                  fontWeight: "bold",
                }}
              >
                ⛔ Access Denied: Only Manager (ADMIN) accounts can access
                password management and security controls.
              </div>
            ) : (
              <>
                {passwordStatus && (
                  <div
                    style={{
                      background: "#f0fdf4",
                      color: "#15803d",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      fontSize: "0.8rem",
                      marginBottom: "14px",
                      border: "1px solid #bbf7d0",
                      fontWeight: "600",
                    }}
                  >
                    {passwordStatus}
                  </div>
                )}

                <form
                  onSubmit={handleUpdatePassword}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                  }}
                >
                  <div>
                    <label
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: "700",
                        color: "#334155",
                      }}
                    >
                      Select Operator Account
                    </label>
                    <select
                      className="input-field"
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      required
                    >
                      <option value="">-- Choose Staff Operator --</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.username} ({u.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: "700",
                        color: "#334155",
                      }}
                    >
                      New Secure Password
                    </label>
                    <input
                      type="password"
                      className="input-field"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min 4 chars)"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{
                      padding: "11px",
                      marginTop: "8px",
                      background: "#0d5c75",
                      fontWeight: "700",
                    }}
                  >
                    🔐 Update Operator Password
                  </button>
                </form>
              </>
            )}
          </div>
        )}

        {/* DATABASE BACKUP & CLOUD SYNC SUB-TAB */}
        {activeSubTab === "backup" && (
          <div
            style={{
              maxWidth: "680px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div
              className="card"
              style={{
                background: "#fff",
                padding: "24px",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
              }}
            >
              <h4
                style={{
                  margin: "0 0 6px 0",
                  color: "#1e293b",
                  fontWeight: "800",
                }}
              >
                💾 Local Database Backup & Recovery
              </h4>
              <p
                style={{
                  fontSize: "0.78rem",
                  color: "#64748b",
                  marginBottom: "16px",
                }}
              >
                Safeguard your business records. Export a complete copy of your
                SQLite database file (`.sqlite`) or restore from a previous
                archive.
              </p>

              {backupStatus && (
                <div
                  style={{
                    background: "#f8fafc",
                    color: "#0f172a",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    fontSize: "0.8rem",
                    marginBottom: "14px",
                    border: "1px solid #cbd5e0",
                    fontWeight: "600",
                  }}
                >
                  {backupStatus}
                </div>
              )}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                }}
              >
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{
                    padding: "12px",
                    fontWeight: "700",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                  }}
                  onClick={handleExportBackup}
                >
                  📥 Download Backup (.sqlite)
                </button>
                <button
                  type="button"
                  className="btn"
                  style={{
                    padding: "12px",
                    background: "#fee2e2",
                    color: "#dc2626",
                    fontWeight: "700",
                    fontSize: "0.8rem",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                  }}
                  onClick={handleRestoreBackup}
                >
                  🔄 Restore from Backup File
                </button>
              </div>
            </div>

            {/* Cloud Sync Integration */}
            {/* <div
              className="card"
              style={{
                background: "#fff",
                padding: "24px",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
              }}
            >
              <h4
                style={{
                  margin: "0 0 6px 0",
                  color: "#1e293b",
                  fontWeight: "800",
                }}
              >
                ☁️ Cloud Database Sync (Online Backup)
              </h4>
              <p
                style={{
                  fontSize: "0.78rem",
                  color: "#64748b",
                  marginBottom: "16px",
                }}
              >
                Connect your preferred cloud storage provider to automatically
                sync your SQLite WAL database file securely online.
              </p>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 14px",
                    background: "#f8fafc",
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <span style={{ fontSize: "1.3rem" }}>📁</span>
                    <div>
                      <div
                        style={{
                          fontWeight: "700",
                          fontSize: "0.82rem",
                          color: "#1e293b",
                        }}
                      >
                        Google Drive Sync
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#64748b" }}>
                        {settings.cloud_provider === "GOOGLE"
                          ? "🟢 Connected & Auto-syncing"
                          : "🔴 Not Connected"}
                      </div>
                    </div>
                  </div>

                  {settings.cloud_provider === "GOOGLE" ? (
                    <button
                      type="button"
                      className="btn"
                      style={{
                        background: "#fee2e2",
                        color: "#dc2626",
                        padding: "6px 12px",
                        fontSize: "0.75rem",
                        fontWeight: "700",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                      }}
                      onClick={handleCloudDisconnect}
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{
                        padding: "6px 12px",
                        fontSize: "0.75rem",
                        fontWeight: "700",
                        cursor: "pointer",
                      }}
                      onClick={() => handleCloudConnect("GOOGLE")}
                    >
                      Connect Google Drive
                    </button>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 14px",
                    background: "#f8fafc",
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <span style={{ fontSize: "1.3rem" }}>☁️</span>
                    <div>
                      <div
                        style={{
                          fontWeight: "700",
                          fontSize: "0.82rem",
                          color: "#1e293b",
                        }}
                      >
                        Microsoft OneDrive Sync
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#64748b" }}>
                        {settings.cloud_provider === "ONEDRIVE"
                          ? "🟢 Connected & Auto-syncing"
                          : "🔴 Not Connected"}
                      </div>
                    </div>
                  </div>

                  {settings.cloud_provider === "ONEDRIVE" ? (
                    <button
                      type="button"
                      className="btn"
                      style={{
                        background: "#fee2e2",
                        color: "#dc2626",
                        padding: "6px 12px",
                        fontSize: "0.75rem",
                        fontWeight: "700",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                      }}
                      onClick={handleCloudDisconnect}
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{
                        padding: "6px 12px",
                        fontSize: "0.75rem",
                        fontWeight: "700",
                        cursor: "pointer",
                      }}
                      onClick={() => handleCloudConnect("ONEDRIVE")}
                    >
                      Connect OneDrive
                    </button>
                  )}
                </div>
            </div>
                    </div> */}
          </div>
        )}

        {/* ABOUT SUB-TAB */}
        {activeSubTab === "about" && (
          <div
            className="card"
            style={{
              maxWidth: "680px",
              background: "#fff",
              padding: "24px",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
            }}
          >
            <h4
              style={{
                margin: "0 0 6px 0",
                color: "#1b75bc",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontWeight: "800",
              }}
            >
              <img
                src={logoImage}
                alt="ShopMate Logo"
                style={{
                  width: "22px",
                  height: "22px",
                  objectFit: "contain",
                  borderRadius: "4px",
                }}
              />
              About ShopMate Desktop POS
            </h4>
            <p
              style={{
                fontSize: "0.8rem",
                color: "#555",
                marginBottom: "16px",
              }}
            >
              ShopMate is an enterprise-grade, offline-first Windows POS & Khata
              management system built for high performance, accuracy, and
              reliability.
            </p>

            <div
              style={{
                background: "#f8fafc",
                padding: "16px",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                color: "#000",
              }}
            >
              <h5 style={{ margin: 0, color: "#1b75bc", fontWeight: "700" }}>
                Support & Developer Contact
              </h5>
              <div style={{ fontSize: "0.8rem" }}>
                <strong>Email:</strong> fahadfida400@gmail.com
              </div>
              <div style={{ fontSize: "0.8rem" }}>
                <strong>💬 WhatsApp:</strong> +92 331 546 9223
              </div>
              <div style={{ fontSize: "0.8rem" }}>
                <strong>💻 System Version:</strong> v1.0.0 (Offline Desktop WAL
                Edition)
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
