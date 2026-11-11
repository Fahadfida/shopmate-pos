import React, { useState, useEffect } from "react";

const getIpc = () =>
  window.require ? window.require("electron").ipcRenderer : null;

export default function SupplierLedger({ currentUser }) {
  // Directory & Data States
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [ledgerEntries, setLedgerEntries] = useState([]);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState("active"); // 'all' | 'active' | 'archived' | 'due' | 'clear'

  // Modal Controls
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Form States
  const [supplierForm, setSupplierForm] = useState({
    id: null,
    name: "",
    company: "",
    phone: "",
    address: "",
    avatar: "",
    credit_limit: 0,
    opening_balance: 0,
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    payment_method: "CASH",
    notes: "",
  });

  // 1. Data Loaders
  const loadSuppliers = async () => {
    const ipc = getIpc();
    if (ipc) {
      // Pass filter mode to fetch all records (including archived) for client sorting
      const data = await ipc.invoke("get-suppliers", true);
      setSuppliers(data || []);

      if (selectedSupplier) {
        const refreshed = (data || []).find(
          (s) => s.id === selectedSupplier.id,
        );
        if (refreshed) {
          setSelectedSupplier(refreshed);
          loadLedger(refreshed.id);
        } else {
          setSelectedSupplier(null);
          setLedgerEntries([]);
        }
      }
    }
  };

  const loadLedger = async (supplierId) => {
    const ipc = getIpc();
    if (ipc) {
      const entries = await ipc.invoke("get-supplier-ledger", supplierId);
      setLedgerEntries(entries || []);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const selectSupplier = (supp) => {
    setSelectedSupplier(supp);
    loadLedger(supp.id);
  };

  // 2. Avatar Uploader Handler (Base64 Conversion)
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSupplierForm((prev) => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // 3. Register / Edit Supplier Handler
  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    const ipc = getIpc();
    if (!supplierForm.name.trim()) return alert("Supplier name is required.");

    if (ipc) {
      const handlerName = isEditing ? "update-supplier" : "add-supplier";
      const payload = isEditing
        ? { supplier: supplierForm, currentUser }
        : { supplier: supplierForm, currentUser };

      const res = await ipc.invoke(handlerName, payload);

      if (res.success) {
        setIsAddEditModalOpen(false);
        resetSupplierForm();
        loadSuppliers();
      } else {
        alert(`Error saving supplier: ${res.error}`);
      }
    }
  };

  const resetSupplierForm = () => {
    setSupplierForm({
      id: null,
      name: "",
      company: "",
      phone: "",
      address: "",
      avatar: "",
      credit_limit: 0,
      opening_balance: 0,
    });
    setIsEditing(false);
  };

  const openEditModal = () => {
    if (!selectedSupplier) return;
    setSupplierForm({
      id: selectedSupplier.id,
      name: selectedSupplier.name || "",
      company: selectedSupplier.company || "",
      phone: selectedSupplier.phone || "",
      address: selectedSupplier.address || "",
      avatar: selectedSupplier.avatar || "",
      credit_limit: selectedSupplier.credit_limit || 0,
      opening_balance: 0, // Disabled on edit
    });
    setIsEditing(true);
    setIsAddEditModalOpen(true);
  };

  // 4. Archive / Reactivate Handler with Payable Guard
  const handleToggleArchive = async (supp) => {
    const target = supp || selectedSupplier;
    if (!target) return;

    if (currentUser?.role !== "ADMIN") {
      return alert("Access Denied: Manager (ADMIN) permissions required.");
    }

    if (target.balance > 0 && target.is_active === 1) {
      return alert(
        "Cannot archive vendor while payable balance is due. Please settle balance first.",
      );
    }

    const actionText = target.is_active === 1 ? "archive" : "reactivate";
    if (
      !window.confirm(
        `Are you sure you want to ${actionText} supplier "${target.name}"?`,
      )
    ) {
      return;
    }

    const ipc = getIpc();
    if (ipc) {
      const res = await ipc.invoke("toggle-archive-supplier", {
        supplierId: target.id,
        is_active: target.is_active === 1 ? 0 : 1,
        currentUser,
      });

      if (res.success) {
        if (selectedSupplier?.id === target.id) {
          setSelectedSupplier(null);
          setLedgerEntries([]);
        }
        loadSuppliers();
      } else {
        alert(`Archive Error: ${res.error}`);
      }
    }
  };

  // 5. Record Payment Handler
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    const ipc = getIpc();
    const amt = parseFloat(paymentForm.amount);
    if (!amt || amt <= 0) return alert("Enter a valid payment amount.");

    if (ipc) {
      const res = await ipc.invoke("record-supplier-payment", {
        supplier_id: selectedSupplier.id,
        amount: amt,
        payment_method: paymentForm.payment_method,
        notes: paymentForm.notes,
        currentUser,
      });

      if (res.success) {
        setIsPaymentModalOpen(false);
        setPaymentForm({ amount: "", payment_method: "CASH", notes: "" });
        loadSuppliers();
      } else {
        alert(`Payment Error: ${res.error}`);
      }
    }
  };

  // 6. Corporate A4 PDF Document Generator
  const handleExportA4PDF = async () => {
    const ipc = getIpc();
    if (ipc && selectedSupplier) {
      const rowsHtml = ledgerEntries
        .map(
          (e) => `
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #334155;">${e.date}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #334155;">${e.description}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: bold; color: #059669; text-align: right;">${e.debit > 0 ? `Rs. ${e.debit.toLocaleString()}` : "-"}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: bold; color: #dc2626; text-align: right;">${e.credit > 0 ? `Rs. ${e.credit.toLocaleString()}` : "-"}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: bold; color: #0f172a; text-align: right;">Rs. ${e.balance_after?.toLocaleString()}</td>
        </tr>
      `,
        )
        .join("");

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Supplier Ledger - ${selectedSupplier.name}</title>
            <style>
              @page { size: A4 portrait; margin: 15mm; }
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #0f172a; background: #fff; margin: 0; }
              .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0d5c75; padding-bottom: 16px; margin-bottom: 24px; }
              .title-area h1 { margin: 0; color: #0d5c75; font-size: 22px; text-transform: uppercase; letter-spacing: 0.5px; }
              .title-area p { margin: 4px 0 0 0; font-size: 12px; color: #64748b; }
              .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px 18px; margin-bottom: 24px; font-size: 13px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
              table { width: 100%; border-collapse: collapse; margin-top: 8px; }
              th { background: #f1f5f9; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; padding: 10px; text-align: left; border-bottom: 2px solid #cbd5e1; }
              .right { text-align: right; }
              .total-card { margin-top: 24px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 16px; text-align: right; float: right; width: 280px; }
              .total-card .label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; }
              .total-card .amount { font-size: 20px; font-weight: 900; color: #dc2626; margin-top: 4px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title-area">
                <h1>Supplier Account Statement</h1>
                <p>ShopMate Enterprise Business Intelligence & Accounting</p>
              </div>
              <div style="text-align: right;">
                <p style="margin: 0; font-weight: bold; font-size: 13px;">Issued Date: ${new Date().toLocaleDateString()}</p>
                <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">Status: ${selectedSupplier.is_active === 1 ? "Active Profile" : "Archived"}</p>
              </div>
            </div>

            <div class="meta-box">
              <div>
                <strong>Vendor Name:</strong> ${selectedSupplier.name}<br/>
                <strong>Company / Agency:</strong> ${selectedSupplier.company || "N/A"}<br/>
                <strong>Credit Limit:</strong> Rs. ${selectedSupplier.credit_limit?.toLocaleString()}
              </div>
              <div>
                <strong>Contact Phone:</strong> ${selectedSupplier.phone || "N/A"}<br/>
                <strong>Address:</strong> ${selectedSupplier.address || "N/A"}
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Description / Reference</th>
                  <th class="right">Paid (-)</th>
                  <th class="right">Credit (+)</th>
                  <th class="right">Balance Due</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>

            <div class="total-card">
              <div class="label">Total Outstanding Payable</div>
              <div class="amount">Rs. ${selectedSupplier.balance?.toLocaleString()}</div>
            </div>
          </body>
        </html>
      `;

      const res = await ipc.invoke("export-ledger-pdf", html);
      if (res.success && !res.canceled) {
        alert(
          `✅ Corporate A4 Statement exported successfully:\n${res.filePath}`,
        );
      } else if (!res.canceled) {
        alert(`PDF Export failed: ${res.error}`);
      }
    }
  };

  // 7. Client-Side Directory Filtering logic
  const filteredSuppliers = suppliers.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.company &&
        s.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.phone && s.phone.includes(searchQuery));

    if (!matchesSearch) return false;

    if (filterMode === "active")
      return s.is_active === 1 || s.is_active === undefined;
    if (filterMode === "archived") return s.is_active === 0;
    if (filterMode === "due")
      return s.balance > 0 && (s.is_active === 1 || s.is_active === undefined);
    if (filterMode === "clear")
      return s.balance <= 0 && (s.is_active === 1 || s.is_active === undefined);
    return true; // 'all'
  });

  return (
    <div
      style={{
        display: "flex",
        gap: "16px",
        height: "calc(100vh - 90px)",
        overflow: "hidden",
      }}
    >
      {/* 🚚 LEFT COLUMN: SUPPLIER DIRECTORY FEED */}
      <div
        className="card"
        style={{
          flex: "1.1",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          padding: "14px",
          background: "#fff",
          borderRadius: "8px",
          border: "1px solid #e2e8f0",
          overflow: "hidden",
        }}
      >
        {/* DIRECTORY HEADER & ADD ACTION */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h4
              style={{
                margin: 0,
                color: "#0f172a",
                fontSize: "0.95rem",
                fontWeight: "bold",
              }}
            >
              🚚 Supplier Directory
            </h4>
            <span style={{ fontSize: "0.68rem", color: "#64748b" }}>
              Showing {filteredSuppliers.length} records
            </span>
          </div>
          <button
            className="btn btn-primary"
            style={{
              fontSize: "0.72rem",
              padding: "6px 12px",
              background: "#0d5c75",
              fontWeight: "bold",
            }}
            onClick={() => {
              resetSupplierForm();
              setIsAddEditModalOpen(true);
            }}
          >
            + Register Supplier
          </button>
        </div>

        {/* BREADCRUMB FILTER PILLS */}
        <div
          style={{
            display: "flex",
            gap: "4px",
            background: "#f1f5f9",
            padding: "4px",
            borderRadius: "6px",
          }}
        >
          {[
            { id: "active", label: "Active" },
            { id: "due", label: "Balance Due" },
            { id: "clear", label: "Clear" },
            { id: "archived", label: "Archived" },
            { id: "all", label: "All" },
          ].map((pill) => (
            <button
              key={pill.id}
              className="btn"
              style={{
                flex: 1,
                fontSize: "0.65rem",
                padding: "4px 2px",
                border: "none",
                borderRadius: "4px",
                fontWeight: filterMode === pill.id ? "bold" : "normal",
                background: filterMode === pill.id ? "#fff" : "transparent",
                color: filterMode === pill.id ? "#0d5c75" : "#64748b",
                boxShadow:
                  filterMode === pill.id
                    ? "0 1px 2px rgba(0,0,0,0.05)"
                    : "none",
              }}
              onClick={() => setFilterMode(pill.id)}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* SEARCH BAR */}
        <input
          type="text"
          className="input-field"
          placeholder="🔍 Search name, company, phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ margin: 0, padding: "7px 10px", fontSize: "0.75rem" }}
        />

        {/* SUPPLIER DIRECTORY LIST */}
        <div
          style={{
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            flex: 1,
          }}
        >
          {filteredSuppliers.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                color: "#94a3b8",
                padding: "30px 0",
                fontSize: "0.75rem",
              }}
            >
              No matching supplier records found.
            </div>
          ) : (
            filteredSuppliers.map((supp) => {
              const isSelected = selectedSupplier?.id === supp.id;
              const hasPayable = supp.balance > 0;
              const isArchived = supp.is_active === 0;

              return (
                <div
                  key={supp.id}
                  onClick={() => selectSupplier(supp)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    background: isSelected
                      ? "#e0f2fe"
                      : isArchived
                        ? "#f8fafc"
                        : "#fff",
                    border: isSelected
                      ? "1px solid #0284c7"
                      : "1px solid #f1f5f9",
                    opacity: isArchived ? 0.7 : 1,
                  }}
                >
                  {/* AVATAR / INITIAL BADGE */}
                  {supp.avatar ? (
                    <img
                      src={supp.avatar}
                      alt={supp.name}
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: isArchived ? "#94a3b8" : "#f59e0b",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                        fontSize: "0.8rem",
                        flexShrink: 0,
                      }}
                    >
                      {supp.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: "bold",
                        fontSize: "0.8rem",
                        color: "#1e293b",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {supp.name}{" "}
                      {isArchived && (
                        <span style={{ fontSize: "0.65rem", color: "#d97706" }}>
                          (Archived)
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "#64748b" }}>
                      {supp.company || supp.phone || "No Agency Info"}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div
                      className="monospace"
                      style={{
                        fontSize: "0.82rem",
                        fontWeight: "bold",
                        color: hasPayable ? "#dc2626" : "#059669",
                      }}
                    >
                      Rs. {supp.balance?.toLocaleString()}
                    </div>
                    <div style={{ fontSize: "0.6rem", color: "#64748b" }}>
                      {hasPayable ? "Payable" : "Clear"}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 📋 RIGHT COLUMN: COMPREHENSIVE A4 STATEMENT & WORKSPACE */}
      <div
        className="card"
        style={{
          flex: "2.3",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "16px",
          background: "#fff",
          borderRadius: "8px",
          border: "1px solid #e2e8f0",
          overflow: "hidden",
        }}
      >
        {selectedSupplier ? (
          <>
            {/* VENDOR HEADER & ACTIONS TOOLBAR */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid #e2e8f0",
                paddingBottom: "10px",
                marginBottom: "10px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                {selectedSupplier.avatar ? (
                  <img
                    src={selectedSupplier.avatar}
                    alt={selectedSupplier.name}
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "2px solid #0d5c75",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      background:
                        selectedSupplier.is_active === 0
                          ? "#94a3b8"
                          : "#f59e0b",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                      fontSize: "1rem",
                    }}
                  >
                    {selectedSupplier.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3
                    style={{ margin: 0, color: "#1e293b", fontSize: "1.05rem" }}
                  >
                    {selectedSupplier.name}
                  </h3>
                  <div style={{ fontSize: "0.72rem", color: "#64748b" }}>
                    Company:{" "}
                    <strong>{selectedSupplier.company || "N/A"}</strong> |
                    Phone: <strong>{selectedSupplier.phone || "N/A"}</strong>
                  </div>
                </div>
              </div>

              {/* ACTION TOOLBAR PILLS */}
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  className="btn btn-success"
                  style={{
                    fontSize: "0.72rem",
                    padding: "6px 12px",
                    background: "#10b981",
                    color: "#fff",
                    fontWeight: "bold",
                  }}
                  onClick={() => setIsPaymentModalOpen(true)}
                >
                  💵 Pay Supplier
                </button>
                <button
                  className="btn"
                  style={{
                    fontSize: "0.72rem",
                    padding: "6px 10px",
                    background: "#e0f2fe",
                    color: "#0369a1",
                    fontWeight: "bold",
                    border: "none",
                  }}
                  onClick={openEditModal}
                >
                  ✏️ Edit Profile
                </button>
                <button
                  className="btn btn-primary"
                  style={{
                    fontSize: "0.72rem",
                    padding: "6px 10px",
                    background: "#0d5c75",
                    color: "#fff",
                  }}
                  onClick={handleExportA4PDF}
                >
                  📥 Export A4 PDF
                </button>

                {/* ARCHIVE / REACTIVATE BUTTON WITH PAYABLE LOCK TOOLTIP GUARD */}
                {currentUser?.role === "ADMIN" && (
                  <div
                    style={{ position: "relative", display: "inline-block" }}
                  >
                    <button
                      className="btn"
                      disabled={
                        selectedSupplier.balance > 0 &&
                        selectedSupplier.is_active === 1
                      }
                      title={
                        selectedSupplier.balance > 0 &&
                        selectedSupplier.is_active === 1
                          ? "Cannot archive vendor while payable balance is due."
                          : "Archive or Reactivate Supplier Profile"
                      }
                      style={{
                        fontSize: "0.72rem",
                        padding: "6px 10px",
                        background:
                          selectedSupplier.balance > 0 &&
                          selectedSupplier.is_active === 1
                            ? "#f1f5f9"
                            : selectedSupplier.is_active === 1
                              ? "#fef3c7"
                              : "#dcfce7",
                        color:
                          selectedSupplier.balance > 0 &&
                          selectedSupplier.is_active === 1
                            ? "#94a3b8"
                            : selectedSupplier.is_active === 1
                              ? "#d97706"
                              : "#15803d",
                        fontWeight: "bold",
                        border: "none",
                        cursor:
                          selectedSupplier.balance > 0 &&
                          selectedSupplier.is_active === 1
                            ? "not-allowed"
                            : "pointer",
                      }}
                      onClick={() => handleToggleArchive(selectedSupplier)}
                    >
                      {selectedSupplier.is_active === 1
                        ? "📦 Archive"
                        : "🔄 Reactivate"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* TRANSACTIONS AUDIT TABLE */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.2fr 2fr 1fr 1fr 1.1fr",
                  fontSize: "0.7rem",
                  fontWeight: "bold",
                  background: "navy",
                  padding: "8px",
                  borderRadius: "4px",
                  borderBottom: "1px solid #cbd5e0",
                }}
              >
                <span>TIMESTAMP</span>
                <span>DESCRIPTION / REFERENCE</span>
                <span style={{ textAlign: "right" }}>PAID (-)</span>
                <span style={{ textAlign: "right" }}>CREDIT (+)</span>
                <span style={{ textAlign: "right" }}>BALANCE DUE</span>
              </div>

              {ledgerEntries.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    color: "#94a3b8",
                    padding: "40px 0",
                    fontSize: "0.75rem",
                  }}
                >
                  No ledger transaction records found for this vendor.
                </div>
              ) : (
                ledgerEntries.map((entry) => (
                  <div
                    key={entry.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1.2fr 2fr 1fr 1fr 1.1fr",
                      fontSize: "0.74rem",
                      alignItems: "center",
                      background: "#fff",
                      padding: "7px 8px",
                      borderBottom: "1px solid #f1f5f9",
                    }}
                  >
                    <span style={{ fontSize: "0.68rem", color: "#64748b" }}>
                      {entry.date}
                    </span>
                    <span style={{ color: "#334155" }}>
                      {entry.description}
                    </span>
                    <span
                      className="monospace"
                      style={{
                        textAlign: "right",
                        color: entry.debit > 0 ? "#059669" : "#94a3b8",
                        fontWeight: entry.debit > 0 ? "bold" : "normal",
                      }}
                    >
                      {entry.debit > 0
                        ? `Rs. ${entry.debit.toLocaleString()}`
                        : "—"}
                    </span>
                    <span
                      className="monospace"
                      style={{
                        textAlign: "right",
                        color: entry.credit > 0 ? "#dc2626" : "#94a3b8",
                        fontWeight: entry.credit > 0 ? "bold" : "normal",
                      }}
                    >
                      {entry.credit > 0
                        ? `Rs. ${entry.credit.toLocaleString()}`
                        : "—"}
                    </span>
                    <span
                      className="monospace"
                      style={{
                        textAlign: "right",
                        fontWeight: "bold",
                        color: "#0d5c75",
                      }}
                    >
                      Rs. {entry.balance_after?.toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* STATEMENT FOOTER SUMMARY */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderTop: "2px solid #e2e8f0",
                paddingTop: "10px",
                marginTop: "8px",
              }}
            >
              <span style={{ fontSize: "0.72rem", color: "#64748b" }}>
                Supplier ID: #{selectedSupplier.id} | Address:{" "}
                {selectedSupplier.address || "N/A"}
              </span>
              <div
                style={{
                  fontSize: "0.95rem",
                  fontWeight: "bold",
                  color: "#1e293b",
                }}
              >
                Total Payable Balance:{" "}
                <span
                  className="monospace"
                  style={{
                    color: selectedSupplier.balance > 0 ? "#dc2626" : "#059669",
                  }}
                >
                  Rs. {selectedSupplier.balance?.toLocaleString()}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div
            style={{ textAlign: "center", color: "#a0aec0", margin: "auto" }}
          >
            <h4>
              👈 Select a supplier profile from the directory to view payables
              statement.
            </h4>
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* 🛠️ MODALS (ADD / EDIT & RECORD PAYMENT)     */}
      {/* ========================================== */}

      {/* REGISTER / EDIT SUPPLIER MODAL WITH AVATAR */}
      {isAddEditModalOpen && (
        <div className="receipt-modal-backdrop">
          <div
            className="card"
            style={{
              width: "420px",
              background: "#fff",
              padding: "20px",
              borderRadius: "8px",
            }}
          >
            <h3 style={{ margin: "0 0 12px 0", color: "#0d5c75" }}>
              {isEditing
                ? "✏️ Edit Supplier Profile"
                : "+ Register New Supplier"}
            </h3>

            <form
              onSubmit={handleSaveSupplier}
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {/* AVATAR PREVIEW & UPLOADER */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  background: "#f8fafc",
                  padding: "8px",
                  borderRadius: "6px",
                }}
              >
                {supplierForm.avatar ? (
                  <img
                    src={supplierForm.avatar}
                    alt="Preview"
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      background: "#cbd5e1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.7rem",
                      color: "#475569",
                    }}
                  >
                    No Pic
                  </div>
                )}
                <div>
                  <label
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: "bold",
                      color: "#475569",
                    }}
                  >
                    Profile Picture / Badge
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    style={{ fontSize: "0.7rem", marginTop: "2px" }}
                  />
                </div>
              </div>

              <input
                type="text"
                className="input-field"
                value={supplierForm.name}
                onChange={(e) =>
                  setSupplierForm({ ...supplierForm, name: e.target.value })
                }
                placeholder="Supplier / Vendor Full Name*"
                required
              />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                }}
              >
                <input
                  type="text"
                  className="input-field"
                  value={supplierForm.company}
                  onChange={(e) =>
                    setSupplierForm({
                      ...supplierForm,
                      company: e.target.value,
                    })
                  }
                  placeholder="Company / Agency"
                />
                <input
                  type="text"
                  className="input-field"
                  value={supplierForm.phone}
                  onChange={(e) =>
                    setSupplierForm({ ...supplierForm, phone: e.target.value })
                  }
                  placeholder="Phone Number"
                />
              </div>

              <input
                type="text"
                className="input-field"
                value={supplierForm.address}
                onChange={(e) =>
                  setSupplierForm({ ...supplierForm, address: e.target.value })
                }
                placeholder="Office / Warehouse Address"
              />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                }}
              >
                <div>
                  <label style={{ fontSize: "0.68rem", color: "#64748b" }}>
                    Credit Limit (Rs.)
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    value={supplierForm.credit_limit}
                    onChange={(e) =>
                      setSupplierForm({
                        ...supplierForm,
                        credit_limit: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                {!isEditing && (
                  <div>
                    <label style={{ fontSize: "0.68rem", color: "#64748b" }}>
                      Opening Debt (Rs.)
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      value={supplierForm.opening_balance}
                      onChange={(e) =>
                        setSupplierForm({
                          ...supplierForm,
                          opening_balance: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, background: "#0d5c75", fontWeight: "bold" }}
                >
                  {isEditing ? "Update Profile" : "Save Supplier"}
                </button>
                <button
                  type="button"
                  className="btn"
                  style={{ background: "#cbd5e0" }}
                  onClick={() => setIsAddEditModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT SETTLEMENT MODAL */}
      {isPaymentModalOpen && (
        <div className="receipt-modal-backdrop">
          <div
            className="card"
            style={{
              width: "380px",
              background: "#fff",
              padding: "18px",
              borderRadius: "8px",
            }}
          >
            <h3 style={{ margin: "0 0 10px 0", color: "#10b981" }}>
              💵 Pay Supplier / Vendor
            </h3>
            <form
              onSubmit={handleRecordPayment}
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              <div>
                <label style={{ fontSize: "0.7rem", color: "#64748b" }}>
                  Payment Amount (Rs.)
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="input-field"
                  value={paymentForm.amount}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, amount: e.target.value })
                  }
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: "0.7rem", color: "#64748b" }}>
                  Payment Method
                </label>
                <select
                  className="input-field"
                  value={paymentForm.payment_method}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      payment_method: e.target.value,
                    })
                  }
                >
                  <option value="CASH">Cash Counter</option>
                  <option value="BANK">Bank Transfer</option>
                  <option value="CHEQUE">Cheque / Demand Draft</option>
                </select>
              </div>

              <input
                type="text"
                className="input-field"
                value={paymentForm.notes}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, notes: e.target.value })
                }
                placeholder="Reference Notes / Cheque #"
              />

              <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                <button
                  type="submit"
                  className="btn btn-success"
                  style={{
                    flex: 1,
                    background: "#10b981",
                    color: "#fff",
                    fontWeight: "bold",
                  }}
                >
                  Confirm Payment
                </button>
                <button
                  type="button"
                  className="btn"
                  style={{ background: "#cbd5e0" }}
                  onClick={() => setIsPaymentModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
